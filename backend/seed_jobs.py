import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'careerai_backend.settings')
django.setup()

from jobs.models import Job

# 1. Delete all old US Dollar records
deleted_count, _ = Job.objects.all().delete()
print(f"Removed {deleted_count} old job listings from database.")

# 2. Insert fresh Indian tech ecosystem positions with LPA compensation
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

for item in indian_jobs:
    Job.objects.create(**item)

print(f"Successfully added {len(indian_jobs)} positions in LPA!")