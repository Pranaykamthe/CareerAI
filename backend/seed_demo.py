import json
import os
from datetime import timedelta
import django
from django.utils import timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "careerai_backend.settings")
django.setup()

from django.contrib.auth import get_user_model
from jobs.models import Job
from jobs.seed_data import create_default_lpa_jobs
from interviews.models import QuestionBank, InterviewSession, InterviewTurn
from interviews.seed_questions import seed_default_questions

User = get_user_model()

try:
    from applications.models import JobApplication
except ImportError:
    JobApplication = None


def run_demo_seed():
    print("--- Seeding CareerAI Presentation & Demo Data ---")

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
        print(f"[OK] Admin user verified: {admin_email}")

    # 2. Ensure Demo Candidate Account Exists
    candidate_email = "demo@careerai.com"
    candidate, created = User.objects.get_or_create(
        email=candidate_email,
        defaults={
            "username": "Pranav Kamthe",
            "first_name": "Pranav",
            "last_name": "Kamthe",
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
        profile.bio = (
            "Full Stack Software Developer experienced in building scalable REST APIs "
            "with Python, Django REST Framework, React.js, and SQL databases."
        )
        profile.experience_years = 2.0
        profile.location = "Pune, Maharashtra, India"
        profile.skills_list = [
            "Python",
            "Django",
            "React",
            "JavaScript",
            "REST API",
            "SQL",
            "Git",
            "Bootstrap",
        ]
        profile.education = [
            {
                "institution": "Savitribai Phule Pune University",
                "degree": "B.E. in Computer Engineering",
                "year": "2022 - 2026",
            }
        ]
        profile.save()
    print(f"[OK] Demo Candidate ready: {candidate_email} / DemoPassword123!")

    # 3. Seed Sample Jobs & Question Bank
    jobs_created = create_default_lpa_jobs()
    questions_created = seed_default_questions()
    print(f"[OK] Jobs seeded: {jobs_created} | Questions seeded: {questions_created}")

    # 4. Seed Clean, High-Scoring Mock Interview Sessions for Demo Candidate
    InterviewSession.objects.filter(user=candidate, overall_score__lt=40).delete()

    if not InterviewSession.objects.filter(user=candidate, status="completed").exists():
        sample_qs = list(QuestionBank.objects.filter(is_active=True)[:3])
        if sample_qs:
            session_1 = InterviewSession.objects.create(
                user=candidate,
                role_target="Full Stack Software Engineer",
                category="Technical",
                difficulty="Medium",
                total_questions=len(sample_qs),
                current_question_index=len(sample_qs),
                overall_score=84,
                status="completed",
                completed_at=timezone.now() - timedelta(hours=3),
            )
            scores = [86, 82, 84]
            for idx, q in enumerate(sample_qs, start=1):
                sc = scores[idx - 1]
                feedback_payload = {
                    "summary": "Clear architectural explanation with strong practical trade-off awareness.",
                    "strengths": [
                        "Accurate technical terminology and structured reasoning",
                        "Provided concrete implementation examples",
                    ],
                    "weaknesses": [
                        "Could mention horizontal caching or edge-case monitoring metrics"
                    ],
                    "provider": "Groq (Llama-3.3-70B)",
                }
                InterviewTurn.objects.create(
                    session=session_1,
                    question=q,
                    turn_number=idx,
                    question_text=q.question_text,
                    category=q.category,
                    candidate_answer=(
                        "In production Django and React systems, I structure stateless JWT authentication "
                        "with indexed relational queries, pagination, and clear separation of service layers "
                        "to keep latency low and maintainability high."
                    ),
                    ai_score=sc,
                    ai_feedback=json.dumps(feedback_payload),
                    better_answer=q.sample_answer or "Include measurable latency and throughput metrics.",
                    is_answered=True,
                    time_taken_seconds=68,
                    submitted_at=timezone.now() - timedelta(hours=3),
                )
            print("[OK] Seeded completed Mock Interview session (Score: 84/100)")

    # 5. Seed Realistic Kanban Applications if Model Exists
    if JobApplication is not None:
        jobs = list(Job.objects.all()[:3])
        statuses = ["interview", "applied", "saved"]
        for job, app_status in zip(jobs, statuses):
            JobApplication.objects.get_or_create(
                user=candidate,
                job=job,
                defaults={"status": app_status, "notes": "Matched via CareerAI Smart Job Engine."},
            )
        print("[OK] Seeded Kanban applications across Interview, Applied, and Saved stages")

    print("--- CareerAI Demo Environment Ready ---")


if __name__ == "__main__":
    run_demo_seed()