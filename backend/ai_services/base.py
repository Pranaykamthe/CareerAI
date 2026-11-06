from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseLLMService(ABC):
    """
    Abstract base interface for LLM evaluators and prompt engines.
    Ensures provider-independence across Groq, Gemini, or local heuristics.
    """

    @abstractmethod
    def evaluate_answer(
        self,
        question_text: str,
        category: str,
        difficulty: str,
        ideal_points: List[str],
        sample_answer: str,
        candidate_answer: str,
        role_target: str = "Software Engineer"
    ) -> Dict[str, Any]:
        """
        Evaluates a candidate's interview answer.
        Returns a dict structured as:
        {
            "score": int (0-100),
            "feedback": str,
            "strengths": list[str],
            "weaknesses": list[str],
            "better_answer": str,
            "provider": str
        }
        """
        pass