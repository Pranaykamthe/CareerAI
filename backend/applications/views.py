from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import JobApplication
from .serializers import JobApplicationSerializer
from jobs.models import Job
from resumes.models import Resume

class ApplicationListCreateView(generics.ListCreateAPIView):
    """
    GET: List all applications for the authenticated candidate.
    POST: Save or update a job application status.
    """
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = JobApplication.objects.filter(user=self.request.user).select_related('job')
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET, PUT, PATCH, DELETE an existing job application.
    """
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return JobApplication.objects.filter(user=self.request.user).select_related('job')


class SkillGapAnalysisView(APIView):
    """
    GET: Evaluates candidate skills against a specific job's required & preferred skills.
    Returns matched skills, missing mandatory skills, missing preferred skills, and recommendations.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id):
        job = get_object_or_404(Job, pk=job_id)
        resume_id = request.query_params.get('resume_id')

        # Retrieve candidate skills from resume or candidate profile
        candidate_skills = set()
        if resume_id:
            resume = Resume.objects.filter(id=resume_id, user=request.user).first()
        else:
            resume = Resume.objects.filter(user=request.user, is_primary=True).first()
            if not resume:
                resume = Resume.objects.filter(user=request.user).first()

        if resume and resume.parsed_data and 'skills' in resume.parsed_data:
            candidate_skills = set(s.lower() for s in resume.parsed_data.get('skills', []))
        
        # Merge profile skills if available
        if hasattr(request.user, 'profile') and request.user.profile.skills_list:
            candidate_skills.update(s.lower() for s in request.user.profile.skills_list)

        required_skills = [s.strip() for s in job.required_skills if str(s).strip()]
        preferred_skills = [s.strip() for s in job.preferred_skills if str(s).strip()]

        matched_mandatory = []
        missing_mandatory = []
        for req in required_skills:
            if req.lower() in candidate_skills:
                matched_mandatory.append(req)
            else:
                missing_mandatory.append(req)

        matched_preferred = []
        missing_preferred = []
        for pref in preferred_skills:
            if pref.lower() in candidate_skills:
                matched_preferred.append(pref)
            else:
                missing_preferred.append(pref)

        total_req = len(required_skills)
        readiness_pct = round((len(matched_mandatory) / total_req * 100), 1) if total_req > 0 else 100.0

        # Generate targeted learning recommendations
        recommendations = []
        if missing_mandatory:
            recommendations.append(
                f"Priority Action: Acquire essential core skill{'s' if len(missing_mandatory) > 1 else ''} ({', '.join(missing_mandatory[:3])}) to meet baseline requirements."
            )
        if missing_preferred:
            recommendations.append(
                f"Competitive Edge: Learn preferred technology ({', '.join(missing_preferred[:2])}) to stand out from other applicants."
            )
        if readiness_pct >= 80:
            recommendations.append("Strong fit: Highlight real-world project outcomes and quantifiable achievements in your interview.")
        else:
            recommendations.append("Consider building a targeted capstone project demonstrating usage of the missing mandatory technologies.")

        return Response({
            "job_id": job.id,
            "job_title": job.title,
            "company": job.company,
            "readiness_percentage": readiness_pct,
            "matched_mandatory": matched_mandatory,
            "missing_mandatory": missing_mandatory,
            "matched_preferred": matched_preferred,
            "missing_preferred": missing_preferred,
            "recommendations": recommendations,
        }, status=status.HTTP_200_OK)