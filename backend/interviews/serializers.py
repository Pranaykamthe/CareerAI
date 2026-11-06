from rest_framework import serializers
from .models import QuestionBank, QuestionBookmark

class QuestionBankSerializer(serializers.ModelSerializer):
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = QuestionBank
        fields = (
            'id',
            'category',
            'role_target',
            'difficulty',
            'question_text',
            'ideal_points',
            'sample_answer',
            'is_bookmarked',
            'created_at',
        )

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return QuestionBookmark.objects.filter(user=request.user, question=obj).exists()
        return False


class QuestionBookmarkSerializer(serializers.ModelSerializer):
    question = QuestionBankSerializer(read_only=True)

    class Meta:
        model = QuestionBookmark
        fields = ('id', 'question', 'created_at')