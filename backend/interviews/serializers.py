from rest_framework import serializers
from .models import QuestionBank, QuestionBookmark, InterviewSession, InterviewTurn


class QuestionBankSerializer(serializers.ModelSerializer):
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = QuestionBank
        fields = [
            'id',
            'category',
            'role_target',
            'difficulty',
            'question_text',
            'ideal_points',
            'sample_answer',
            'is_bookmarked',
            'created_at',
        ]

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        if user and user.is_authenticated:
            return QuestionBookmark.objects.filter(user=user, question=obj).exists()
        return False


class QuestionBookmarkSerializer(serializers.ModelSerializer):
    question = QuestionBankSerializer(read_only=True)

    class Meta:
        model = QuestionBookmark
        fields = ['id', 'user', 'question', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class InterviewTurnSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewTurn
        fields = [
            'id',
            'turn_number',
            'question_text',
            'category',
            'candidate_answer',
            'is_answered',
            'time_taken_seconds',
            'submitted_at',
            'ai_score',
            'ai_feedback',
            'better_answer',
        ]
        read_only_fields = [
            'id',
            'turn_number',
            'question_text',
            'category',
            'is_answered',
            'submitted_at',
            'ai_score',
            'ai_feedback',
            'better_answer',
        ]


class InterviewSessionSerializer(serializers.ModelSerializer):
    turns = InterviewTurnSerializer(many=True, read_only=True)
    answered_turns_count = serializers.SerializerMethodField()
    turn_count = serializers.SerializerMethodField()

    class Meta:
        model = InterviewSession
        fields = [
            'id',
            'role_target',
            'category',
            'difficulty',
            'total_questions',
            'current_question_index',
            'status',
            'overall_score',
            'created_at',
            'completed_at',
            'answered_turns_count',
            'turn_count',
            'turns',
        ]
        read_only_fields = [
            'id',
            'current_question_index',
            'status',
            'overall_score',
            'created_at',
            'completed_at',
        ]

    def get_answered_turns_count(self, obj):
        return obj.turns.filter(is_answered=True).count()

    def get_turn_count(self, obj):
        return obj.turns.count()


class StartSessionRequestSerializer(serializers.Serializer):
    role_target = serializers.CharField(max_length=150, default='General Software Engineer')
    category = serializers.ChoiceField(
        choices=InterviewSession.CATEGORY_CHOICES,
        default='Mixed'
    )
    difficulty = serializers.ChoiceField(
        choices=InterviewSession.DIFFICULTY_CHOICES,
        default='Medium'
    )
    total_questions = serializers.IntegerField(min_value=1, max_value=10, default=3)


class SubmitAnswerRequestSerializer(serializers.Serializer):
    turn_id = serializers.IntegerField(required=False)
    answer = serializers.CharField(
        min_length=5,
        required=False,
        error_messages={'min_length': 'Answer must be at least 5 characters long.'}
    )
    candidate_answer = serializers.CharField(
        min_length=5,
        required=False,
        error_messages={'min_length': 'Answer must be at least 5 characters long.'}
    )
    time_taken_seconds = serializers.IntegerField(min_value=0, default=0, required=False)
    time_spent_seconds = serializers.IntegerField(min_value=0, default=0, required=False)

    def validate(self, attrs):
        if not attrs.get('answer') and not attrs.get('candidate_answer'):
            raise serializers.ValidationError('Either "answer" or "candidate_answer" must be provided.')
        return attrs


class InterviewReportSerializer(serializers.ModelSerializer):
    turns = InterviewTurnSerializer(many=True, read_only=True)
    performance_classification = serializers.SerializerMethodField()
    category_breakdown = serializers.SerializerMethodField()
    aggregated_strengths = serializers.SerializerMethodField()
    aggregated_weaknesses = serializers.SerializerMethodField()
    duration_minutes = serializers.SerializerMethodField()

    class Meta:
        model = InterviewSession
        fields = [
            'id',
            'role_target',
            'category',
            'difficulty',
            'total_questions',
            'overall_score',
            'status',
            'created_at',
            'completed_at',
            'duration_minutes',
            'performance_classification',
            'category_breakdown',
            'aggregated_strengths',
            'aggregated_weaknesses',
            'turns',
        ]

    def get_performance_classification(self, obj):
        score = obj.overall_score or 0
        if score >= 85:
            return {
                'label': 'Excellent',
                'badge_class': 'success',
                'summary': 'Ready for industry interviews with high confidence.'
            }
        elif score >= 70:
            return {
                'label': 'Good',
                'badge_class': 'primary',
                'summary': 'Solid foundational knowledge; minor polish needed on depth.'
            }
        elif score >= 50:
            return {
                'label': 'Average',
                'badge_class': 'warning',
                'summary': 'Understands core concepts; needs more structured, concise explanations.'
            }
        return {
            'label': 'Needs Improvement',
            'badge_class': 'danger',
            'summary': 'Key technical details or STAR framework principles were missing.'
        }

    def get_category_breakdown(self, obj):
        turns = obj.turns.filter(ai_score__isnull=False)
        categories = {}
        for turn in turns:
            cat = turn.category or 'General'
            if cat not in categories:
                categories[cat] = {'total_score': 0, 'count': 0}
            categories[cat]['total_score'] += float(turn.ai_score)
            categories[cat]['count'] += 1

        breakdown = []
        for cat, data in categories.items():
            avg = round(data['total_score'] / data['count']) if data['count'] > 0 else 0
            breakdown.append({
                'category': cat,
                'average_score': avg,
                'questions_answered': data['count']
            })
        return breakdown

    def get_aggregated_strengths(self, obj):
        import json
        strengths = []
        for turn in obj.turns.all():
            if turn.ai_feedback:
                try:
                    fb = json.loads(turn.ai_feedback) if isinstance(turn.ai_feedback, str) else turn.ai_feedback
                    if isinstance(fb, dict) and isinstance(fb.get('strengths'), list):
                        strengths.extend(fb['strengths'])
                except Exception:
                    pass
            if hasattr(turn, 'strengths') and isinstance(turn.strengths, list):
                strengths.extend(turn.strengths)
        seen = set()
        unique = [s for s in strengths if not (s in seen or seen.add(s))]
        return unique[:6]

    def get_aggregated_weaknesses(self, obj):
        import json
        weaknesses = []
        for turn in obj.turns.all():
            if turn.ai_feedback:
                try:
                    fb = json.loads(turn.ai_feedback) if isinstance(turn.ai_feedback, str) else turn.ai_feedback
                    if isinstance(fb, dict) and isinstance(fb.get('weaknesses'), list):
                        weaknesses.extend(fb['weaknesses'])
                except Exception:
                    pass
            if hasattr(turn, 'weaknesses') and isinstance(turn.weaknesses, list):
                weaknesses.extend(turn.weaknesses)
        seen = set()
        unique = [w for w in weaknesses if not (w in seen or seen.add(w))]
        return unique[:6]

    def get_duration_minutes(self, obj):
        if obj.completed_at and obj.created_at:
            delta = obj.completed_at - obj.created_at
            return max(1, round(delta.total_seconds() / 60))
        return 1