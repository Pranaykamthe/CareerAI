from rest_framework.throttling import UserRateThrottle


class GroqAIRateThrottle(UserRateThrottle):
    """Limits expensive Groq LLM endpoints to 30 requests/hour per authenticated user."""
    scope = 'ai_endpoints'