import os
import io
from django.http import FileResponse, HttpResponse, Http404
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from accounts.models import Profile
from accounts.serializers import ProfileSerializer
from ai_services.factory import get_ai_service
from .models import Resume, ResumeAnalysis, ResumeDraft
from .serializers import (
    ResumeSerializer,
    ResumeAnalysisSerializer,
    ResumeDraftSerializer,
)
from .parser import extract_resume_data
from .analyzer import analyze_resume_text


SAMPLE_RESUME_DEFAULT = {
    "title": "Software Engineer Resume",
    "target_role": "Software Engineer",
    "personal_info": {
        "full_name": "JOHN DOE",
        "role_title": "SOFTWARE ENGINEER",
        "email": "john.doe@email.com",
        "phone": "+1 (555) 123-4567",
        "location": "San Francisco, CA",
        "linkedin": "[linkedin.com/in/johndoe](https://linkedin.com/in/johndoe)",
        "portfolio": "johndoe.dev"
    },
    "summary": "Results-driven Software Engineer with experience building scalable web applications and cloud-based solutions. Skilled in JavaScript, Python, React, and Django. Passionate about creating efficient, user-centric products and collaborating with cross-functional teams.",
    "skills": {
        "Languages": "JavaScript, TypeScript, Python, Java, SQL",
        "Frontend": "React, HTML5, CSS3, Bootstrap",
        "Backend": "Django, Django REST Framework, Node.js, RESTful APIs",
        "Database": "PostgreSQL, SQLite, MongoDB",
        "Tools": "Git, Docker, Postman, Linux"
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
                "Designed and implemented RESTful APIs serving 50K+ daily active users."
            ]
        }
    ],
    "education": [
        {
            "degree": "Bachelor of Technology in Computer Science",
            "institution": "University Name",
            "location": "City, State",
            "graduation_date": "May 2023"
        }
    ],
    "projects": [
        {
            "title": "CareerAI Platform",
            "link": "[github.com/username/careerai](https://github.com/username/careerai)",
            "bullets": [
                "Built full-stack AI resume analyzer and mock interview simulator using React and Django.",
                "Integrated Groq LLM API for automated answer evaluation and ATS scoring."
            ]
        }
    ],
    "certifications": ["AWS Certified Cloud Practitioner"],
    "achievements": ["Solved 300+ algorithmic problems across LeetCode and HackerRank"]
}


