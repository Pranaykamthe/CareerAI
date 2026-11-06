import re
from typing import Dict, Any, List
from .base import BaseLLMService

class DeterministicFallbackEvaluator(BaseLLMService):
    """
    Rule-based deterministic scoring engine.
    Computes scores and actionable critique using semantic keyword matching,
    ideal point coverage, structured length heuristics, and clarity indicators.
    Guarantees 100% demo uptime with zero external network dependency.
    """

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
        raw_text = candidate_answer.strip()
        words = re.findall(r'\b[a-zA-Z0-9_+#.-]+\b', raw_text.lower())
        word_count = len(words)

        # Baseline check for empty or trivial answers
        if word_count < 5:
            return {
                "score": 15,
                "feedback": "Your response is too brief to demonstrate technical competence. State your reasoning clearly and explain underlying concepts.",
                "strengths": ["Submitted an initial attempt."],
                "weaknesses": ["Answer is too brief and lacks explanatory detail."],
                "better_answer": sample_answer or "A strong answer addresses core principles, practical trade-offs, and examples.",
                "provider": "Deterministic Heuristic Engine (Fallback)"
            }

        # 1. Concept Coverage Score (Max 45 points)
        matched_points = []
        missing_points = []

        if ideal_points:
            for point in ideal_points:
                # Tokenize key concepts from ideal point
                keywords = [k.lower() for k in re.findall(r'\b\w{3,}\b', point) if k.lower() not in {
                    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'are'
                }]
                hits = sum(1 for kw in keywords if kw in raw_text.lower())
                if hits >= max(1, len(keywords) // 3):
                    matched_points.append(point)
                else:
                    missing_points.append(point)

            concept_ratio = len(matched_points) / max(1, len(ideal_points))
            concept_score = int(concept_ratio * 45)
        else:
            concept_score = 30
            matched_points.append("Addressed the general context of the question.")

        # 2. Depth & Length Heuristics (Max 30 points)
        # 40-150 words is ideal for quick verbal turns; penalties for <25 words
        if word_count >= 60:
            depth_score = 30
        elif word_count >= 35:
            depth_score = 24
        elif word_count >= 20:
            depth_score = 16
        else:
            depth_score = 10

        # 3. Structure & Communication Clarity (Max 25 points)
        clarity_score = 15
        structure_indicators = ['because', 'for example', 'such as', 'firstly', 'secondly', 'however', 'in contrast', 'therefore', 'resulted in']
        found_indicators = [ind for ind in structure_indicators if ind in raw_text.lower()]
        if len(found_indicators) >= 2:
            clarity_score += 10
        elif len(found_indicators) >= 1:
            clarity_score += 5

        total_score = min(98, max(20, concept_score + depth_score + clarity_score))

        # Build constructive strengths and weaknesses
        strengths = []
        if matched_points:
            strengths.append(f"Correctly referenced key principles: {', '.join(matched_points[:2])}.")
        if word_count >= 40:
            strengths.append("Provided a well-elaborated explanation with good technical depth.")
        if found_indicators:
            strengths.append(f"Structured response logically using clarifying connectors ('{found_indicators[0]}').")

        if not strengths:
            strengths.append("Addressed the question topic directly.")

        weaknesses = []
        if missing_points:
            weaknesses.append(f"Missed covering these expected points: {'; '.join(missing_points[:2])}.")
        if word_count < 35:
            weaknesses.append("Response is somewhat brief; consider including real-world examples or trade-offs.")
        if not found_indicators:
            weaknesses.append("Could benefit from more structured transitions (e.g., 'for example', 'in addition').")

        if not weaknesses:
            weaknesses.append("Solid answer. Next time, articulate edge cases or performance implications.")

        feedback_summary = (
            f"Evaluated performance: {total_score}/100. "
            f"You demonstrated good grasp of {' and '.join(matched_points[:2]) if matched_points else 'the subject'}. "
            f"{'Try expanding on ' + missing_points[0] + ' to achieve full credit.' if missing_points else 'Strong conceptual delivery.'}"
        )

        return {
            "score": total_score,
            "feedback": feedback_summary,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "better_answer": sample_answer or "A comprehensive answer incorporates the core mechanics, edge cases, and an illustrative example.",
            "provider": "Deterministic Heuristic Engine (Fallback)"
        }