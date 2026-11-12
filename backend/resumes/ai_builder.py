import os
import json
import urllib.request
import urllib.error
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')


class GroqResumeBuilderService:
    """Uses Groq Cloud API to rewrite resume sections and resolve ATS analyzer issues."""

    CANDIDATE_MODELS = [
        "llama-3.3-70b-versatile",
        "openai/gpt-oss-120b",
        "llama-3.1-8b-instant",
    ]

    def __init__(self):
        self.api_key = os.getenv('GROQ_API_KEY', '').strip()

    def _call_groq(self, system_prompt: str, user_prompt: str) -> dict:
        if not self.api_key:
            raise RuntimeError("GROQ_API_KEY is not configured in backend/.env")

        url = "https://api.groq.com/openai/v1/chat/completions"
        last_error = ""

        for model_name in self.CANDIDATE_MODELS:
            payload = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.25,
                "response_format": {"type": "json_object"},
            }
            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode('utf-8'),
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {self.api_key}",
                        "User-Agent": "CareerAI/1.0",
                    },
                )
                with urllib.request.urlopen(req, timeout=18) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    raw = data["choices"][0]["message"]["content"].strip()
                    if raw.startswith("```"):
                        raw = raw.strip("`")
                        if raw.startswith("json"):
                            raw = raw[4:].strip()
                    result = json.loads(raw)
                    result["provider"] = f"Groq AI ({model_name})"
                    return result
            except Exception as e:
                last_error = str(e)
                continue

        raise RuntimeError(f"All Groq models failed: {last_error}")

    def improve_section(self, section: str, action: str, original_text: str, custom_prompt: str = "", target_role: str = "Software Engineer") -> dict:
        action_instructions = {
            "improve_sentence": "Enhance clarity, conciseness, and executive impact.",
            "professional_tone": "Elevate the tone to sound polished, senior, and industry-ready.",
            "add_action_verbs": "Start bullet points with strong, varied action verbs (e.g., Architected, Engineered, Spearheaded, Optimized).",
            "quantify_impact": "Rewrite using the XYZ formula (Accomplished [X] as measured by [Y], by doing [Z]) with realistic metrics/percentages.",
            "shorten_content": "Condense the text by 25-35% while keeping all technical keywords and measurable impact.",
            "custom": custom_prompt or "Improve this resume content for ATS compatibility and recruiter readability.",
        }
        instruction = action_instructions.get(action, action_instructions["improve_sentence"])

        system_prompt = (
            "You are an expert ATS resume writer and technical recruiter. "
            "Respond ONLY with valid JSON. Never fabricate fake companies or degrees."
        )
        user_prompt = f"""Target Role: {target_role}
Resume Section: {section}
Task: {instruction}

Original Content:
\"\"\"{original_text}\"\"\"

Return strictly a JSON object with these exact keys:
{{
  "improved_text": "<the rewritten text ready to replace the original>",
  "explanation": "<1-2 sentence explanation of what was improved>",
  "estimated_ats_boost": <integer between 3 and 12>
}}"""

        try:
            return self._call_groq(system_prompt, user_prompt)
        except Exception as e:
            # Local fallback if API key is missing or rate-limited
            cleaned = original_text.strip()
            if cleaned and not cleaned.endswith('.'):
                cleaned += '.'
            return {
                "improved_text": f"Spearheaded {cleaned[0].lower() + cleaned[1:]}" if len(cleaned) > 1 else cleaned,
                "explanation": f"Applied action-oriented phrasing (Offline fallback: {str(e)[:45]}).",
                "estimated_ats_boost": 4,
                "provider": "Local Fallback Engine",
            }

    def fix_ats_issues(self, draft_data: dict, ats_weaknesses: list, ats_recommendations: list) -> dict:
        """Takes the entire draft JSON + ATS Analyzer feedback and returns an ATS-optimized draft."""
        system_prompt = (
            "You are an ATS optimization specialist. You rewrite candidate resume drafts to fix ATS weaknesses, "
            "add strong action verbs, ensure measurable impact, and maintain clean structure. Return ONLY valid JSON."
        )
        user_prompt = f"""Current Resume Draft JSON:
{json.dumps(draft_data)}

Detected ATS Weaknesses:
{json.dumps(ats_weaknesses)}

ATS Analyzer Recommendations:
{json.dumps(ats_recommendations)}

Improve the summary, work_experience bullets, and projects bullets to resolve the ATS weaknesses above without inventing fake employers or degrees.
Return strictly a JSON object with these exact keys:
{{
  "summary": "<improved 3-4 line professional summary>",
  "work_experience": <updated list of work_experience objects keeping exact keys: role, company, location, duration, bullets>,
  "projects": <updated list of projects objects keeping exact keys: title, link, description, bullets>,
  "changes_summary": ["<change 1>", "<change 2>", "<change 3>"]
}}"""

        try:
            return self._call_groq(system_prompt, user_prompt)
        except Exception as e:
            return {
                "summary": draft_data.get("summary", ""),
                "work_experience": draft_data.get("work_experience", []),
                "projects": draft_data.get("projects", []),
                "changes_summary": [f"Could not reach Groq API ({str(e)[:50]}). Check GROQ_API_KEY in backend/.env."],
                "provider": "Local Fallback Engine",
            }