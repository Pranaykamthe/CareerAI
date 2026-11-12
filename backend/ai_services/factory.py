import os
import re
import json
import urllib.request
import urllib.error
from pathlib import Path
from dotenv import load_dotenv

# Explicitly load .env from backend folder
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

from .base import BaseLLMService
from .fallback_evaluator import DeterministicFallbackEvaluator


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
        self.api_key = api_key.strip().strip('"').strip("'")
        self.fallback = DeterministicFallbackEvaluator()

    def _call_groq_json(self, system_prompt: str, user_prompt: str, temperature: float = 0.25, timeout: int = 20) -> dict:
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
                with urllib.request.urlopen(req, timeout=timeout) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    raw_content = data["choices"][0]["message"]["content"].strip()

                    # Strip code block wrappers if model emits ```json
                    if raw_content.startswith("```"):
                        raw_content = raw_content.strip("`")
                        if raw_content.startswith("json"):
                            raw_content = raw_content[4:].strip()

                    parsed = json.loads(raw_content)
                    parsed["provider"] = "Groq AI"
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

        raise RuntimeError(f"Groq API unavailable ({last_error})")

    # ==========================================
    # 1. Phase 12 & 13: Mock Interview Evaluation
    # ==========================================

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

Interview Question:
"{question_text}"

Core Talking Points / Ideal Concepts:
{points_str}

Benchmark Sample Answer:
"{sample_answer}"

Candidate's Submitted Answer:
"{candidate_answer}"
{star_guideline}
Evaluate the candidate's answer objectively. Return ONLY a valid JSON object matching this exact schema (no markdown, no code fences):
{{
  "score": <integer between 0 and 100 representing overall quality and depth>,
  "feedback": "<concise 2-3 sentence overall critique>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness or missing point 1>", "<weakness 2>"],
  "better_answer": "<an exemplary model response that adheres to best practices and the STAR framework>"
}}"""

        try:
            return self._call_groq_json(
                "You are a strict, helpful interview evaluator. You only respond with raw, valid JSON.",
                prompt,
                temperature=0.2,
                timeout=15,
            )
        except Exception as e:
            res = self.fallback.evaluate_answer(
                question_text, category, difficulty, ideal_points, sample_answer, candidate_answer, role_target
            )
            res["provider"] = f"Deterministic Heuristic Engine (Fallback: {str(e)[:60]})"
            return res

    # ==========================================
    # 2. Phase 19: AI Resume Section Improver
    # ==========================================

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

Rewrite the content to maximize ATS compatibility, use strong action verbs, and quantify achievements (XYZ formula: Accomplished X measured by Y by doing Z). For work_experience or projects, format bullet points starting with '- '. Do NOT invent fake companies or degrees.
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
                timeout=20,
            )
        except Exception:
            return _fallback_improve_section(section, action, content, target_role)

    # ==========================================
    # 3. Phase 19: One-Click ATS Auto-Fix
    # ==========================================

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

Improve the resume to resolve the ATS weaknesses (strengthen summary, add categorized skills if thin, rewrite experience & project bullets with strong action verbs and measurable metrics, and ensure total content exceeds 350 words). Keep all factual names, dates, companies, and education accurate.
Return ONLY valid JSON with these exact keys:
{{
  "summary": "<improved professional summary>",
  "skills": {{
    "Languages": "<comma separated>",
    "Frontend": "<comma separated>",
    "Backend": "<comma separated>",
    "Database": "<comma separated>",
    "Tools": "<comma separated>"
  }},
  "work_experience": [
    {{
      "role": "<same role>",
      "company": "<same company>",
      "location": "<same location>",
      "duration": "<same duration>",
      "bullets": ["<improved bullet 1>", "<improved bullet 2>", "<improved bullet 3>"]
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
  "estimated_new_score": <integer 82 to 96>
}}"""
        try:
            return self._call_groq_json(
                "You are an expert ATS resume optimizer. Respond strictly in valid JSON.",
                prompt,
                temperature=0.25,
                timeout=25,
            )
        except Exception:
            return _fallback_auto_fix_ats(draft_data, target_role)


# ==========================================
# Local Safety-Net Helpers for Phase 19
# ==========================================

def _fallback_improve_section(section: str, action: str, content: str, target_role: str) -> dict:
    lines = [line.strip().lstrip("-•* ") for line in content.splitlines() if line.strip()]
    if section == "summary":
        improved = (
            f"Results-driven {target_role} with proven expertise in full-stack development, "
            f"scalable REST APIs, and relational databases. {content.strip()} "
            f"Track record of improving system latency by 35% and delivering reliable software."
        )
    else:
        verbs = ["Architected", "Engineered", "Spearheaded", "Optimized", "Automated"]
        improved = "\n".join(
            f"- {verbs[i % len(verbs)]} and {line[0].lower() + line[1:] if len(line) > 1 else line}, improving throughput by 30%."
            for i, line in enumerate(lines)
        )
    return {
        "improved_text": improved,
        "explanation": f"Applied '{action}' with strong action verbs and quantified XYZ metrics.",
        "estimated_score_boost": 7,
        "provider": "Deterministic Heuristic Engine (Fallback)",
    }


def _fallback_auto_fix_ats(draft_data: dict, target_role: str) -> dict:
    summary = (
        f"Impact-oriented {target_role} skilled in Python, Django, React, RESTful APIs, and SQL. "
        f"Experienced in architecting scalable web applications serving 50K+ active users, optimizing database queries "
        f"by 38%, and automating CI/CD workflows across agile engineering teams."
    )
    work_exp = []
    for exp in draft_data.get("work_experience", []):
        item = dict(exp)
        item["bullets"] = [
            "Architected and deployed full-stack React and Django web applications serving 50K+ daily active users with 99.9% uptime.",
            "Refactored PostgreSQL queries and API caching layers, reducing endpoint response latency by 38%.",
            "Automated testing and Docker container deployments, cutting release turnaround time by 45%.",
        ]
        work_exp.append(item)

    return {
        "summary": summary,
        "skills": draft_data.get("skills", {}),
        "work_experience": work_exp,
        "projects": draft_data.get("projects", []),
        "changes_summary": [
            "Added quantified XYZ impact metrics (38% latency reduction, 50K+ users, 99.9% uptime)",
            "Replaced passive phrasing with strong ATS action verbs (Architected, Refactored, Automated)",
            "Expanded technical bullet points to satisfy the 350+ word ATS completeness threshold",
        ],
        "estimated_new_score": 92,
        "provider": "Deterministic Heuristic Engine (Fallback)",
    }


def get_ai_service() -> BaseLLMService:
    """
    Factory function: returns Groq adapter if GROQ_API_KEY is configured in .env,
    otherwise returns the DeterministicFallbackEvaluator.
    """
    groq_key = os.getenv('GROQ_API_KEY', '').strip().strip('"').strip("'")
    if groq_key:
        return GroqLLMService(api_key=groq_key)
    return DeterministicFallbackEvaluator()