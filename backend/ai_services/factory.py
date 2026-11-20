import os
import json
import urllib.request
import urllib.error
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

from .base import BaseLLMService
from .fallback_evaluator import DeterministicFallbackEvaluator


def fallback_extract_profile(raw_text: str, fallback_parsed: dict = None) -> dict:
    """Deterministic fallback parser if GROQ_API_KEY is missing or unreachable."""
    parsed = fallback_parsed or {}
    contact = parsed.get('contact_info', {}) if isinstance(parsed.get('contact_info'), dict) else {}
    skills = parsed.get('skills', []) if isinstance(parsed.get('skills'), list) else []

    lines = [line.strip() for line in (raw_text or '').splitlines() if line.strip()]
    guessed_name = lines[0] if lines and len(lines[0].split()) <= 4 else ""

    return {
        "full_name": guessed_name,
        "headline": f"Aspiring Software Engineer | {', '.join(skills[:4])}" if skills else "Software Engineer",
        "target_role": "Software Engineer",
        "experience_years": 0,
        "phone": contact.get('phone', ''),
        "location": contact.get('location', ''),
        "linkedin_url": contact.get('linkedin', ''),
        "github_url": contact.get('github', ''),
        "portfolio_url": contact.get('portfolio', ''),
        "summary": (raw_text or '')[:320].strip(),
        "skills": skills[:20],
        "education": [],
        "experience": [],
        "provider": "Deterministic Parser (Fallback)"
    }


