from django.contrib.auth import get_user_model
from django.db import connection
from django.db.models import Avg, Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Profile
from applications.models import JobApplication
from interviews.models import InterviewSession, QuestionBank
from jobs.models import Job, JobMatch
from resumes.models import Resume, ResumeAnalysis

from .permissions import IsAdminRole
from .serializers import AdminUserSerializer

User = get_user_model()


# ==============================================================================
# PHASE 16: CANDIDATE DASHBOARD ANALYTICS
# ==============================================================================

class CandidateDashboardView(APIView):
    """
    GET /api/dashboard/candidate/
    Aggregates cross-module career readiness metrics for the logged-in candidate.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        # 1. Profile Completion & Skills
        profile, _ = Profile.objects.get_or_create(user=user)
        profile_completion = getattr(profile, 'completion_percentage', 0)
        profile_skills = getattr(profile, 'skills_list', None) or getattr(profile, 'skills', None) or []
        target_role = getattr(profile, 'target_role', '') or 'Software Developer'

        # 2. Resume & Latest ATS Score
        resumes = Resume.objects.filter(user=user).order_by('-is_primary', '-uploaded_at')
        total_resumes = resumes.count()
        primary_resume = resumes.first()

        latest_ats_score = 0
        resume_skills = []
        ats_breakdown = {
            'formatting': 0,
            'keywords': 0,
            'completeness': 0,
            'impact': 0,
        }
        active_resume_info = None

        if primary_resume:
            if isinstance(primary_resume.parsed_data, dict):
                resume_skills = primary_resume.parsed_data.get('skills', [])

            analysis = ResumeAnalysis.objects.filter(resume=primary_resume).first()
            if analysis:
                latest_ats_score = getattr(analysis, 'overall_score', 0) or 0
                ats_breakdown = {
                    'formatting': getattr(analysis, 'formatting_score', 0) or 0,
                    'keywords': getattr(analysis, 'keyword_score', 0) or 0,
                    'completeness': getattr(analysis, 'content_quality_score', 0) or 0,
                    'impact': getattr(analysis, 'measurable_impact_score', 0) or 0,
                }

            active_resume_info = {
                'id': primary_resume.id,
                'filename': primary_resume.file_name or (
                    primary_resume.file.name.split('/')[-1] if primary_resume.file else 'Resume'
                ),
                'ats_score': latest_ats_score,
                'uploaded_at': primary_resume.uploaded_at,
            }

        combined_skills = list(dict.fromkeys([*(profile_skills or []), *(resume_skills or [])]))

        # 3. Job Matches & Skill Gaps
        matches_qs = JobMatch.objects.none()
        if primary_resume:
            matches_qs = (
                JobMatch.objects.filter(resume=primary_resume)
                .select_related('job')
                .order_by('-match_score')
            )

        top_matches = []
        missing_skill_counts = {}

        for match in matches_qs[:4]:
            missing = match.missing_skills or []
            for skill in missing:
                missing_skill_counts[skill] = missing_skill_counts.get(skill, 0) + 1

            top_matches.append({
                'job_id': match.job.id,
                'title': match.job.title,
                'company': match.job.company,
                'location': match.job.location,
                'match_score': round(float(match.match_score or 0)),
                'matched_skills': (match.matched_skills or [])[:4],
                'missing_skills': missing[:3],
            })

        # Fallback to active jobs if no JobMatch records exist yet
        if not top_matches:
            for job in Job.objects.filter(is_active=True).order_by('-id')[:4]:
                req_skills = job.required_skills or []
                user_lower = {s.lower() for s in combined_skills}
                matched = [s for s in req_skills if s.lower() in user_lower]
                missing = [s for s in req_skills if s.lower() not in user_lower]
                for skill in missing:
                    missing_skill_counts[skill] = missing_skill_counts.get(skill, 0) + 1
                est_score = round((len(matched) / len(req_skills)) * 100) if req_skills else 50
                top_matches.append({
                    'job_id': job.id,
                    'title': job.title,
                    'company': job.company,
                    'location': job.location,
                    'match_score': est_score,
                    'matched_skills': matched[:4],
                    'missing_skills': missing[:3],
                })

        top_skill_gaps = [
            {'skill': k, 'demand_count': v}
            for k, v in sorted(missing_skill_counts.items(), key=lambda x: x[1], reverse=True)[:6]
        ]

        # 4. Application Statistics (Kanban Breakdown)
        applications = JobApplication.objects.filter(user=user)
        status_counts_raw = applications.values('status').annotate(count=Count('id'))
        status_map = {
            'Saved': 0,
            'Applied': 0,
            'Screening': 0,
            'Interview': 0,
            'Offer': 0,
            'Rejected': 0,
        }
        for row in status_counts_raw:
            matched_key = next(
                (k for k in status_map if k.lower() == str(row['status']).lower()),
                None
            )
            if matched_key:
                status_map[matched_key] = row['count']

        total_applications = applications.count()
        saved_jobs_count = status_map['Saved']

        # 5. Interview Performance & Trend
        sessions = InterviewSession.objects.filter(user=user).order_by('-created_at')
        completed_sessions = sessions.filter(status__iexact='completed')
        total_interviews = sessions.count()
        completed_interviews_count = completed_sessions.count()

        avg_interview_score = round(
            float(completed_sessions.aggregate(avg=Avg('overall_score'))['avg'] or 0)
        )

        recent_sessions_trend = []
        for s in reversed(list(completed_sessions[:6])):
            recent_sessions_trend.append({
                'id': s.id,
                'date': s.created_at.strftime('%b %d'),
                'role': s.role_target,
                'category': getattr(s, 'category', 'Mixed'),
                'score': round(float(s.overall_score or 0)),
            })

        # 6. Career Readiness Radar Metrics (0-100 scale)
        skill_coverage_score = min(100, len(combined_skills) * 10)
        job_fit_avg = (
            round(sum(m['match_score'] for m in top_matches) / len(top_matches))
            if top_matches else 0
        )
        application_activity_score = min(100, total_applications * 20)

        radar_metrics = {
            'labels': [
                'Profile Strength',
                'ATS Resume Score',
                'Technical Skills',
                'Job Market Fit',
                'Interview Readiness',
                'Application Activity',
            ],
            'values': [
                profile_completion,
                round(float(latest_ats_score)),
                skill_coverage_score,
                job_fit_avg,
                avg_interview_score,
                application_activity_score,
            ],
        }

        # 7. Recent Activity Feed
        activities = []
        if active_resume_info:
            activities.append({
                'type': 'resume',
                'icon': 'bi-file-earmark-check-fill',
                'color': 'primary',
                'title': f"Active Resume: {active_resume_info['filename']}",
                'subtitle': f"ATS Compatibility Score: {latest_ats_score}/100",
                'timestamp': active_resume_info['uploaded_at'],
            })

        for app in applications.select_related('job').order_by('-updated_at')[:2]:
            activities.append({
                'type': 'application',
                'icon': 'bi-kanban-fill',
                'color': 'info',
                'title': f"Application ({app.status}): {app.job.title}",
                'subtitle': app.job.company,
                'timestamp': app.updated_at,
            })

        for sess in sessions[:2]:
            activities.append({
                'type': 'interview',
                'icon': 'bi-mic-fill',
                'color': 'success',
                'title': f"Mock Interview: {sess.role_target}",
                'subtitle': f"Status: {sess.status} • Score: {round(float(sess.overall_score or 0))}%",
                'timestamp': sess.created_at,
            })

        activities.sort(key=lambda x: x['timestamp'], reverse=True)

        return Response({
            'candidate': {
                'name': user.get_full_name() or user.username,
                'email': user.email,
                'target_role': target_role,
                'profile_completion': profile_completion,
                'skills_count': len(combined_skills),
            },
            'kpis': {
                'ats_score': round(float(latest_ats_score)),
                'total_resumes': total_resumes,
                'job_matches_count': matches_qs.count() or len(top_matches),
                'avg_job_fit': job_fit_avg,
                'total_applications': total_applications,
                'saved_jobs': saved_jobs_count,
                'avg_interview_score': avg_interview_score,
                'completed_interviews': completed_interviews_count,
                'total_interviews': total_interviews,
            },
            'active_resume': active_resume_info,
            'ats_breakdown': ats_breakdown,
            'top_matches': top_matches,
            'skill_gaps': top_skill_gaps,
            'application_stats': status_map,
            'interview_trend': recent_sessions_trend,
            'radar_metrics': radar_metrics,
            'recent_activities': activities[:5],
        })


# ==============================================================================
# PHASE 17: ADMINISTRATOR DASHBOARD & PLATFORM MANAGEMENT
# ==============================================================================

class AdminOverviewView(APIView):
    """
    Returns platform-wide KPIs, role distributions, recent registrations,
    and system health diagnostics for administrators.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        admin_users = User.objects.filter(Q(role='admin') | Q(is_superuser=True)).count()
        candidate_users = total_users - admin_users

        total_resumes = Resume.objects.count()
        total_jobs = Job.objects.count()
        active_jobs = Job.objects.filter(is_active=True).count()
        total_applications = JobApplication.objects.count()
        total_interviews = InterviewSession.objects.count()
        completed_interviews = InterviewSession.objects.filter(status__iexact='completed').count()
        avg_platform_interview_score = (
            InterviewSession.objects.filter(status__iexact='completed').aggregate(avg=Avg('overall_score'))['avg'] or 0
        )
        total_questions = QuestionBank.objects.count()

        db_status = 'healthy'
        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
        except Exception:
            db_status = 'degraded'

        recent_users = AdminUserSerializer(
            User.objects.order_by('-date_joined')[:5],
            many=True
        ).data

        return Response({
            'metrics': {
                'total_users': total_users,
                'active_users': active_users,
                'candidate_users': candidate_users,
                'admin_users': admin_users,
                'total_resumes': total_resumes,
                'total_jobs': total_jobs,
                'active_jobs': active_jobs,
                'total_applications': total_applications,
                'total_interviews': total_interviews,
                'completed_interviews': completed_interviews,
                'avg_interview_score': round(float(avg_platform_interview_score), 1),
                'total_questions': total_questions,
            },
            'system_health': {
                'api_status': 'operational',
                'database_status': db_status,
                'server_time': timezone.now(),
            },
            'recent_users': recent_users,
        })


