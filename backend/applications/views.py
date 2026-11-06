from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import JobApplication
from .serializers import JobApplicationSerializer
from jobs.models import Job
from resumes.models import Resume

class ApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = JobApplication.objects.filter(user=self.request.user)
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return JobApplication.objects.filter(user=self.request.user)


class SkillGapAnalysisView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id):
        job = get_object_or_404(Job, pk=job_id)

        # Retrieve candidate skills from primary resume or latest uploaded resume
        resume = Resume.objects.filter(user=request.user, is_primary=True).first()
        if not resume:
            resume = Resume.objects.filter(user=request.user).first()

        candidate_skills = []
        if resume and isinstance(resume.parsed_data, dict):
            candidate_skills = resume.parsed_data.get('skills', [])

        candidate_skills_lower = {str(s).strip().lower() for s in candidate_skills}

        # Extract job required & preferred skills
        raw_required = job.required_skills if isinstance(job.required_skills, list) else []
        
        # Mandatory requirements from job model
        mandatory_skills = [str(s).strip() for s in raw_required]
        
        matched_mandatory = [s for s in mandatory_skills if s.lower() in candidate_skills_lower]
        missing_mandatory = [s for s in mandatory_skills if s.lower() not in candidate_skills_lower]

        # Standard technical competencies to evaluate preferred gaps
        standard_preferred = ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'GraphQL', 'Redis', 'Microservices']
        missing_preferred = [
            s for s in standard_preferred 
            if s.lower() not in candidate_skills_lower and s.lower() not in {m.lower() for m in mandatory_skills}
        ][:3]

        # Calculate readiness percentage
        total_mandatory = len(mandatory_skills)
        if total_mandatory > 0:
            readiness = int((len(matched_mandatory) / total_mandatory) * 100)
        else:
            readiness = 100

        # Action recommendations
        recommendations = []
        if missing_mandatory:
            recommendations.append(f"Prioritize building hands-on projects featuring: {', '.join(missing_mandatory[:2])}.")
        if missing_preferred:
            recommendations.append(f"Consider learning preferred tooling: {', '.join(missing_preferred)} to stand out.")
        if readiness >= 80:
            recommendations.append("Strong technical alignment. Prepare for system design and architecture interview rounds.")
        else:
            recommendations.append("Highlight transferable skills and coursework on your resume before submitting.")

        return Response({
            'job_id': job.id,
            'job_title': job.title,
            'company': job.company,
            'readiness_percentage': readiness,
            'matched_mandatory': matched_mandatory,
            'missing_mandatory': missing_mandatory,
            'missing_preferred': missing_preferred,
            'recommendations': recommendations
        }, status=status.HTTP_200_OK)