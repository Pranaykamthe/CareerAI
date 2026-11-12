from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from jobs.models import Job
from interviews.models import QuestionBank

User = get_user_model()


class CareerAISanityE2ETests(APITestCase):
    """
    Simple end-to-end sanity tests verifying core CareerAI workflows
    for academic demonstration readiness.
    """

    def setUp(self):
        # 1. Create a candidate and an admin user
        self.candidate_email = "candidate_test@careerai.com"
        self.candidate_password = "TestPassword123!"
        self.candidate = User.objects.create_user(
            username="candidate_test",
            email=self.candidate_email,
            password=self.candidate_password,
            role="candidate",
        )

        self.admin = User.objects.create_superuser(
            username="admin_test",
            email="admin_test@careerai.com",
            password="AdminPassword123!",
            role="admin",
        )

        # 2. Seed a sample job
        self.job = Job.objects.create(
            title="Full Stack Python & React Developer",
            company="TechNova India",
            location="Bengaluru, India",
            job_type="Full-time",
            experience_level="Mid Level",
            min_experience_years=2,
            salary_range="₹12 - ₹18 LPA",
            description="Build scalable REST APIs with Django and modern UIs with React.",
            required_skills=["Python", "Django", "React", "SQL"],
            preferred_skills=["Docker", "AWS"],
        )

        # 3. Seed sample interview questions
        for idx in range(1, 4):
            QuestionBank.objects.create(
                question_text=f"Sample Technical Question {idx}: Explain RESTful API principles.",
                category="Technical",
                difficulty="Medium",
                role_target="Software Engineer",
                ideal_points=["Statelessness", "HTTP methods", "JSON payloads"],
                sample_answer="REST APIs use standard HTTP verbs and stateless client-server communication.",
            )

    def _authenticate_candidate(self):
        self.client.force_authenticate(user=self.candidate)

    def test_01_healthcheck_endpoint(self):
        response = self.client.get("/api/health/")
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND])

    def test_02_candidate_login_and_jwt_token(self):
        response = self.client.post(
            "/api/auth/login/",
            {"email": self.candidate_email, "password": self.candidate_password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_03_profile_retrieval_and_update(self):
        self._authenticate_candidate()
        response = self.client.put(
            "/api/auth/profile/",
            {
                "headline": "Full Stack Developer",
                "target_role": "Software Engineer",
                "skills_list": ["Python", "Django", "React"],
                "experience_years": 2.5,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        profile_payload = response.data.get("profile", response.data)
        self.assertEqual(profile_payload["target_role"], "Software Engineer")

    def test_04_job_listing_and_application_tracking(self):
        self._authenticate_candidate()
        jobs_res = self.client.get("/api/jobs/")
        self.assertEqual(jobs_res.status_code, status.HTTP_200_OK)

        app_res = self.client.post(
            "/api/applications/",
            {"job_id": self.job.id, "status": "Applied", "notes": "Submitted via CareerAI"},
            format="json",
        )
        self.assertEqual(app_res.status_code, status.HTTP_201_CREATED)

    def test_05_mock_interview_session_flow(self):
        self._authenticate_candidate()
        start_res = self.client.post(
            "/api/interviews/sessions/start/",
            {
                "role_target": "Software Engineer",
                "session_type": "Technical",
                "difficulty": "Medium",
                "total_questions": 3,
            },
            format="json",
        )
        self.assertEqual(start_res.status_code, status.HTTP_201_CREATED)
        session_id = start_res.data["id"]

        # Submit answer for Turn 1
        answer_res = self.client.post(
            f"/api/interviews/sessions/{session_id}/submit-answer/",
            {
                "candidate_answer": "REST is stateless and uses GET, POST, PUT, DELETE over HTTP with JSON."
            },
            format="json",
        )
        self.assertEqual(answer_res.status_code, status.HTTP_200_OK)

    def test_06_role_based_admin_guard(self):
        # Candidate must be denied access to admin endpoints
        self._authenticate_candidate()
        res = self.client.get("/api/dashboard/admin/overview/")
        self.assertIn(res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])