import os
import io
import tempfile
from django.http import FileResponse, HttpResponse, Http404
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ai_services.factory import get_ai_service
from .models import Resume, ResumeAnalysis, ResumeDraft
from .serializers import (
    ResumeSerializer,
    ResumeAnalysisSerializer,
    ResumeDraftSerializer,
)
from .parser import extract_resume_data
from .analyzer import analyze_resume_text

try:
    from ai_services.throttles import GroqAIRateThrottle
    AI_THROTTLE_CLASSES = [GroqAIRateThrottle]
except ImportError:
    AI_THROTTLE_CLASSES = []


SAMPLE_RESUME_DEFAULT = {
    "title": "Software Engineer Resume",
    "target_role": "Software Engineer",
    "personal_info": {
        "full_name": "JOHN DOE",
        "role_title": "SOFTWARE ENGINEER",
        "email": "john.doe@email.com",
        "phone": "+1 (555) 123-4567",
        "location": "San Francisco, CA",
        "linkedin": "linkedin.com/in/johndoe",
        "portfolio": "johndoe.dev",
    },
    "summary": (
        "Results-driven Software Engineer with experience building scalable web applications and "
        "cloud-based solutions. Skilled in JavaScript, Python, React, and Django. Passionate about "
        "creating efficient, user-centric products and collaborating with cross-functional teams."
    ),
    "skills": {
        "Languages": "JavaScript, TypeScript, Python, Java, SQL",
        "Frontend": "React, HTML5, CSS3, Bootstrap",
        "Backend": "Django, Django REST Framework, Node.js, RESTful APIs",
        "Database": "PostgreSQL, SQLite, MongoDB",
        "Tools": "Git, Docker, Postman, Linux",
    },
    "work_experience": [
        {
            "role": "Software Engineer",
            "company": "TechCorp Inc.",
            "location": "San Francisco, CA",
            "duration": "Jan 2023 - Present",
            "bullets": [
                "Developed and maintained scalable web applications using React, Python, and Django.",
                "Improved API response performance by 35% through database query optimization.",
                "Designed and implemented RESTful APIs serving 50K+ daily active users.",
            ],
        }
    ],
    "education": [
        {
            "degree": "Bachelor of Technology in Computer Science",
            "institution": "University Name",
            "location": "City, State",
            "graduation_date": "May 2023",
        }
    ],
    "projects": [
        {
            "title": "CareerAI Platform",
            "link": "github.com/username/careerai",
            "bullets": [
                "Built full-stack AI resume analyzer and mock interview simulator using React and Django.",
                "Integrated Groq LLM API for automated answer evaluation and ATS scoring.",
            ],
        }
    ],
    "certifications": ["AWS Certified Cloud Practitioner"],
    "achievements": ["Solved 300+ algorithmic problems across LeetCode and HackerRank"],
}


# ==========================================
# 1. Core Resume Management & ATS Analysis Views
# ==========================================

class ResumeListCreateView(generics.ListCreateAPIView):
    serializer_class = ResumeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        uploaded_file = self.request.FILES.get('file')
        ext = os.path.splitext(uploaded_file.name)[1].lower().replace('.', '')
        resume_instance = serializer.save(
            user=self.request.user,
            file_name=uploaded_file.name,
            file_size=uploaded_file.size,
            file_type=ext,
        )
        try:
            parsed_result = extract_resume_data(resume_instance.file.path, resume_instance.file_type)
            resume_instance.raw_text = parsed_result.get('raw_text', '')
            resume_instance.parsed_data = parsed_result
            resume_instance.is_parsed = True
            resume_instance.save()

            analysis_result = analyze_resume_text(resume_instance.raw_text, parsed_result)
            ResumeAnalysis.objects.update_or_create(
                resume=resume_instance,
                defaults=analysis_result,
            )
        except Exception:
            pass


class ResumeDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = ResumeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)


class ResumeParseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response({"error": "Resume not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            parsed_result = extract_resume_data(resume.file.path, resume.file_type)
            resume.raw_text = parsed_result.get('raw_text', '')
            resume.parsed_data = parsed_result
            resume.is_parsed = True
            resume.save()

            analysis_result = analyze_resume_text(resume.raw_text, parsed_result)
            analysis_obj, _ = ResumeAnalysis.objects.update_or_create(
                resume=resume,
                defaults=analysis_result,
            )

            return Response(
                {
                    "message": "Resume parsed and analyzed successfully.",
                    "resume": ResumeSerializer(resume, context={'request': request}).data,
                    "analysis": ResumeAnalysisSerializer(analysis_obj).data,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to process resume: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ResumeAnalyzeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response({"error": "Resume not found."}, status=status.HTTP_404_NOT_FOUND)

        if not hasattr(resume, 'analysis'):
            if not resume.is_parsed:
                parsed = extract_resume_data(resume.file.path, resume.file_type)
                resume.raw_text = parsed.get('raw_text', '')
                resume.parsed_data = parsed
                resume.is_parsed = True
                resume.save()
            analysis_data = analyze_resume_text(resume.raw_text, resume.parsed_data)
            analysis = ResumeAnalysis.objects.create(resume=resume, **analysis_data)
        else:
            analysis = resume.analysis

        return Response(ResumeAnalysisSerializer(analysis).data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response({"error": "Resume not found."}, status=status.HTTP_404_NOT_FOUND)

        if not resume.is_parsed:
            parsed = extract_resume_data(resume.file.path, resume.file_type)
            resume.raw_text = parsed.get('raw_text', '')
            resume.parsed_data = parsed
            resume.is_parsed = True
            resume.save()

        analysis_data = analyze_resume_text(resume.raw_text, resume.parsed_data)
        analysis, _ = ResumeAnalysis.objects.update_or_create(
            resume=resume,
            defaults=analysis_data,
        )

        return Response(ResumeAnalysisSerializer(analysis).data, status=status.HTTP_200_OK)


class SetPrimaryResumeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
            Resume.objects.filter(user=request.user, is_primary=True).update(is_primary=False)
            resume.is_primary = True
            resume.save()
            return Response({"message": f"{resume.file_name} is now primary."}, status=status.HTTP_200_OK)
        except Resume.DoesNotExist:
            return Response({"error": "Resume not found."}, status=status.HTTP_404_NOT_FOUND)


class DownloadResumeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
            if not os.path.exists(resume.file.path):
                raise Http404("File does not exist on disk.")
            return FileResponse(open(resume.file.path, 'rb'), as_attachment=True, filename=resume.file_name)
        except Resume.DoesNotExist:
            return Response({"error": "Resume not found."}, status=status.HTTP_404_NOT_FOUND)


# ==========================================
# 2. Resume-to-Profile Auto-Fill (Groq AI)
# ==========================================

class ResumeAutofillProfileView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = AI_THROTTLE_CLASSES

    def post(self, request):
        uploaded_file = request.FILES.get('file')
        resume_id = request.data.get('resume_id')
        save_flag = str(request.data.get('save_to_profile', 'true')).lower() in ('true', '1', 'yes')

        raw_text = ""

        if uploaded_file:
            ext = os.path.splitext(uploaded_file.name)[1].lower()
            if ext not in ('.pdf', '.docx'):
                return Response(
                    {"error": "Unsupported file format. Please upload a PDF or DOCX file."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            temp_path = None
            try:
                with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
                    for chunk in uploaded_file.chunks():
                        tmp.write(chunk)
                    temp_path = tmp.name

                parsed = extract_resume_data(temp_path, ext.lstrip('.'))
                raw_text = parsed.get('raw_text', '')
            except Exception as exc:
                return Response(
                    {"error": f"Failed to read uploaded resume: {str(exc)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            finally:
                if temp_path and os.path.exists(temp_path):
                    try:
                        os.remove(temp_path)
                    except OSError:
                        pass

        elif resume_id:
            resume = Resume.objects.filter(pk=resume_id, user=request.user).first()
            if not resume:
                return Response({"error": "Resume not found."}, status=status.HTTP_404_NOT_FOUND)
            if not resume.raw_text:
                parsed = extract_resume_data(resume.file.path, resume.file_type)
                resume.raw_text = parsed.get('raw_text', '')
                resume.parsed_data = parsed
                resume.is_parsed = True
                resume.save()
            raw_text = resume.raw_text
        else:
            return Response(
                {"error": "Provide either a resume file or a valid resume_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not raw_text.strip():
            return Response(
                {"error": "Could not extract readable text from the resume."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ai = get_ai_service()
        extracted = ai.extract_profile_from_resume(raw_text)

        if save_flag:
            user = request.user
            if extracted.get('first_name'):
                user.first_name = extracted['first_name'][:150]
            if extracted.get('last_name'):
                user.last_name = extracted['last_name'][:150]
            user.save(update_fields=['first_name', 'last_name'])

            profile = getattr(user, 'profile', None)
            if profile:
                field_map = {
                    'phone': 'phone',
                    'headline': 'headline',
                    'target_role': 'target_role',
                    'bio': 'bio',
                    'location': 'location',
                    'linkedin_url': 'linkedin_url',
                    'github_url': 'github_url',
                    'portfolio_url': 'portfolio_url',
                }
                for src_key, model_field in field_map.items():
                    if extracted.get(src_key) and hasattr(profile, model_field):
                        setattr(profile, model_field, extracted[src_key])

                if extracted.get('experience_years') is not None and hasattr(profile, 'experience_years'):
                    try:
                        profile.experience_years = float(extracted['experience_years'])
                    except (TypeError, ValueError):
                        pass

                if extracted.get('skills_list') and hasattr(profile, 'skills'):
                    profile.skills = extracted['skills_list']
                if extracted.get('education') and hasattr(profile, 'education'):
                    profile.education = extracted['education']
                if extracted.get('experience') and hasattr(profile, 'experience'):
                    profile.experience = extracted['experience']

                profile.save()

        return Response(
            {
                "message": "Profile extracted successfully.",
                "saved_to_profile": save_flag,
                "extracted_profile": extracted,
            },
            status=status.HTTP_200_OK,
        )


# ==========================================
# 3. AI Resume Builder, Groq Improver & Cover Letter Views
# ==========================================

class ResumeDraftListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        drafts = ResumeDraft.objects.filter(user=request.user)
        return Response(ResumeDraftSerializer(drafts, many=True).data)

    def post(self, request):
        data = request.data.copy()
        if not data.get('personal_info'):
            for k, v in SAMPLE_RESUME_DEFAULT.items():
                if isinstance(v, (dict, list)):
                    data.setdefault(k, v.copy())
                else:
                    data.setdefault(k, v)
            data['personal_info']['full_name'] = (
                request.user.get_full_name() or request.user.email.split('@')[0]
            ).upper()
            data['personal_info']['email'] = request.user.email

        serializer = ResumeDraftSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResumeDraftDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        return ResumeDraft.objects.filter(pk=pk, user=user).first()

    def get(self, request, pk):
        draft = self.get_object(pk, request.user)
        if not draft:
            return Response({"error": "Draft not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(ResumeDraftSerializer(draft).data)

    def put(self, request, pk):
        draft = self.get_object(pk, request.user)
        if not draft:
            return Response({"error": "Draft not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ResumeDraftSerializer(draft, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        draft = self.get_object(pk, request.user)
        if not draft:
            return Response({"error": "Draft not found"}, status=status.HTTP_404_NOT_FOUND)
        draft.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResumeAIImproveSectionView(APIView):
    """Uses Groq API to rewrite a specific section or bullet point."""
    permission_classes = [IsAuthenticated]
    throttle_classes = AI_THROTTLE_CLASSES

    def post(self, request):
        section = request.data.get('section', 'summary')
        action = request.data.get('action', 'Improve sentence and ATS impact')
        content = request.data.get('content') or request.data.get('original_text', '')
        target_role = request.data.get('target_role', 'Software Engineer')
        ats_issues = request.data.get('ats_issues', [])
        target_job = request.data.get('target_job')

        if not str(content).strip():
            return Response({"error": "Content is required."}, status=status.HTTP_400_BAD_REQUEST)

        ai = get_ai_service()
        if not hasattr(ai, 'improve_resume_section'):
            return Response(
                {"error": "Groq API key not configured in backend/.env"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        result = ai.improve_resume_section(
            section,
            action,
            content,
            target_role,
            ats_issues,
            target_job=target_job,
        )
        if 'score_increase' not in result and 'estimated_score_boost' in result:
            result['score_increase'] = result['estimated_score_boost']
        return Response(result, status=status.HTTP_200_OK)


class ResumeAutoFixATSView(APIView):
    """Fetches ATS Analyzer weaknesses/recommendations and uses Groq API to auto-improve the resume."""
    permission_classes = [IsAuthenticated]
    throttle_classes = AI_THROTTLE_CLASSES

    def post(self, request):
        resume_id = request.data.get('resume_id')
        draft_data = request.data.get('draft_data', {})
        target_role = request.data.get('target_role', 'Software Engineer')

        weaknesses = request.data.get('weaknesses', [])
        recommendations = request.data.get('recommendations', [])

        if resume_id:
            resume = Resume.objects.filter(pk=resume_id, user=request.user).first()
            if resume and hasattr(resume, 'analysis'):
                weaknesses = resume.analysis.weaknesses
                recommendations = [
                    r.get('suggestion', str(r)) if isinstance(r, dict) else str(r)
                    for r in resume.analysis.recommendations
                ]

        ai = get_ai_service()
        if not hasattr(ai, 'auto_fix_ats_issues'):
            return Response(
                {"error": "Groq API key not configured in backend/.env"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            improved = ai.auto_fix_ats_issues(draft_data, weaknesses, recommendations, target_role)
            return Response(
                {
                    "ats_weaknesses_addressed": weaknesses,
                    "improved_sections": improved,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GenerateCoverLetterView(APIView):
    """Generates a tailored 3-paragraph ATS-friendly cover letter using Groq AI."""
    permission_classes = [IsAuthenticated]
    throttle_classes = AI_THROTTLE_CLASSES

    def post(self, request):
        data = request.data
        candidate_name = data.get('candidate_name') or request.user.get_full_name() or request.user.email
        target_role = (data.get('target_role') or '').strip()
        company_name = (data.get('company_name') or '').strip()
        job_description = (data.get('job_description') or '').strip()
        resume_summary = (data.get('resume_summary') or '').strip()
        skills = data.get('skills') or []
        tone = data.get('tone') or 'Professional & Confident'

        if not target_role or not company_name:
            return Response(
                {'error': 'Both target_role and company_name are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ai = get_ai_service()
        result = ai.generate_cover_letter(
            candidate_name=candidate_name,
            target_role=target_role,
            company_name=company_name,
            job_description=job_description,
            resume_summary=resume_summary,
            skills=skills,
            tone=tone,
        )
        return Response(result, status=status.HTTP_200_OK)


class ExportCoverLetterDocxView(APIView):
    """Exports the generated AI Cover Letter as a formatted Word (.docx) document."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        personal = data.get('personal_info') or {}
        candidate_name = (
            data.get('candidate_name')
            or personal.get('full_name')
            or request.user.get_full_name()
            or request.user.email
        )
        email = personal.get('email') or request.user.email
        phone = personal.get('phone', '')
        location = personal.get('location', '')
        target_role = (data.get('target_role') or 'Position').strip()
        company_name = (data.get('company_name') or 'Company').strip()
        subject_line = (data.get('subject_line') or f"Application for {target_role} — {candidate_name}").strip()
        cover_letter = (data.get('cover_letter') or '').strip()

        if not cover_letter:
            return Response(
                {'error': 'Cover letter content is required to export.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        doc = Document()
        for section in doc.sections:
            section.top_margin = Inches(0.85)
            section.bottom_margin = Inches(0.85)
            section.left_margin = Inches(0.95)
            section.right_margin = Inches(0.95)

        # Candidate Header
        name_p = doc.add_paragraph()
        name_run = name_p.add_run(candidate_name.upper())
        name_run.bold = True
        name_run.font.size = Pt(16)
        name_run.font.color.rgb = RGBColor(15, 23, 42)

        contact_items = [x for x in [email, phone, location] if x]
        if contact_items:
            contact_p = doc.add_paragraph(" | ".join(contact_items))
            contact_p.runs[0].font.size = Pt(10)
            contact_p.runs[0].font.color.rgb = RGBColor(100, 116, 139)

        # Subject Line
        subj_p = doc.add_paragraph()
        subj_label = subj_p.add_run("Subject: ")
        subj_label.bold = True
        subj_label.font.size = Pt(11)
        subj_label.font.color.rgb = RGBColor(79, 70, 229)
        subj_val = subj_p.add_run(subject_line)
        subj_val.bold = True
        subj_val.font.size = Pt(11)

        # Body Paragraphs
        for block in cover_letter.split('\n\n'):
            cleaned = block.strip()
            if cleaned:
                bp = doc.add_paragraph(cleaned)
                bp.paragraph_format.space_after = Pt(10)
                bp.paragraph_format.line_spacing = 1.25
                for r in bp.runs:
                    r.font.size = Pt(11)
                    r.font.color.rgb = RGBColor(30, 41, 59)

        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)

        safe_company = "".join(c if c.isalnum() or c in ('-', '_') else '_' for c in company_name)
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        )
        response['Content-Disposition'] = f'attachment; filename="Cover_Letter_{safe_company}.docx"'
        return response


class ResumeExportDocxView(APIView):
    """Generates a clean ATS-friendly DOCX matching the sample resume format."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        p = data.get('personal_info', {})
        doc = Document()

        # Header
        name_p = doc.add_paragraph()
        name_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run_name = name_p.add_run(p.get('full_name', 'CANDIDATE NAME').upper())
        run_name.bold = True
        run_name.font.size = Pt(18)

        role_p = doc.add_paragraph()
        role_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run_role = role_p.add_run(p.get('role_title', 'SOFTWARE ENGINEER').upper())
        run_role.bold = True
        run_role.font.size = Pt(11)
        run_role.font.color.rgb = RGBColor(37, 99, 235)

        contact_parts = [
            x for x in [p.get('email'), p.get('phone'), p.get('location'), p.get('linkedin'), p.get('portfolio')] if x
        ]
        contact_p = doc.add_paragraph(" | ".join(contact_parts))
        contact_p.alignment = WD_ALIGN_PARAGRAPH.CENTER

        def add_section_heading(title):
            h = doc.add_paragraph()
            r = h.add_run(title.upper())
            r.bold = True
            r.font.size = Pt(11)
            r.font.color.rgb = RGBColor(37, 99, 235)

        if data.get('summary'):
            add_section_heading("Professional Summary")
            doc.add_paragraph(data['summary'])

        if data.get('skills'):
            add_section_heading("Skills")
            if isinstance(data['skills'], dict):
                for cat, items in data['skills'].items():
                    if items:
                        sp = doc.add_paragraph()
                        sp.add_run(f"{cat}: ").bold = True
                        sp.add_run(items if isinstance(items, str) else ", ".join(items))
            elif isinstance(data['skills'], list):
                doc.add_paragraph(", ".join(str(s) for s in data['skills']))

        if data.get('work_experience'):
            add_section_heading("Work Experience")
            for exp in data['work_experience']:
                ep = doc.add_paragraph()
                ep.add_run(f"{exp.get('role', '')} — {exp.get('company', '')} ({exp.get('duration', '')})").bold = True
                for b in exp.get('bullets', []):
                    doc.add_paragraph(b, style='List Bullet')

        if data.get('education'):
            add_section_heading("Education")
            for edu in data['education']:
                edp = doc.add_paragraph()
                edp.add_run(
                    f"{edu.get('degree', '')} | {edu.get('institution', '')} ({edu.get('graduation_date', '')})"
                ).bold = True

        if data.get('projects'):
            add_section_heading("Projects")
            for proj in data['projects']:
                pp = doc.add_paragraph()
                pp.add_run(f"{proj.get('title', '')} {('(' + proj['link'] + ')') if proj.get('link') else ''}").bold = True
                for b in proj.get('bullets', []):
                    doc.add_paragraph(b, style='List Bullet')

        if data.get('certifications'):
            add_section_heading("Certifications")
            for cert in data['certifications']:
                if cert:
                    doc.add_paragraph(cert, style='List Bullet')

        if data.get('achievements'):
            add_section_heading("Achievements")
            for ach in data['achievements']:
                if ach:
                    doc.add_paragraph(ach, style='List Bullet')

        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        )
        response['Content-Disposition'] = 'attachment; filename="CareerAI_Resume.docx"'
        return response