import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "careerai_backend.settings")
django.setup()

from django.contrib.auth import get_user_model
from jobs.seed_data import create_default_lpa_jobs
from interviews.seed_questions import seed_default_questions

User = get_user_model()


def run_demo_seed():
    print("--- Seeding CareerAI Demonstration Data ---")

    # 1. Ensure Admin Account Exists
    admin_email = "admin@careerai.com"
    if not User.objects.filter(email=admin_email).exists():
        User.objects.create_superuser(
            username="admin",
            email=admin_email,
            password="AdminPassword123!",
            role="admin",
        )
        print(f"[OK] Created Admin user: {admin_email} / AdminPassword123!")
    else:
        print(f"[SKIP] Admin user already exists: {admin_email}")

    # 2. Ensure Demo Candidate Account Exists
    candidate_email = "demo@careerai.com"
    candidate, created = User.objects.get_or_create(
        email=candidate_email,
        defaults={
            "username": "demo_candidate",
            "first_name": "Pranav",
            "last_name": "Candidate",
            "role": "candidate",
        },
    )
    if created:
        candidate.set_password("DemoPassword123!")
        candidate.save()
        if hasattr(candidate, "profile"):
            profile = candidate.profile
            profile.headline = "Full Stack Python & React Developer"
            profile.target_role = "Software Engineer"
            profile.bio = "Passionate developer experienced in building RESTful web applications with Django and React."
            profile.experience_years = 2.0
            profile.location = "Nagpur, Maharashtra, India"
            profile.skills_list = ["Python", "Django", "React", "JavaScript", "SQL", "Git", "Bootstrap"]
            profile.education = [
                {
                    "institution": "Visvesvaraya National Institute of Technology",
                    "degree": "B.Tech in Computer Science",
                    "year": "2022 - 2026",
                }
            ]
            profile.save()
        print(f"[OK] Created Demo Candidate: {candidate_email} / DemoPassword123!")
    else:
        print(f"[SKIP] Demo Candidate already exists: {candidate_email}")

    # 3. Seed Sample Jobs (LPA)
    jobs_created = create_default_lpa_jobs()
    print(f"[OK] Jobs seeded: {jobs_created}")

    # 4. Seed Interview Question Bank
    questions_created = seed_default_questions()
    print(f"[OK] Interview questions seeded: {questions_created}")

    print("--- CareerAI Demo Environment Ready ---")


if __name__ == "__main__":
    run_demo_seed()