class AdminUserListView(generics.ListAPIView):
    """
    Lists all registered users with optional search and role/status filtering.
    """
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')
        search = self.request.query_params.get('search')
        role = self.request.query_params.get('role')
        is_active = self.request.query_params.get('is_active')

        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        if role and role != 'all':
            queryset = queryset.filter(role=role)
        if is_active in ['true', 'false']:
            queryset = queryset.filter(is_active=(is_active == 'true'))

        return queryset


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Allows administrators to update a user's role or active status, or delete a user.
    """
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def perform_destroy(self, instance):
        if instance == self.request.user:
            raise permissions.PermissionDenied("You cannot delete your own administrator account.")
        instance.delete()


class AdminJobManageView(APIView):
    """
    Lists all jobs or creates a new job listing from the Admin Portal.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        jobs = Job.objects.all().order_by('-created_at')
        data = [
            {
                'id': job.id,
                'title': job.title,
                'company': job.company,
                'location': job.location,
                'job_type': job.job_type,
                'experience_level': job.experience_level,
                'salary_range': job.salary_range,
                'required_skills': job.required_skills,
                'description': job.description,
                'is_active': job.is_active,
                'created_at': job.created_at,
            }
            for job in jobs
        ]
        return Response(data)

    def post(self, request):
        data = request.data
        job = Job.objects.create(
            created_by=request.user,
            title=data.get('title', 'Untitled Role'),
            company=data.get('company', 'CareerAI Partner'),
            location=data.get('location', 'Remote'),
            job_type=data.get('job_type', 'Full-time'),
            experience_level=data.get('experience_level', 'Mid Level'),
            salary_range=data.get('salary_range', ''),
            required_skills=data.get('required_skills', []),
            description=data.get('description', ''),
            is_active=data.get('is_active', True),
        )
        return Response({'id': job.id, 'title': job.title, 'message': 'Job created.'}, status=status.HTTP_201_CREATED)


