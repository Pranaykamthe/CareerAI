import re
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Q
from .models import Job
from .serializers import JobSerializer

COMMON_TECH_SKILLS = [
    'Python', 'Django', 'FastAPI', 'Flask', 'JavaScript', 'TypeScript', 'React',
    'Angular', 'Vue.js', 'Node.js', 'Express', 'HTML5', 'CSS3', 'Bootstrap',
    'Tailwind CSS', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker',
    'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git', 'CI/CD', 'REST APIs', 'GraphQL',
    'Microservices', 'Linux', 'Pytest', 'System Design'
]


class JobListCreateView(generics.ListCreateAPIView):
    serializer_class = JobSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Job.objects.filter(is_active=True)
        search = self.request.query_params.get('search', None)
        job_type = self.request.query_params.get('job_type', None)
        experience_level = self.request.query_params.get('experience_level', None)
        location = self.request.query_params.get('location', None)

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(company__icontains=search) |
                Q(description__icontains=search)
            )
        if job_type:
            queryset = queryset.filter(job_type=job_type)
        if experience_level:
            queryset = queryset.filter(experience_level=experience_level)
        if location:
            queryset = queryset.filter(location__icontains=location)

        return queryset

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(created_by=user)


class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [AllowAny]


class JobParseTextView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        text = request.data.get('text', '').strip()
        if not text:
            return Response(
                {"error": "Please provide job description text to parse."},
                status=status.HTTP_400_BAD_REQUEST
            )

        found_skills = []
        for skill in COMMON_TECH_SKILLS:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text, re.IGNORECASE):
                found_skills.append(skill)

        exp_match = re.search(r'(\d+)\+?\s*(?:to\s*\d+\s*)?(?:years|yrs)', text, re.IGNORECASE)
        min_years = int(exp_match.group(1)) if exp_match else 1

        if min_years <= 2:
            experience_level = 'Entry Level'
        elif min_years <= 5:
            experience_level = 'Mid Level'
        elif min_years <= 8:
            experience_level = 'Senior Level'
        else:
            experience_level = 'Expert Level'

        lines = [line.strip().lstrip('•-*123456789. ') for line in text.split('\n') if line.strip()]
        responsibilities = [line for line in lines if len(line) > 20 and len(line) < 180][:5]

        return Response({
            "extracted_skills": found_skills,
            "min_experience_years": min_years,
            "experience_level": experience_level,
            "responsibilities": responsibilities,
            "word_count": len(text.split()),
        }, status=status.HTTP_200_OK)


class JobSeedDefaultsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        indian_jobs = [
            {
                "title": "Backend Python Developer",
                "company": "Spotify",
                "location": "Bengaluru, Karnataka (Remote)",
                "job_type": "Full-time",
                "experience_level": "Mid Level",
                "min_experience_years": 3,
                "salary_range": "16 - 24 LPA",
                "description": "Design and maintain high-throughput backend services using Python, Django, FastAPI, PostgreSQL, and Redis. Write automated unit tests using Pytest.",
                "required_skills": ["Python", "Django", "FastAPI", "PostgreSQL", "Redis", "Pytest"],
                "preferred_skills": ["Docker", "Linux", "Celery"],
                "responsibilities": [
                    "Design secure REST endpoints with JWT authorization.",
                    "Optimize database schemas, indexes, and execution plans.",
                    "Maintain test coverage above 85% using Pytest."
                ],
                "is_active": True
            },
            {
                "title": "Frontend Engineer",
                "company": "Microsoft",
                "location": "Hyderabad, Telangana",
                "job_type": "Full-time",
                "experience_level": "Entry Level",
                "min_experience_years": 1,
                "salary_range": "12 - 18 LPA",
                "description": "Create intuitive user interfaces using modern React, Bootstrap, and HTML5/CSS3. Ensure cross-browser performance and robust component testing.",
                "required_skills": ["React", "JavaScript", "HTML5", "CSS3", "Bootstrap", "Git"],
                "preferred_skills": ["TypeScript", "Tailwind CSS"],
                "responsibilities": [
                    "Build reusable React components and client state managers.",
                    "Collaborate with UX designers to replicate Figma prototypes.",
                    "Ensure high standard of web accessibility and mobile responsiveness."
                ],
                "is_active": True
            },
            {
                "title": "Full Stack Developer",
                "company": "Amazon",
                "location": "Bengaluru, Karnataka (Hybrid)",
                "job_type": "Full-time",
                "experience_level": "Mid Level",
                "min_experience_years": 3,
                "salary_range": "20 - 30 LPA",
                "description": "Build end-to-end cloud-native web applications using React.js, TypeScript, Node.js, and AWS serverless architecture. Work in fast-paced Agile sprint teams.",
                "required_skills": ["React", "JavaScript", "TypeScript", "Node.js", "AWS", "Git"],
                "preferred_skills": ["GraphQL", "Docker", "Jest"],
                "responsibilities": [
                    "Implement responsive, accessible UI components adhering to design standards.",
                    "Integrate frontend SPAs with authenticated RESTful backend APIs.",
                    "Manage automated deployments through AWS CI/CD pipelines."
                ],
                "is_active": True
            },
            {
                "title": "Senior Software Engineer",
                "company": "Google",
                "location": "Bengaluru, Karnataka (Hybrid)",
                "job_type": "Full-time",
                "experience_level": "Senior Level",
                "min_experience_years": 5,
                "salary_range": "35 - 50 LPA",
                "description": "Develop and architect large-scale distributed systems using Python, Django, Docker, and Kubernetes. Collaborate with cross-functional teams to build high-performance REST and GraphQL APIs.",
                "required_skills": ["Python", "Django", "Docker", "Kubernetes", "REST APIs", "Microservices"],
                "preferred_skills": ["AWS", "Redis", "CI/CD", "System Design"],
                "responsibilities": [
                    "Architect and scale core microservices handling high concurrency.",
                    "Optimize relational database queries and caching layers.",
                    "Conduct structured peer code reviews and mentor junior developers."
                ],
                "is_active": True
            }
        ]

        Job.objects.all().delete()
        for item in indian_jobs:
            Job.objects.create(**item)

        return Response(
            {"message": f"Seeded {len(indian_jobs)} Indian tech roles with LPA compensation.", "count": len(indian_jobs)},
            status=status.HTTP_201_CREATED
        )