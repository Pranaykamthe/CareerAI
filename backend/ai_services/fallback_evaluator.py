import re
from typing import Dict, Any, List
from .base import BaseLLMService


class DeterministicFallbackEvaluator(BaseLLMService):
    """
    Rule-based deterministic scoring engine.
    Computes scores and actionable critique using semantic keyword matching,
    ideal point coverage, length heuristics, and STAR framework criteria for HR questions.
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
        candidate_lower = raw_text.lower()
        words = re.findall(r'\b[a-zA-Z0-9_+#.-]+\b', candidate_lower)
        word_count = len(words)

        # Baseline check for empty or trivial answers
        if word_count < 5:
            return {
                "score": 15,
                "feedback": "Your response is too brief to demonstrate competence. State your reasoning clearly and explain underlying concepts.",
                "strengths": ["Submitted an initial attempt."],
                "weaknesses": ["Answer is too brief and lacks explanatory detail."],
                "better_answer": sample_answer or "A strong answer addresses core principles, practical trade-offs, and structured examples.",
                "provider": "Deterministic Heuristic Engine (Fallback)"
            }

        # 1. Concept Coverage Score (Max 40 points)
        matched_points = []
        missing_points = []

        if ideal_points:
            for point in ideal_points:
                keywords = [
                    k.lower()
                    for k in re.findall(r'\b\w{3,}\b', str(point))
                    if k.lower() not in {
                        'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'are', 'your', 'about'
                    }
                ]
                hits = sum(1 for kw in keywords if kw in candidate_lower)
                if hits >= max(1, len(keywords) // 3):
                    matched_points.append(str(point))
                else:
                    missing_points.append(str(point))

            concept_ratio = len(matched_points) / max(1, len(ideal_points))
            concept_score = int(concept_ratio * 40)
        else:
            concept_score = 25
            matched_points.append("Addressed the general context of the question.")

        # 2. Depth & Length Heuristics (Max 30 points)
        if word_count >= 60:
            depth_score = 30
        elif word_count >= 35:
            depth_score = 24
        elif word_count >= 20:
            depth_score = 16
        else:
            depth_score = 10

        # 3. Structure & Communication Clarity (Max 20 points)
        clarity_score = 10
        structure_indicators = [
            'because', 'for example', 'such as', 'firstly', 'secondly',
            'however', 'in contrast', 'therefore', 'resulted in', 'specifically'
        ]
        found_indicators = [ind for ind in structure_indicators if ind in candidate_lower]
        if len(found_indicators) >= 2:
            clarity_score += 10
        elif len(found_indicators) >= 1:
            clarity_score += 5

        # 4. Phase 13: STAR Behavioral Heuristic (Max 15 bonus points)
        star_bonus = 0
        star_feedback_strength = None
        star_feedback_gap = None

        if category in ["HR", "Behavioral"]:
            star_keywords = [
                "situation", "task", "action", "result", "project",
                "team", "challenge", "resolved", "learned", "impact", "delivered"
            ]
            star_matches = sum(1 for kw in star_keywords if kw in candidate_lower)
            if star_matches >= 3:
                star_bonus = 15
                star_feedback_strength = "Demonstrated structured narrative flow covering scenario, action, and outcome."
            else:
                star_bonus = 5
                star_feedback_gap = "Structure response more cleanly using the STAR method (Situation, Task, Action, Result)."

        total_score = min(98, max(20, concept_score + depth_score + clarity_score + star_bonus))

        # Build constructive feedback strengths
        strengths = []
        if star_feedback_strength:
            strengths.append(star_feedback_strength)
        if matched_points:
            strengths.append(f"Correctly referenced key principles: {', '.join(matched_points[:2])}.")
        if word_count >= 40:
            strengths.append("Provided a well-elaborated explanation with clear context.")
        if found_indicators:
            strengths.append(f"Structured response logically using clarifying connectors ('{found_indicators[0]}').")

        if not strengths:
            strengths.append("Addressed the question topic directly.")

        # Build constructive feedback weaknesses
        weaknesses = []
        if star_feedback_gap:
            weaknesses.append(star_feedback_gap)
        if missing_points:
            weaknesses.append(f"Missed covering these expected points: {'; '.join(missing_points[:2])}.")
        if word_count < 35:
            weaknesses.append("Response is somewhat brief; consider including real-world examples, metrics, or trade-offs.")
        if not found_indicators and not star_feedback_gap:
            weaknesses.append("Could benefit from more structured transitions (e.g., 'for example', 'as a result').")

        if not weaknesses:
            weaknesses.append("Solid answer. Next time, articulate edge cases or quantifiable impact.")

        feedback_summary = (
            f"Evaluated performance: {total_score}/100. "
            f"You demonstrated good grasp of {' and '.join(matched_points[:2]) if matched_points else 'the topic'}. "
            f"{'Consider elaborating on ' + missing_points[0] + ' to achieve full credit.' if missing_points else 'Strong overall delivery.'}"
        )

        return {
            "score": total_score,
            "feedback": feedback_summary,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "better_answer": sample_answer or "A comprehensive answer incorporates the context, actions taken, and measurable results.",
            "provider": "Deterministic Heuristic Engine (Fallback)"
        }