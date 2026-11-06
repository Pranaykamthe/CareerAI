from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from .models import Job
from .serializers import JobSerializer
from .parser import extract_job_requirements

class JobListCreateView(generics.ListCreateAPIView):
    """
    GET: Returns a list of active jobs with search, type, and experience filtering.
    POST: Creates a new job posting.
    """
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Job.objects.filter(is_active=True)
        search = self.request.query_params.get('search', '').strip()
        job_type = self.request.query_params.get('job_type', '').strip()
        exp_level = self.request.query_params.get('experience_level', '').strip()
        location = self.request.query_params.get('location', '').strip()

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(company__icontains=search) |
                Q(description__icontains=search)
            )
        if job_type:
            queryset = queryset.filter(job_type__iexact=job_type)
        if exp_level:
            queryset = queryset.filter(experience_level__iexact=exp_level)
        if location:
            queryset = queryset.filter(location__icontains=location)

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Retrieves a single job posting by ID.
    PUT/PATCH: Updates a job (admin or author).
    DELETE: Removes a job.
    """
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]


class JobParseTextView(APIView):
    """
    POST: Takes raw job description text and deterministically extracts skills,
    minimum experience, experience tier, and key duties.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        raw_text = request.data.get('text', '').strip()
        if not raw_text or len(raw_text) < 20:
            return Response(
                {"error": "Please provide a valid job description with at least 20 characters."},
                status=status.HTTP_400_BAD_REQUEST
            )

        extracted_data = extract_job_requirements(raw_text)
        return Response(extracted_data, status=status.HTTP_200_OK)


class JobSeedDefaultsView(APIView):
    """
    POST: Seeds the database with default realistic industry jobs for academic testing.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        default_jobs = [
            {
                "title": "Senior Software Engineer",
                "company": "Google",
                "location": "Mountain View, CA (Hybrid)",
                "job_type": "Full-time",
                "experience_level": "Senior Level",
                "min_experience_years": 5,
                "salary_range": "$160,000 - $210,000",
                "description": "Develop and architect large-scale distributed systems using Python, Django, Docker, and Kubernetes. Collaborate with cross-functional teams to build high-performance REST and GraphQL APIs.",
                "required_skills": ["Python", "Django", "Docker", "Kubernetes", "REST APIs", "Microservices", "PostgreSQL"],
                "preferred_skills": ["AWS", "Redis", "CI/CD", "System Design"],
                "responsibilities": [
                    "Architect and scale core microservices handling high concurrency.",
                    "Optimize relational database queries and caching layers.",
                    "Conduct structured peer code reviews and mentor junior developers."
                ]
            },
            {
                "title": "Full Stack Developer",
                "company": "Amazon",
                "location": "Seattle, WA (Remote)",
                "job_type": "Full-time",
                "experience_level": "Mid Level",
                "min_experience_years": 3,
                "salary_range": "$125,000 - $165,000",
                "description": "Build end-to-end cloud-native web applications using React.js, TypeScript, Node.js, and AWS serverless architecture. Work in fast-paced Agile sprint teams.",
                "required_skills": ["React", "JavaScript", "TypeScript", "Node.js", "AWS", "Git"],
                "preferred_skills": ["GraphQL", "Docker", "Jest"],
                "responsibilities": [
                    "Implement responsive, accessible UI components adhering to design standards.",
                    "Integrate frontend SPAs with authenticated RESTful backend APIs.",
                    "Manage automated deployments through AWS CI/CD pipelines."
                ]
            },
            {
                "title": "Frontend Engineer",
                "company": "Microsoft",
                "location": "Redmond, WA",
                "job_type": "Full-time",
                "experience_level": "Entry Level",
                "min_experience_years": 1,
                "salary_range": "$95,000 - $125,000",
                "description": "Create intuitive user interfaces using modern React, Bootstrap, and HTML5/CSS3. Ensure cross-browser performance and robust component testing.",
                "required_skills": ["React", "JavaScript", "HTML5", "CSS3", "Bootstrap", "Git"],
                "preferred_skills": ["TypeScript", "Tailwind CSS"],
                "responsibilities": [
                    "Build reusable React components and client state managers.",
                    "Collaborate with UX designers to replicate Figma prototypes.",
                    "Ensure high standard of web accessibility and mobile responsiveness."
                ]
            },
            {
                "title": "Backend Python Developer",
                "company": "Spotify",
                "location": "New York, NY (Remote)",
                "job_type": "Contract",
                "experience_level": "Mid Level",
                "min_experience_years": 3,
                "salary_range": "$110,000 - $140,000",
                "description": "Design and maintain high-throughput backend services using Python, Django, FastAPI, PostgreSQL, and Redis. Write automated unit tests using Pytest.",
                "required_skills": ["Python", "Django", "FastAPI", "PostgreSQL", "Redis", "Pytest"],
                "preferred_skills": ["Docker", "Linux", "Celery"],
                "responsibilities": [
                    "Design secure REST endpoints with JWT authorization.",
                    "Optimize database schemas, indexes, and execution plans.",
                    "Maintain test coverage above 85% using Pytest."
                ]
            }
        ]

        created_count = 0
        for item in default_jobs:
            obj, created = Job.objects.get_or_create(
                title=item["title"],
                company=item["company"],
                defaults={**item, "created_by": request.user}
            )
            if created:
                created_count += 1

        return Response(
            {"message": f"Successfully seeded {created_count} default jobs.", "total_jobs": Job.objects.count()},
            status=status.HTTP_200_OK
        )