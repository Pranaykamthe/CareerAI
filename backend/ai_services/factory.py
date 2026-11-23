import os
import json
import urllib.request
import urllib.error
from pathlib import Path
from dotenv import load_dotenv

# Explicitly load .env from backend directory
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

from .base import BaseLLMService
from .fallback_evaluator import DeterministicFallbackEvaluator


class GroqLLMService(BaseLLMService):
    """
    Unified Groq Cloud API adapter for CareerAI:
    - Mock Interview Answer Evaluation (Technical, HR & Behavioral STAR)
    - AI Resume Builder Section Improvements (with optional Job Description tailoring)
    - AI Resume Builder ATS Auto-Fix
    - Resume-to-Profile Auto-Fill Extraction
    - Tailored Cover Letter Generation
    Automatically falls back to DeterministicFallbackEvaluator if the API is unreachable.
    """

    API_URL = "https://api.groq.com/openai/v1/chat/completions"

    # Active text models verified on your Groq account
    CANDIDATE_MODELS = [
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.8-27b",
    ]

    def __init__(self, api_key: str):
        self.api_key = (api_key or "").strip().strip('"').strip("'")
        self.fallback = DeterministicFallbackEvaluator()

    def _call_groq_json(self, system_prompt: str, user_prompt: str, temperature: float = 0.25, timeout: int = 20) -> dict:
        """
        Sends a JSON-mode chat completion request across candidate Groq models.
        Raises RuntimeError if all candidate models fail.
        """
        if not self.api_key:
            raise RuntimeError("GROQ_API_KEY is not configured.")

        last_error = "Unknown Groq API error"

        for model_name in self.CANDIDATE_MODELS:
            payload = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": temperature,
                "response_format": {"type": "json_object"},
            }

            try:
                req = urllib.request.Request(
                    self.API_URL,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {self.api_key}",
                        "User-Agent": "CareerAI/1.0",
                    },
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=timeout) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    raw_content = data["choices"][0]["message"]["content"].strip()

                    # Strip markdown code fences if emitted by model
                    if raw_content.startswith("```"):
                        raw_content = raw_content.strip("`")
                        if raw_content.startswith("json"):
                            raw_content = raw_content[4:].strip()

                    return json.loads(raw_content)

            except urllib.error.HTTPError as http_err:
                try:
                    err_body = http_err.read().decode("utf-8")
                    msg = json.loads(err_body).get("error", {}).get("message", str(http_err))
                    last_error = f"{http_err.code}: {msg}"
                except Exception:
                    last_error = str(http_err)
                continue
            except Exception as exc:
                last_error = str(exc)
                continue

        raise RuntimeError(last_error)

    # =========================================================================
    # 1. Mock Interview Answer Evaluation (Phases 12–13)
    # =========================================================================
    def evaluate_answer(
        self,
        question_text,
        category,
        difficulty,
        ideal_points,
        sample_answer,
        candidate_answer,
        role_target="Software Engineer",
    ):
        star_instruction = ""
        if str(category).lower() in ["behavioral", "hr"]:
            star_instruction = (
                "Because this is a Behavioral/HR question, explicitly evaluate adherence to the "
                "STAR framework (Situation, Task, Action, Result) and measurable impact."
            )

        system_prompt = (
            "You are a strict, constructive senior technical and behavioral interviewer. "
            "You respond ONLY in valid JSON."
        )
        user_prompt = f"""Evaluate a candidate interviewing for the role of {role_target}.
Question ({category} - {difficulty}): {question_text}
Ideal Talking Points: {json.dumps(ideal_points)}
Sample Best Answer: {sample_answer}
Candidate's Answer: {candidate_answer}
{star_instruction}

Return ONLY a valid JSON object with these exact keys:
{{
  "score": <integer between 0 and 100>,
  "feedback": "<concise 2-3 sentence overall critique>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness or missing point 1>", "<weakness 2>"],
  "better_answer": "<polished 3-4 sentence model answer using best industry practices>"
}}"""

        try:
            parsed = self._call_groq_json(system_prompt, user_prompt, temperature=0.2, timeout=15)
            parsed["provider"] = "Groq AI"
            return parsed
        except Exception as exc:
            res = self.fallback.evaluate_answer(
                question_text,
                category,
                difficulty,
                ideal_points,
                sample_answer,
                candidate_answer,
                role_target,
            )
            res["provider"] = f"Deterministic Heuristic Engine (Fallback: {str(exc)[:45]})"
            return res

    # =========================================================================
    # 2. AI Resume Builder: Section Improvement (Phases 19 & 21)
    # =========================================================================
    def improve_resume_section(
        self,
        section: str,
        action: str,
        content: str,
        target_role: str = "Software Engineer",
        ats_issues=None,
        target_job: dict = None,
    ) -> dict:
        job_context = ""
        if target_job and isinstance(target_job, dict):
            job_context = (
                f"\nTarget Job Title: {target_job.get('title', '')}"
                f"\nCompany: {target_job.get('company', '')}"
                f"\nRequired Skills: {', '.join(target_job.get('required_skills', []))}"
                f"\nJob Description Snippet: {str(target_job.get('description', ''))[:800]}"
            )

        system_prompt = (
            "You are an expert ATS Resume Writer and Technical Recruiter. "
            "Rewrite the provided resume section using strong action verbs, XYZ quantified metrics, "
            "and high-impact ATS keywords. Return strictly valid JSON with keys: "
            "'improved_text' (string; use newline-separated '- ' bullets for experience/projects), "
            "'explanation' (string explaining what was improved), and "
            "'estimated_score_boost' (integer between 4 and 12)."
        )
        user_prompt = (
            f"Target Role: {target_role}\n"
            f"Section: {section}\n"
            f"Requested Action: {action}\n"
            f"Known ATS Issues: {json.dumps(ats_issues or [])}"
            f"{job_context}\n\n"
            f"Original Content:\n{content}"
        )

        try:
            parsed = self._call_groq_json(system_prompt, user_prompt, temperature=0.35, timeout=25)
            parsed["provider"] = "Groq AI"
            return parsed
        except Exception:
            lines = [line.strip().lstrip("-•* ") for line in str(content).splitlines() if line.strip()]
            if section == "summary":
                improved = (
                    f"Results-driven {target_role} with proven expertise in full-stack engineering, "
                    f"scalable REST API architecture, and cloud deployment. {str(content).strip()} "
                    f"Demonstrated track record of reducing system latency by 35% and delivering reliable production features."
                )
            else:
                improved = "\n".join(
                    f"- Spearheaded and {line[0].lower() + line[1:] if line else 'delivered core feature'} — improving system efficiency by 30%."
                    for line in lines
                )
            return {
                "improved_text": improved,
                "explanation": f"Applied '{action}' with strong action verbs and quantified impact metrics for {target_role}.",
                "estimated_score_boost": 7,
                "provider": "Deterministic Fallback",
            }

    # =========================================================================
    # 3. AI Resume Builder: Auto-Fix ATS Issues (Phase 19)
    # =========================================================================
    def auto_fix_ats_issues(
        self,
        draft_data: dict,
        weaknesses: list,
        recommendations: list,
        target_role: str = "Software Engineer",
    ) -> dict:
        system_prompt = (
            "You are an expert ATS Resume Optimizer. Fix all listed ATS weaknesses and recommendations "
            "by adding strong action verbs, XYZ quantified metrics, and relevant technical keywords. "
            "Return strictly valid JSON with keys: "
            "'summary' (string), "
            "'skills' (object mapping category strings to comma-separated skill strings, or list of skills matching input structure), "
            "'work_experience' (list of objects with role, company, location, duration, bullets), "
            "'projects' (list of objects with title, link, bullets), "
            "'changes_summary' (list of 3-5 short bullet strings summarizing the fixes), and "
            "'estimated_new_score' (integer between 85 and 98)."
        )
        user_prompt = (
            f"Target Role: {target_role}\n"
            f"ATS Weaknesses to Fix: {json.dumps(weaknesses or [])}\n"
            f"ATS Recommendations: {json.dumps(recommendations or [])}\n\n"
            f"Current Resume Draft JSON:\n{json.dumps(draft_data)}"
        )

        try:
            parsed = self._call_groq_json(system_prompt, user_prompt, temperature=0.3, timeout=30)
            parsed["provider"] = "Groq AI"
            return parsed
        except Exception:
            summary = (
                f"Impact-oriented {target_role} skilled in Python, Django, React, RESTful APIs, and SQL. "
                f"Experienced in architecting scalable web applications, optimizing database queries by 40%, "
                f"and accelerating CI/CD release cycles across agile engineering teams."
            )
            work_exp = draft_data.get("work_experience", [])
            for exp in work_exp:
                if not exp.get("bullets"):
                    exp["bullets"] = [
                        "Architected and deployed full-stack React and Django services with 99.9% uptime.",
                        "Optimized SQL queries and caching layers, reducing API response latency by 38%.",
                        "Automated testing and Git CI/CD workflows, cutting release turnaround time by 45%.",
                    ]
            return {
                "summary": summary,
                "skills": draft_data.get("skills", {}),
                "work_experience": work_exp,
                "projects": draft_data.get("projects", []),
                "changes_summary": [
                    "Added quantified XYZ metrics (38% latency reduction, 99.9% uptime)",
                    "Replaced passive phrasing with strong ATS action verbs",
                    "Expanded keyword density to meet ATS best practices",
                ],
                "estimated_new_score": 91,
                "provider": "Deterministic Fallback",
            }

    # =========================================================================
    # 4. Resume-to-Profile Auto-Fill Extraction (Phase 20)
    # =========================================================================
    def extract_profile_from_resume(self, raw_text: str) -> dict:
        system_prompt = (
            "You are a precise resume parser. Extract structured candidate profile details from the resume text. "
            "Return strictly valid JSON with keys: "
            "'first_name', 'last_name', 'phone', 'headline', 'target_role', 'bio', "
            "'experience_years' (float), 'location', 'linkedin_url', 'github_url', 'portfolio_url', "
            "'skills_list' (array of strings), 'education' (array of objects with institution, degree, year), "
            "and 'experience' (array of objects with role, company, duration, description)."
        )
        user_prompt = f"Resume Text:\n{(raw_text or '')[:6000]}"

        try:
            parsed = self._call_groq_json(system_prompt, user_prompt, temperature=0.1, timeout=20)
            parsed["provider"] = "Groq AI"
            return parsed
        except Exception:
            if hasattr(self.fallback, "extract_profile_from_resume"):
                return self.fallback.extract_profile_from_resume(raw_text)
            return {
                "first_name": "",
                "last_name": "",
                "phone": "",
                "headline": "Software Engineer",
                "target_role": "Software Engineer",
                "bio": "",
                "experience_years": 0.0,
                "location": "",
                "linkedin_url": "",
                "github_url": "",
                "portfolio_url": "",
                "skills_list": [],
                "education": [],
                "experience": [],
                "provider": "Deterministic Fallback",
            }

    # =========================================================================
    # 5. AI Tailored Cover Letter Generator (Phase 21)
    # =========================================================================
    def generate_cover_letter(
        self,
        candidate_name: str = "Candidate",
        target_role: str = "",
        company_name: str = "",
        job_description: str = "",
        resume_summary: str = "",
        skills=None,
        tone: str = "Professional & Confident",
    ) -> dict:
        skills_str = ", ".join(skills[:15]) if isinstance(skills, list) else str(skills or "")

        system_prompt = (
            "You are an executive career coach. Write a tailored, ATS-friendly 3-paragraph cover letter. "
            "Return strictly valid JSON with keys: "
            "'subject_line' (string), "
            "'cover_letter' (string with greeting, 3 crisp paragraphs, and sign-off), and "
            "'key_highlights' (list of 3 short bullet strings explaining role alignment)."
        )
        user_prompt = (
            f"Candidate Name: {candidate_name}\n"
            f"Target Role: {target_role}\n"
            f"Target Company: {company_name}\n"
            f"Tone: {tone}\n"
            f"Key Skills: {skills_str}\n"
            f"Resume Summary: {resume_summary}\n"
            f"Job Description:\n{str(job_description)[:2000]}"
        )

        try:
            parsed = self._call_groq_json(system_prompt, user_prompt, temperature=0.35, timeout=25)
            if parsed.get("cover_letter"):
                return {
                    "subject_line": parsed.get("subject_line", f"Application for {target_role} — {candidate_name}"),
                    "cover_letter": parsed["cover_letter"],
                    "key_highlights": parsed.get("key_highlights", []),
                    "provider": "Groq AI",
                }
        except Exception:
            pass

        fallback_letter = (
            f"Dear Hiring Manager at {company_name},\n\n"
            f"I am excited to apply for the {target_role} position at {company_name}. With hands-on experience in "
            f"{skills_str or 'modern software engineering'} and a strong track record of building reliable, user-focused solutions, "
            f"I am confident in my ability to make an immediate impact on your team.\n\n"
            f"{resume_summary or 'Throughout my recent projects and technical roles, I have focused on clean architecture, measurable performance improvements, and collaborative delivery.'} "
            f"My background aligns closely with the requirements of the {target_role} role, enabling me to contribute quickly across development, testing, and deployment workflows.\n\n"
            f"Thank you for considering my application. I welcome the opportunity to discuss how my skills and experience can support {company_name}'s upcoming initiatives.\n\n"
            f"Sincerely,\n{candidate_name}"
        )
        return {
            "subject_line": f"Application for {target_role} — {candidate_name}",
            "cover_letter": fallback_letter,
            "key_highlights": [
                f"Tailored directly to {target_role} at {company_name}",
                f"Highlights core stack: {skills_str[:60] or 'Full-Stack Development'}",
                "Structured in a crisp 3-paragraph executive format",
            ],
            "provider": "Deterministic Fallback",
        }


def get_ai_service() -> BaseLLMService:
    """
    Factory function: returns GroqLLMService if GROQ_API_KEY is configured in backend/.env,
    otherwise returns DeterministicFallbackEvaluator.
    """
    groq_key = (os.getenv("GROQ_API_KEY") or "").strip().strip('"').strip("'")
    if groq_key:
        return GroqLLMService(api_key=groq_key)
    return DeterministicFallbackEvaluator()


class LLMServiceFactory:
    """Compatibility wrapper for views calling LLMServiceFactory.get_service()."""

    @staticmethod
    def get_service() -> BaseLLMService:
        return get_ai_service()