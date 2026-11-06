from .models import Job

DEFAULT_JOBS = [
    {
        "title": "Junior Python / Django Developer",
        "company": "Infosys",
        "location": "Pune, Maharashtra",
        "job_type": "Full-time",
        "experience_level": "Entry Level",
        "min_experience_years": 1,
        "salary_range": "₹4.5 - ₹7.5 LPA",
        "description": "Looking for a Python/Django developer to build REST APIs, integrate databases (PostgreSQL/MySQL), and write clean backend services.",
        "required_skills": ["Python", "Django", "REST API", "SQL", "Git"],
        "preferred_skills": ["Docker", "AWS", "Pytest", "React"],
        "responsibilities": [
            "Develop clean REST APIs using Django REST Framework.",
            "Write database queries and perform schema optimizations.",
            "Collaborate with frontend engineers to integrate web apps."
        ]
    },
    {
        "title": "Full Stack Java & React Developer",
        "company": "TCS",
        "location": "Pune, Maharashtra",
        "job_type": "Full-time",
        "experience_level": "Mid Level",
        "min_experience_years": 2,
        "salary_range": "₹6.0 - ₹10.0 LPA",
        "description": "Seeking a Full Stack Developer with strong Core Java, Spring/Hibernate, and React.js frontend experience.",
        "required_skills": ["Java", "Core Java", "React", "JavaScript", "SQL", "HTML5"],
        "preferred_skills": ["Spring", "Hibernate", "AWS"],
        "responsibilities": [
            "Build responsive client interfaces with React.",
            "Maintain Java backend endpoints and business services."
        ]
    },
    {
        "title": "Backend Software Engineer",
        "company": "Zomato",
        "location": "Remote / Bengaluru",
        "job_type": "Full-time",
        "experience_level": "Mid Level",
        "min_experience_years": 2,
        "salary_range": "₹14 - ₹22 LPA",
        "description": "Join our core engineering team developing high-throughput microservices using Python, Redis, AWS, and relational databases.",
        "required_skills": ["Python", "Django", "PostgreSQL", "AWS", "Git"],
        "preferred_skills": ["Docker", "Redis", "Microservices"],
        "responsibilities": [
            "Build scalable microservices handling thousands of requests per second.",
            "Optimize SQL queries and caching layers."
        ]
    },
    {
        "title": "AI & Data Science Associate",
        "company": "Persistent Systems",
        "location": "Pune, Maharashtra",
        "job_type": "Full-time",
        "experience_level": "Entry Level",
        "min_experience_years": 1,
        "salary_range": "₹5.5 - ₹8.5 LPA",
        "description": "Work on LLM integrations, dataset cleaning, Pandas pipelines, and Python backend services.",
        "required_skills": ["Python", "Pandas", "NumPy", "SQL", "Git"],
        "preferred_skills": ["scikit-learn", "AWS", "FastAPI"],
        "responsibilities": [
            "Build data preprocessing and validation pipelines.",
            "Integrate ML models and LLMs into application backends."
        ]
    }
]

def create_default_lpa_jobs():
    created_count = 0
    for job_data in DEFAULT_JOBS:
        obj, created = Job.objects.get_or_create(
            title=job_data["title"],
            company=job_data["company"],
            defaults=job_data
        )
        if created:
            created_count += 1
    return created_count