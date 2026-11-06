import os
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
        "llama-3.1-8b-instant"
    ]

    def __init__(self, api_key: str):
        self.api_key = api_key.strip()
        self.fallback = DeterministicFallbackEvaluator()

    def evaluate_answer(
        self,
        question_text: str,
        category: str,
        difficulty: str,
        ideal_points: list,
        sample_answer: str,
        candidate_answer: str,
        role_target: str = "Software Engineer"
    ):
        url = "https://api.groq.com/openai/v1/chat/completions"

        # Phase 13: Injected STAR evaluation rubric for HR and Behavioral categories
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

        last_error = ""

        for model_name in self.CANDIDATE_MODELS:
            payload = {
                "model": model_name,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a strict, helpful interview evaluator. You only respond with raw, valid JSON."
                    },
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2,
                "response_format": {"type": "json_object"}
            }

            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode('utf-8'),
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {self.api_key}",
                        "User-Agent": "Mozilla/5.0"
                    }
                )
                with urllib.request.urlopen(req, timeout=15) as resp:
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

        # Deterministic fallback if API calls fail or models are unreachable
        res = self.fallback.evaluate_answer(
            question_text, category, difficulty, ideal_points, sample_answer, candidate_answer, role_target
        )
        res["provider"] = f"Deterministic Heuristic Engine (Fallback: {last_error[:60]})"
        return res


def get_ai_service() -> BaseLLMService:
    """
    Factory function: returns Groq adapter if GROQ_API_KEY is configured in .env,
    otherwise returns the DeterministicFallbackEvaluator.
    """
    groq_key = os.getenv('GROQ_API_KEY', '').strip()
    if groq_key:
        return GroqLLMService(api_key=groq_key)
    return DeterministicFallbackEvaluator()