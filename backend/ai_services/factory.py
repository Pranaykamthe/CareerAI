import os
import json
import urllib.request
import urllib.error
from .base import BaseLLMService
from .fallback_evaluator import DeterministicFallbackEvaluator

class GroqLLMService(BaseLLMService):
    """Adapter for Groq Cloud API using standard Python urllib (no heavy third-party SDK required)."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.fallback = DeterministicFallbackEvaluator()

    def evaluate_answer(self, question_text, category, difficulty, ideal_points, sample_answer, candidate_answer, role_target="Software Engineer"):
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

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": "You are a strict, helpful technical interview evaluator. You only respond in JSON."},
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
                    "Authorization": f"Bearer {self.api_key}"
                }
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                parsed["provider"] = "Groq (Llama-3.3-70B)"
                return parsed
        except Exception:
            # Automatic graceful fallback if API quota or network issue occurs
            res = self.fallback.evaluate_answer(question_text, category, difficulty, ideal_points, sample_answer, candidate_answer, role_target)
            res["provider"] = "Deterministic Heuristic Engine (LLM Network Fallback)"
            return res


def get_ai_service() -> BaseLLMService:
    """
    Factory function: returns Groq adapter if GROQ_API_KEY is configured in environment,
    otherwise returns the robust DeterministicFallbackEvaluator.
    """
    groq_key = os.getenv('GROQ_API_KEY', '').strip()
    if groq_key:
        return GroqLLMService(api_key=groq_key)
    return DeterministicFallbackEvaluator()