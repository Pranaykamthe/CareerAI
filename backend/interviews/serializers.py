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
        user = self.context.get('request').user if 'request' in self.context else None
        if user and user.is_authenticated:
            return QuestionBookmark.objects.filter(user=user, question=obj).exists()
        return False


class QuestionBookmarkSerializer(serializers.ModelSerializer):
    question = QuestionBankSerializer(read_only=True)

    class Meta:
        model = QuestionBookmark
        fields = ['id', 'question', 'created_at']


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


class StartSessionRequestSerializer(serializers.Serializer):
    role_target = serializers.CharField(max_length=150, default='Python / Django Developer')
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
    answer = serializers.CharField(min_length=5, error_messages={'min_length': 'Answer must be at least 5 characters long.'})
    time_taken_seconds = serializers.IntegerField(min_value=0, default=0)