class GroqLLMService(BaseLLMService):
    """Adapter for Groq Cloud API targeting active models in the account catalog."""

    CANDIDATE_MODELS = [
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.8-27b",
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
    ]

    def __init__(self, api_key: str):
        self.api_key = api_key.strip()
        self.fallback = DeterministicFallbackEvaluator()

    def _call_groq_json(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> dict:
        """Reusable helper for Groq JSON completions using active account models."""
        url = "https://api.groq.com/openai/v1/chat/completions"
        last_error = ""

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
                    url,
                    data=json.dumps(payload).encode('utf-8'),
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {self.api_key}",
                        "User-Agent": "Mozilla/5.0",
                    },
                )
                with urllib.request.urlopen(req, timeout=22) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    raw = data["choices"][0]["message"]["content"].strip()
                    if raw.startswith("```"):
                        raw = raw.strip("`")
                        if raw.startswith("json"):
                            raw = raw[4:].strip()
                    parsed = json.loads(raw)
                    parsed["provider"] = "Groq AI"
                    parsed["model_used"] = model_name
                    return parsed
            except urllib.error.HTTPError as http_err:
                try:
                    err_body = http_err.read().decode('utf-8')
                    last_error = f"{http_err.code}: {json.loads(err_body).get('error', {}).get('message', str(http_err))}"
                except Exception:
                    last_error = str(http_err)
                continue
            except Exception as e:
                last_error = str(e)
                continue

        raise RuntimeError(f"Groq API unavailable: {last_error}")

    # ==========================================================
    # 1. Resume-to-Profile Auto-Fill Extraction (Groq AI)
    # ==========================================================
    def extract_profile_from_resume(self, raw_text: str, fallback_parsed: dict = None) -> dict:
        if not raw_text or len(raw_text.strip()) < 20:
            return fallback_extract_profile(raw_text, fallback_parsed)

        system_prompt = (
            "You are an accurate enterprise HR Resume Parser. Extract structured candidate profile fields "
            "strictly from the provided resume text. Do NOT fabricate companies, degrees, or contact details. "
            "If a field is not present in the resume, return an empty string, 0, or an empty list. "
            "Respond ONLY with valid JSON."
        )

        user_prompt = f"""Extract structured candidate profile data from this resume text:

\"\"\"{raw_text[:12000]}\"\"\"

Return strictly a JSON object matching this exact schema:
{{
  "full_name": "<candidate full name or empty string>",
  "headline": "<concise professional headline e.g. Full-Stack Developer | Python, Django & React>",
  "target_role": "<best matching primary job title e.g. Software Engineer>",
  "experience_years": <number (integer or float) of total professional years of experience, 0 if fresher>,
  "phone": "<phone number or empty string>",
  "location": "<city, state/country or empty string>",
  "linkedin_url": "<LinkedIn URL empty or string>",
  "github_url": "<GitHub URL empty or string>",
  "portfolio_url": "<Portfolio/website URL empty or string>",
  "summary": "<2-4 sentence professional bio/summary extracted or synthesized strictly from the resume>",
  "skills": ["<skill 1>", "<skill 2>", "<skill 3>"],
  "education": [
    {{
      "degree": "<degree name e.g. B.Tech in Computer Science>",
      "institution": "<college/university name>",
      "year": "<graduation year or duration e.g. 2024>",
      "grade": "<CGPA/percentage else empty if mentioned, string>"
    }}
  ],
  "experience": [
    {{
      "role": "<job or internship title>",
      "company": "<company or organization name>",
      "duration": "<start - end dates>",
      "location": "<location if mentioned, else empty string>",
      "description": "<concise summary of responsibilities & achievements>"
    }}
  ]
}}"""

        try:
            result = self._call_groq_json(system_prompt, user_prompt, temperature=0.1)
            if not isinstance(result.get("skills"), list):
                result["skills"] = []
            if not isinstance(result.get("education"), list):
                result["education"] = []
            if not isinstance(result.get("experience"), list):
                result["experience"] = []
            return result
        except Exception:
            return fallback_extract_profile(raw_text, fallback_parsed)

    # ==========================================================
    # 2. Mock Interview Answer Evaluation
    # ==========================================================
    def evaluate_answer(
        self,
        question_text: str,
        category: str,
        difficulty: str,
        ideal_points: list,
        sample_answer: str,
        candidate_answer: str,
        role_target: str = "Software Engineer",
    ):
        star_guideline = ""
        if category in ["HR", "Behavioral"]:
            star_guideline = """
CRITICAL EVALUATION CRITERIA FOR BEHAVIORAL / HR QUESTIONS:
1. STAR Framework Conformance: Did the candidate articulate the Situation, Task, Action, and Result?
2. Communication Clarity & Professional Tone: Is the response concise, confident, and professional?
3. Action & Impact: Did the candidate highlight their individual contribution ('I' vs 'we') and quantifiable outcomes?
"""
        points_str = json.dumps(ideal_points) if isinstance(ideal_points, list) else str(ideal_points)

        prompt = f"""You are an expert executive technical recruiter and senior hiring manager conducting an interview evaluation.
Role Target: {role_target}
Question Category: {category}
Difficulty Level: {difficulty}

Interview Question: "{question_text}"
Core Talking Points / Ideal Concepts: {points_str}
Benchmark Sample Answer: "{sample_answer}"
Candidate's Submitted Answer: "{candidate_answer}"
{star_guideline}

Evaluate the candidate's answer objectively. Return ONLY a valid JSON object matching this exact schema:
{{
  "score": <integer between 0 and 100>,
  "feedback": "<concise 2-3 sentence overall critique>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness or missing point 1>", "<weakness 2>"],
  "better_answer": "<an exemplary model response adhering to best practices and the STAR framework>"
}}"""

        try:
            return self._call_groq_json(
                "You are a strict, helpful interview evaluator. You only respond with raw, valid JSON.",
                prompt,
                temperature=0.2,
            )
        except Exception as e:
            res = self.fallback.evaluate_answer(
                question_text, category, difficulty, ideal_points, sample_answer, candidate_answer, role_target
            )
            res["provider"] = f"Deterministic Heuristic Engine (Fallback: {str(e)[:60]})"
            return res

    # ==========================================================
    # 3. AI Resume Builder Section & ATS Improvements
    # ==========================================================
    def improve_resume_section(
        self,
        section: str,
        action: str,
        content: str,
        target_role: str = "Software Engineer",
        ats_issues: list = None,
    ) -> dict:
        ats_context = f"\nATS Analyzer Issues to Fix: {json.dumps(ats_issues)}" if ats_issues else ""
        prompt = f"""You are an expert ATS Resume Writer and Career Coach.
Target Role: {target_role}
Section: {section}
Requested Improvement Action: {action}
Original Content:
{content}
{ats_context}

Rewrite the content to maximize ATS compatibility, use strong action verbs, and quantify achievements (XYZ formula). Do NOT invent fake companies or degrees.
Return ONLY valid JSON:
{{
  "improved_text": "<rewritten content>",
  "explanation": "<1-2 sentence explanation of why this improves ATS score>",
  "estimated_score_boost": <integer 3 to 15>
}}"""
        try:
            return self._call_groq_json(
                "You are an expert ATS resume optimizer. Respond strictly in valid JSON.",
                prompt,
                temperature=0.25,
            )
        except Exception:
            return {
                "improved_text": content,
                "explanation": "Groq API temporarily unavailable. Please verify your GROQ_API_KEY and try again.",
                "estimated_score_boost": 0,
                "provider": "Fallback",
            }

    def auto_fix_ats_issues(
        self,
        draft_data: dict,
        weaknesses: list,
        recommendations: list,
        target_role: str = "Software Engineer",
    ) -> dict:
        prompt = f"""You are an expert ATS Resume Optimizer. Fix all problems identified by the ATS Analyzer in this resume draft.
Target Role: {target_role}
ATS Weaknesses Found: {json.dumps(weaknesses)}
ATS Recommendations: {json.dumps(recommendations)}
Current Resume JSON:
{json.dumps(draft_data)}

Improve the resume to resolve the ATS weaknesses. Keep all factual names, dates, companies, and education accurate.
Return ONLY valid JSON with these exact keys:
{{
  "summary": "<improved professional summary>",
  "skills": {{
    "Languages": "<comma separated>",
    "Frontend": "<comma separated>",
    "Backend": "<comma separated>",
    "Database": "<comma separated>",
    "Tools & Cloud": "<comma separated>"
  }},
  "work_experience": [
    {{
      "role": "<same role>",
      "company": "<same company>",
      "location": "<same location>",
      "duration": "<same duration>",
      "bullets": ["<improved bullet 1>", "<improved bullet 2>"]
    }}
  ],
  "projects": [
    {{
      "title": "<same title>",
      "link": "<same link>",
      "bullets": ["<improved bullet 1>", "<improved bullet 2>"]
    }}
  ],
  "changes_summary": ["<change 1>", "<change 2>", "<change 3>"],
  "estimated_new_score": <integer 80 to 96>
}}"""
        return self._call_groq_json(
            "You are an expert ATS resume optimizer. Respond strictly in valid JSON.",
            prompt,
            temperature=0.25,
        )


def get_ai_service() -> BaseLLMService:
    """
    Factory function: returns Groq adapter if GROQ_API_KEY is configured in .env,
    otherwise returns DeterministicFallbackEvaluator with profile extraction attached.
    """
    groq_key = os.getenv('GROQ_API_KEY', '').strip()
    if groq_key:
        return GroqLLMService(api_key=groq_key)

    fallback = DeterministicFallbackEvaluator()
    if not hasattr(fallback, 'extract_profile_from_resume'):
        fallback.extract_profile_from_resume = fallback_extract_profile
    return fallback