class AdminJobDetailView(APIView):
    """
    Updates or deletes a specific job listing.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def patch(self, request, pk):
        job = get_object_or_404(Job, pk=pk)
        updatable_fields = [
            'title', 'company', 'location', 'job_type',
            'experience_level', 'salary_range', 'required_skills',
            'description', 'is_active'
        ]
        for field in updatable_fields:
            if field in request.data and hasattr(job, field):
                setattr(job, field, request.data[field])
        job.save()
        return Response({'id': job.id, 'title': job.title, 'is_active': job.is_active})

    def delete(self, request, pk):
        job = get_object_or_404(Job, pk=pk)
        job.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminQuestionManageView(APIView):
    """
    Lists all interview questions or adds a new curated question to the Question Bank.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        questions = QuestionBank.objects.all().order_by('-id')
        data = [
            {
                'id': q.id,
                'question_text': q.question_text,
                'category': q.category,
                'difficulty': q.difficulty,
                'role_target': q.role_target,
                'ideal_points': q.ideal_points,
                'sample_answer': q.sample_answer,
                'is_active': q.is_active,
            }
            for q in questions
        ]
        return Response(data)

    def post(self, request):
        data = request.data
        question = QuestionBank.objects.create(
            question_text=data.get('question_text', ''),
            category=data.get('category', 'Technical'),
            difficulty=data.get('difficulty', 'Medium'),
            role_target=data.get('role_target', 'General Software Engineer'),
            ideal_points=data.get('ideal_points', data.get('talking_points', [])),
            sample_answer=data.get('sample_answer', ''),
            is_active=data.get('is_active', True),
        )
        return Response({'id': question.id, 'message': 'Question added.'}, status=status.HTTP_201_CREATED)


class AdminQuestionDetailView(APIView):
    """
    Updates or deletes a specific question bank item.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def patch(self, request, pk):
        question = get_object_or_404(QuestionBank, pk=pk)
        updatable_fields = [
            'question_text', 'category', 'difficulty',
            'role_target', 'ideal_points', 'sample_answer', 'is_active'
        ]
        for field in updatable_fields:
            if field in request.data and hasattr(question, field):
                setattr(question, field, request.data[field])
        if 'talking_points' in request.data:
            question.ideal_points = request.data['talking_points']
        question.save()
        return Response({'id': question.id, 'is_active': question.is_active})

    def delete(self, request, pk):
        question = get_object_or_404(QuestionBank, pk=pk)
        question.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)