# ==========================================
# Core Resume Management & ATS Analysis Views
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
            file_type=ext
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
                defaults=analysis_result
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
                defaults=analysis_result
            )

            return Response({
                "message": "Resume parsed and analyzed successfully.",
                "resume": ResumeSerializer(resume, context={'request': request}).data,
                "analysis": ResumeAnalysisSerializer(analysis_obj).data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to process resume: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
            defaults=analysis_data
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


# ==========================================================
# Groq AI Resume-to-Profile Auto-Fill Endpoint
# ==========================================================

class ResumeAutofillProfileView(APIView):
    """
    Accepts either:
      - multipart/form-data with 'file' (.pdf or .docx) -> saves Resume, parses via Groq AI, and auto-fills Profile
      - JSON with 'resume_id' -> parses existing Resume via Groq AI and auto-fills Profile
    Optional flag: 'save_to_profile' (default True).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        uploaded_file = request.FILES.get('file')
        resume_id = request.data.get('resume_id')
        save_flag = str(request.data.get('save_to_profile', 'true')).lower() != 'false'

        resume = None
        if uploaded_file:
            ext = os.path.splitext(uploaded_file.name)[1].lower()
            if ext not in ['.pdf', '.docx']:
                return Response(
                    {"error": "Unsupported file format. Please upload a PDF or DOCX resume."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if uploaded_file.size > 10 * 1024 * 1024:
                return Response(
                    {"error": "File size exceeds the 10MB limit."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            resume = Resume.objects.create(
                user=request.user,
                file=uploaded_file,
                file_name=uploaded_file.name,
                file_size=uploaded_file.size,
                file_type=ext.replace('.', '')
            )
            parsed_result = extract_resume_data(resume.file.path, resume.file_type)
            resume.raw_text = parsed_result.get('raw_text', '')
            resume.parsed_data = parsed_result
            resume.is_parsed = True
            resume.save()

            try:
                analysis_result = analyze_resume_text(resume.raw_text, parsed_result)
                ResumeAnalysis.objects.update_or_create(resume=resume, defaults=analysis_result)
            except Exception:
                pass
        elif resume_id:
            resume = Resume.objects.filter(pk=resume_id, user=request.user).first()
            if not resume:
                return Response({"error": "Selected resume not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            resume = Resume.objects.filter(user=request.user, is_primary=True).first() or Resume.objects.filter(user=request.user).first()
            if not resume:
                return Response(
                    {"error": "Please upload a PDF/DOCX resume or select an existing resume."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        if not resume.raw_text:
            parsed_result = extract_resume_data(resume.file.path, resume.file_type)
            resume.raw_text = parsed_result.get('raw_text', '')
            resume.parsed_data = parsed_result
            resume.is_parsed = True
            resume.save()

        ai = get_ai_service()
        extracted = ai.extract_profile_from_resume(resume.raw_text, resume.parsed_data)

        profile, _ = Profile.objects.get_or_create(user=request.user)

        if save_flag:
            # Update User first/last name if extracted and currently blank
            full_name = (extracted.get('full_name') or '').strip()
            if full_name and not request.user.first_name:
                parts = full_name.split(' ', 1)
                request.user.first_name = parts[0][:150]
                if len(parts) > 1:
                    request.user.last_name = parts[1][:150]
                request.user.save(update_fields=['first_name', 'last_name'])

            # Map extracted fields onto Profile safely regardless of field naming variant
            field_mappings = {
                'headline': extracted.get('headline'),
                'target_role': extracted.get('target_role'),
                'experience_years': extracted.get('experience_years'),
                'phone': extracted.get('phone'),
                'location': extracted.get('location'),
                'linkedin_url': extracted.get('linkedin_url'),
                'linkedin': extracted.get('linkedin_url'),
                'github_url': extracted.get('github_url'),
                'github': extracted.get('github_url'),
                'portfolio_url': extracted.get('portfolio_url'),
                'portfolio': extracted.get('portfolio_url'),
                'bio': extracted.get('summary'),
                'summary': extracted.get('summary'),
            }

            for attr, val in field_mappings.items():
                if hasattr(profile, attr) and val not in (None, ''):
                    setattr(profile, attr, val)

            # Handle JSON list fields (skills / skills_list, education, experience / work_experience)
            extracted_skills = extracted.get('skills') or []
            if extracted_skills:
                if hasattr(profile, 'skills_list'):
                    existing = profile.skills_list if isinstance(profile.skills_list, list) else []
                    merged = list(dict.fromkeys(existing + extracted_skills))
                    profile.skills_list = merged
                elif hasattr(profile, 'skills'):
                    existing = profile.skills if isinstance(profile.skills, list) else []
                    merged = list(dict.fromkeys(existing + extracted_skills))
                    profile.skills = merged

            extracted_edu = extracted.get('education') or []
            if extracted_edu and hasattr(profile, 'education'):
                profile.education = extracted_edu

            extracted_exp = extracted.get('experience') or []
            if extracted_exp:
                if hasattr(profile, 'work_experience'):
                    profile.work_experience = extracted_exp
                elif hasattr(profile, 'experience'):
                    profile.experience = extracted_exp

            profile.save()

        try:
            serialized_profile = ProfileSerializer(profile).data
        except Exception:
            serialized_profile = extracted

        return Response({
            "message": f"Profile auto-filled from {resume.file_name} using {extracted.get('provider', 'Groq AI')}.",
            "provider": extracted.get('provider', 'Groq AI'),
            "resume_id": resume.id,
            "resume_name": resume.file_name,
            "extracted_profile": extracted,
            "profile": serialized_profile,
        }, status=status.HTTP_200_OK)


# ==========================================
# AI Resume Builder & Groq Improver Views
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
            data['personal_info']['full_name'] = (request.user.get_full_name() or request.user.email.split('@')[0]).upper()
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
    permission_classes = [IsAuthenticated]

    def post(self, request):
        section = request.data.get('section', 'summary')
        action = request.data.get('action', 'Improve sentence and ATS impact')
        content = request.data.get('content') or request.data.get('original_text', '')
        target_role = request.data.get('target_role', 'Software Engineer')
        ats_issues = request.data.get('ats_issues', [])

        if not str(content).strip():
            return Response({"error": "Content is required."}, status=status.HTTP_400_BAD_REQUEST)

        ai = get_ai_service()
        if not hasattr(ai, 'improve_resume_section'):
            return Response({"error": "Groq API key not configured in backend/.env"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        result = ai.improve_resume_section(section, action, content, target_role, ats_issues)
        if 'score_increase' not in result and 'estimated_score_boost' in result:
            result['score_increase'] = result['estimated_score_boost']
        return Response(result, status=status.HTTP_200_OK)


class ResumeAutoFixATSView(APIView):
    permission_classes = [IsAuthenticated]

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
            return Response({"error": "Groq API key not configured in backend/.env"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            improved = ai.auto_fix_ats_issues(draft_data, weaknesses, recommendations, target_role)
            return Response({
                "ats_weaknesses_addressed": weaknesses,
                "improved_sections": improved
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResumeExportDocxView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        p = data.get('personal_info', {})
        doc = Document()

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

        contact_parts = [x for x in [p.get('email'), p.get('phone'), p.get('location'), p.get('linkedin'), p.get('portfolio')] if x]
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
            for cat, items in data['skills'].items():
                if items:
                    sp = doc.add_paragraph()
                    sp.add_run(f"{cat}: ").bold = True
                    sp.add_run(items)

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
                edp.add_run(f"{edu.get('degree', '')} | {edu.get('institution', '')} ({edu.get('graduation_date', '')})").bold = True

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
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        response['Content-Disposition'] = 'attachment; filename="CareerAI_Resume.docx"'
        return response