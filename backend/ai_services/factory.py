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
    """Adapter for Groq Cloud API targeting active models in account catalog."""

    CANDIDATE_MODELS = [
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.8-27b"
    ]

    def __init__(self, api_key: str):
        self.api_key = api_key.strip()
        self.fallback = DeterministicFallbackEvaluator()

    def evaluate_answer(
        self,
        question_text,
        category,
        difficulty,
        ideal_points,
        sample_answer,
        candidate_answer,
        role_target="Software Engineer"
    ):
        url = "https://api.groq.com/openai/v1/chat/completions"
        prompt = f"""You are a senior technical interviewer evaluating a candidate for the role of {role_target}.
Question ({category} - {difficulty}): {question_text}
Ideal Talking Points: {json.dumps(ideal_points)}
Sample Best Answer: {sample_answer}
Candidate's Answer: {candidate_answer}

Evaluate the candidate's answer strictly and objectively. Return ONLY a valid JSON object with these exact keys:
{{
  "score": <integer between 0 and 100>,
  "feedback": "<concise 2-3 sentence overall critique>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness or missing point 1>", "<weakness 2>"],
  "better_answer": "<polished 3-4 sentence model answer using the best industry practices>"
}}
Do NOT include markdown formatting or extra text outside the JSON object."""

        last_error = ""

        for model_name in self.CANDIDATE_MODELS:
            payload = {
                "model": model_name,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a strict, helpful technical interview evaluator. You only respond in JSON."
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

        # Deterministic fallback if API calls fail
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