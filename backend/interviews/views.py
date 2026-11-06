from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.db.models import Q
from .models import QuestionBank, QuestionBookmark
from .serializers import QuestionBankSerializer, QuestionBookmarkSerializer
from .seed_questions import seed_default_questions

class QuestionBankListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        category = request.query_params.get('category')
        difficulty = request.query_params.get('difficulty')
        search = request.query_params.get('search')
        bookmarked_only = request.query_params.get('bookmarked_only')

        queryset = QuestionBank.objects.filter(is_active=True)

        if category and category != 'All':
            queryset = queryset.filter(category=category)

        if difficulty and difficulty != 'All':
            queryset = queryset.filter(difficulty=difficulty)

        if search:
            queryset = queryset.filter(
                Q(question_text__icontains=search) |
                Q(role_target__icontains=search)
            )

        if bookmarked_only in ['true', 'True', '1']:
            bookmarked_ids = QuestionBookmark.objects.filter(
                user=request.user
            ).values_list('question_id', flat=True)
            queryset = queryset.filter(id__in=bookmarked_ids)

        # Auto-seed if the question bank is completely empty
        if not QuestionBank.objects.exists():
            seed_default_questions()
            queryset = QuestionBank.objects.filter(is_active=True)

        serializer = QuestionBankSerializer(queryset, many=True, context={'request': request})
        
        # Summary counts
        total_questions = QuestionBank.objects.filter(is_active=True).count()
        total_bookmarks = QuestionBookmark.objects.filter(user=request.user).count()

        return Response({
            'count': len(serializer.data),
            'total_in_system': total_questions,
            'user_bookmarks_count': total_bookmarks,
            'questions': serializer.data
        }, status=status.HTTP_200_OK)


class QuestionDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            question = QuestionBank.objects.get(pk=pk, is_active=True)
        except QuestionBank.DoesNotExist:
            return Response({'detail': 'Question not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = QuestionBankSerializer(question, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ToggleBookmarkView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            question = QuestionBank.objects.get(pk=pk, is_active=True)
        except QuestionBank.DoesNotExist:
            return Response({'detail': 'Question not found.'}, status=status.HTTP_404_NOT_FOUND)

        bookmark = QuestionBookmark.objects.filter(user=request.user, question=question).first()
        if bookmark:
            bookmark.delete()
            return Response({
                'is_bookmarked': False,
                'message': 'Question removed from your saved bookmarks.'
            }, status=status.HTTP_200_OK)
        else:
            QuestionBookmark.objects.create(user=request.user, question=question)
            return Response({
                'is_bookmarked': True,
                'message': 'Question saved to your bookmarks!'
            }, status=status.HTTP_201_CREATED)


class SeedQuestionsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        created_count = seed_default_questions()
        return Response({
            'message': 'Curated question bank successfully synchronized.',
            'total_seeded': QuestionBank.objects.count(),
            'newly_added': created_count
        }, status=status.HTTP_200_OK)