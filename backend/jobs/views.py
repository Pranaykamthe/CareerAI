import re
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .models import Job, JobMatch
from .serializers import JobSerializer, JobMatchSerializer
from .matching_service import compute_job_match
from resumes.models import Resume


def get_visible_jobs_for_user(user):
    """
    Admins see all active jobs; candidates see public platform jobs
    plus their own private imported jobs.
    """
    base_qs = Job.objects.filter(is_active=True)
    if not user or not user.is_authenticated:
        return base_qs.filter(is_public=True)
    if getattr(user, 'role', '') == 'admin' or user.is_superuser or user.is_staff:
        return base_qs
    return base_qs.filter(Q(is_public=True) | Q(created_by=user))


class JobListCreateView(APIView):
    """
    GET: Returns active jobs visible to the user with optional search/filter query params.
    POST: Creates a new job posting (public if admin, private if candidate).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('search', '').strip()
        job_type = (
            request.query_params.get('job_type', '').strip()
            or request.query_params.get('type', '').strip()
        )
        experience_level = (
            request.query_params.get('experience_level', '').strip()
            or request.query_params.get('experience', '').strip()
        )
        location = request.query_params.get('location', '').strip()

        jobs = get_visible_jobs_for_user(request.user)

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
            is_admin = (
                getattr(request.user, 'role', '') == 'admin'
                or request.user.is_superuser
                or request.user.is_staff
            )
            serializer.save(created_by=request.user, is_public=is_admin)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JobDetailView(APIView):
    """
    GET: Retrieves a single visible job posting by ID.
    PUT/PATCH: Updates a job if the user is an admin or the job's creator.
    DELETE: Removes a job if the user is an admin or the job's creator.
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get_job(self, request, pk):
        return get_visible_jobs_for_user(request.user).filter(pk=pk).first()

    def _can_modify(self, user, job):
        is_admin = (
            getattr(user, 'role', '') == 'admin'
            or user.is_superuser
            or user.is_staff
        )
        return is_admin or job.created_by_id == user.id

    def get(self, request, pk):
        job = self._get_job(request, pk)
        if not job:
            return Response({"error": "Job listing not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = JobSerializer(job)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        job = self._get_job(request, pk)
        if not job:
            return Response({"error": "Job listing not found."}, status=status.HTTP_404_NOT_FOUND)
        if not self._can_modify(request.user, job):
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        serializer = JobSerializer(job, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        job = self._get_job(request, pk)
        if not job:
            return Response({"error": "Job listing not found."}, status=status.HTTP_404_NOT_FOUND)
        if not self._can_modify(request.user, job):
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        serializer = JobSerializer(job, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        job = self._get_job(request, pk)
        if not job:
            return Response({"error": "Job listing not found."}, status=status.HTTP_404_NOT_FOUND)
        if not self._can_modify(request.user, job):
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        job.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class JobMatchDetailView(APIView):
    """
    Evaluates compatibility between a specific Job and the candidate's chosen/primary Resume.
    Endpoint: POST /api/jobs/<pk>/match/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        job = get_visible_jobs_for_user(request.user).filter(pk=pk).first()
        if not job:
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
    Calculates and returns compatibility scores for all visible active jobs
    against the candidate's resume.
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
        active_jobs = get_visible_jobs_for_user(request.user)
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
    """
    POST: Extracts skills, minimum experience, and metadata from raw job description text.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        raw_text = request.data.get('text', '').strip()
        if not raw_text or len(raw_text) < 20:
            return Response(
                {"error": "Please provide a valid job description with at least 20 characters."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from .parser import extract_job_requirements
            extracted_data = extract_job_requirements(raw_text)
            return Response(extracted_data, status=status.HTTP_200_OK)
        except ImportError:
            skills_pool = [
                'Python', 'Django', 'FastAPI', 'React', 'JavaScript', 'TypeScript',
                'Node.js', 'Java', 'Core Java', 'Spring', 'Hibernate', 'SQL',
                'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
                'AWS', 'Git', 'REST API', 'HTML5', 'CSS3', 'Bootstrap', 'Redux',
                'Linux', 'Pytest', 'Pandas', 'NumPy', 'scikit-learn'
            ]
            extracted_skills = [
                s for s in skills_pool
                if re.search(rf'\b{re.escape(s)}\b', raw_text, re.IGNORECASE)
            ]

            exp_match = re.search(
                r'(\d+)\+?\s*(?:to\s*(\d+))?\s*(?:years?|yrs?)\b',
                raw_text,
                re.IGNORECASE
            )
            min_exp = int(exp_match.group(1)) if exp_match else 1

            return Response({
                'extracted_skills': extracted_skills,
                'required_skills': extracted_skills,
                'min_experience_years': min_exp,
                'suggested_title': raw_text.split('\n')[0][:80] if raw_text else 'Job Position',
            }, status=status.HTTP_200_OK)


class JobSeedDefaultsView(APIView):
    """
    POST: Seeds the database with default realistic Indian LPA industry jobs.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        from .seed_data import create_default_lpa_jobs
        created_count = create_default_lpa_jobs()
        return Response(
            {
                "message": f"Successfully seeded {created_count} Indian LPA jobs.",
                "total_jobs": Job.objects.count(),
            },
            status=status.HTTP_200_OK
        )