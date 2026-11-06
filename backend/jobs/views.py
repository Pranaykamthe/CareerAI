import re
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db.models import Q
from .models import Job, JobMatch
from .serializers import JobSerializer, JobMatchSerializer
from .matching_service import compute_job_match
from resumes.models import Resume

class JobListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('search', '').strip()
        job_type = request.query_params.get('type', '').strip()
        experience_level = request.query_params.get('experience', '').strip()
        location = request.query_params.get('location', '').strip()

        jobs = Job.objects.filter(is_active=True)

        if query:
            jobs = jobs.filter(
                Q(title__icontains=query) |
                Q(company__icontains=query) |
                Q(description__icontains=query)
            )

        if job_type:
            jobs = jobs.filter(job_type__iexact=job_type)

        if experience_level:
            jobs = jobs.filter(experience_level__iexact=experience_level)

        if location:
            jobs = jobs.filter(location__icontains=location)

        serializer = JobSerializer(jobs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = JobSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JobDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            job = Job.objects.get(pk=pk)
        except Job.DoesNotExist:
            return Response({"error": "Job listing not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = JobSerializer(job)
        return Response(serializer.data, status=status.HTTP_200_OK)


class JobMatchDetailView(APIView):
    """
    Evaluates compatibility between a specific Job and the candidate's chosen/primary Resume.
    Endpoint: POST /api/jobs/<pk>/match/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            job = Job.objects.get(pk=pk, is_active=True)
        except Job.DoesNotExist:
            return Response({"error": "Active job listing not found."}, status=status.HTTP_404_NOT_FOUND)

        resume_id = request.data.get('resume_id')
        if resume_id:
            resume = Resume.objects.filter(id=resume_id, user=request.user).first()
        else:
            resume = Resume.objects.filter(user=request.user, is_primary=True).first()
            if not resume:
                resume = Resume.objects.filter(user=request.user).order_by('-uploaded_at').first()

        if not resume:
            return Response(
                {"error": "No resume found. Please upload a resume before calculating job matches."},
                status=status.HTTP_400_BAD_REQUEST
            )

        profile = getattr(request.user, 'profile', None)
        match_data = compute_job_match(resume, job, candidate_profile=profile)

        # Update or create the persistent JobMatch record
        match_record, _ = JobMatch.objects.update_or_create(
            user=request.user,
            job=job,
            resume=resume,
            defaults={
                'match_score': match_data['match_score'],
                'skill_score': match_data['skill_score'],
                'experience_score': match_data['experience_score'],
                'keyword_score': match_data['keyword_score'],
                'matched_skills': match_data['matched_skills'],
                'missing_skills': match_data['missing_skills'],
                'preferred_matched_skills': match_data['preferred_matched_skills'],
                'match_level': match_data['match_level'],
                'summary': match_data['summary'],
            }
        )

        serializer = JobMatchSerializer(match_record)
        return Response(serializer.data, status=status.HTTP_200_OK)


class JobBatchMatchView(APIView):
    """
    Calculates and returns compatibility scores for all active jobs against the candidate's resume.
    Endpoint: GET /api/jobs/matches/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        resume_id = request.query_params.get('resume_id')
        if resume_id:
            resume = Resume.objects.filter(id=resume_id, user=request.user).first()
        else:
            resume = Resume.objects.filter(user=request.user, is_primary=True).first()
            if not resume:
                resume = Resume.objects.filter(user=request.user).order_by('-uploaded_at').first()

        if not resume:
            return Response({
                "resume": None,
                "matches": [],
                "message": "Upload a resume to unlock job compatibility matching."
            }, status=status.HTTP_200_OK)

        profile = getattr(request.user, 'profile', None)
        active_jobs = Job.objects.filter(is_active=True)
        results = []

        for job in active_jobs:
            match_data = compute_job_match(resume, job, candidate_profile=profile)
            match_record, _ = JobMatch.objects.update_or_create(
                user=request.user,
                job=job,
                resume=resume,
                defaults={
                    'match_score': match_data['match_score'],
                    'skill_score': match_data['skill_score'],
                    'experience_score': match_data['experience_score'],
                    'keyword_score': match_data['keyword_score'],
                    'matched_skills': match_data['matched_skills'],
                    'missing_skills': match_data['missing_skills'],
                    'preferred_matched_skills': match_data['preferred_matched_skills'],
                    'match_level': match_data['match_level'],
                    'summary': match_data['summary'],
                }
            )
            results.append(match_record)

        # Sort matches by match_score descending
        results.sort(key=lambda x: x.match_score, reverse=True)
        serializer = JobMatchSerializer(results, many=True)

        return Response({
            "resume": {
                "id": resume.id,
                "file_name": resume.file_name,
                "is_primary": resume.is_primary,
            },
            "total_matches": len(results),
            "matches": serializer.data,
        }, status=status.HTTP_200_OK)


class JobParseTextView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        text = request.data.get('text', '').strip()
        if not text:
            return Response({"error": "No job description text provided."}, status=status.HTTP_400_BAD_REQUEST)

        # Simple deterministic parser
        skills_pool = [
            'Python', 'Django', 'React', 'JavaScript', 'TypeScript', 'Node.js',
            'SQL', 'PostgreSQL', 'Docker', 'AWS', 'Git', 'REST API', 'HTML5',
            'CSS3', 'Bootstrap', 'Redux', 'MongoDB', 'Redis', 'Linux'
        ]
        extracted_skills = [s for s in skills_pool if re.search(rf'\b{re.escape(s)}\b', text, re.IGNORECASE)]

        exp_match = re.search(r'(\d+)\+?\s*(?:to\s*(\d+))?\s*(?:years?|yrs?)\b', text, re.IGNORECASE)
        min_exp = int(exp_match.group(1)) if exp_match else 1

        return Response({
            'extracted_skills': extracted_skills,
            'min_experience_years': min_exp,
            'suggested_title': text.split('\n')[0][:80] if text else 'Job Position'
        }, status=status.HTTP_200_OK)


class JobSeedDefaultsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from .seed_data import create_default_lpa_jobs
        count = create_default_lpa_jobs()
        return Response({"message": f"Successfully seeded {count} Indian LPA jobs."}, status=status.HTTP_200_OK)