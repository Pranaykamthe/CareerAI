import random
from django.utils import timezone
from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import QuestionBank, QuestionBookmark, InterviewSession, InterviewTurn
from .serializers import (
    QuestionBankSerializer,
    QuestionBookmarkSerializer,
    InterviewSessionSerializer,
    StartSessionRequestSerializer,
    SubmitAnswerRequestSerializer,
)
from .seed_questions import seed_default_questions


class QuestionBankListView(generics.ListAPIView):
    serializer_class = QuestionBankSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = QuestionBank.objects.filter(is_active=True)
        category = self.request.query_params.get('category')
        difficulty = self.request.query_params.get('difficulty')
        search = self.request.query_params.get('search')
        bookmarked_only = self.request.query_params.get('bookmarked')

        if category and category != 'All':
            queryset = queryset.filter(category=category)
        if difficulty and difficulty != 'All':
            queryset = queryset.filter(difficulty=difficulty)
        if search:
            queryset = queryset.filter(
                Q(question_text__icontains=search) |
                Q(role_target__icontains=search)
            )
        if bookmarked_only == 'true':
            bookmarked_ids = QuestionBookmark.objects.filter(
                user=self.request.user
            ).values_list('question_id', flat=True)
            queryset = queryset.filter(id__in=bookmarked_ids)

        return queryset


class QuestionDetailView(generics.RetrieveAPIView):
    queryset = QuestionBank.objects.filter(is_active=True)
    serializer_class = QuestionBankSerializer
    permission_classes = [permissions.IsAuthenticated]


class ToggleBookmarkView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            question = QuestionBank.objects.get(pk=pk, is_active=True)
        except QuestionBank.DoesNotExist:
            return Response({'detail': 'Question not found.'}, status=status.HTTP_404_NOT_FOUND)

        bookmark, created = QuestionBookmark.objects.get_or_create(
            user=request.user,
            question=question
        )

        if not created:
            bookmark.delete()
            return Response({'bookmarked': False, 'message': 'Bookmark removed.'})

        return Response({'bookmarked': True, 'message': 'Question saved to bookmarks.'})


class SeedQuestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        count = seed_default_questions()
        return Response({'status': 'success', 'seeded_count': count})


class StartInterviewSessionView(APIView):
    """
    Initializes a new interview session and selects questions matching the target criteria.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = StartSessionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        role_target = data['role_target']
        category = data['category']
        difficulty = data['difficulty']
        total_questions = data['total_questions']

        # Query pool of questions
        pool = QuestionBank.objects.filter(is_active=True)
        if category != 'Mixed':
            pool = pool.filter(category=category)
        if difficulty:
            matching_diff = pool.filter(difficulty=difficulty)
            if matching_diff.count() >= total_questions:
                pool = matching_diff

        selected_questions = list(pool)
        random.shuffle(selected_questions)

        # Fallback if question bank is not fully populated
        if len(selected_questions) < total_questions:
            remaining_needed = total_questions - len(selected_questions)
            fallback_qs = list(QuestionBank.objects.filter(is_active=True).exclude(id__in=[q.id for q in selected_questions]))
            random.shuffle(fallback_qs)
            selected_questions.extend(fallback_qs[:remaining_needed])

        # If still empty (e.g. fresh database before seed), insert emergency baseline questions
        if not selected_questions:
            seed_default_questions()
            selected_questions = list(QuestionBank.objects.filter(is_active=True)[:total_questions])

        selected_questions = selected_questions[:total_questions]

        # Create session
        session = InterviewSession.objects.create(
            user=request.user,
            role_target=role_target,
            category=category,
            difficulty=difficulty,
            total_questions=len(selected_questions),
            current_question_index=0,
            status='in_progress'
        )

        # Create turns
        for index, q in enumerate(selected_questions, start=1):
            InterviewTurn.objects.create(
                session=session,
                question=q,
                turn_number=index,
                question_text=q.question_text,
                category=q.category
            )

        return Response(
            InterviewSessionSerializer(session, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class InterviewSessionListView(generics.ListAPIView):
    serializer_class = InterviewSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return InterviewSession.objects.filter(user=self.request.user)


class InterviewSessionDetailView(generics.RetrieveAPIView):
    serializer_class = InterviewSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return InterviewSession.objects.filter(user=self.request.user)


class SubmitAnswerView(APIView):
    """
    Records a candidate's answer for the current question turn and advances the session state.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            session = InterviewSession.objects.get(pk=pk, user=request.user)
        except InterviewSession.DoesNotExist:
            return Response({'detail': 'Interview session not found.'}, status=status.HTTP_404_NOT_FOUND)

        if session.status != 'in_progress':
            return Response(
                {'detail': f'Cannot submit answer to a session that is {session.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = SubmitAnswerRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Identify current turn
        turns = session.turns.order_by('turn_number')
        unanswered_turn = turns.filter(is_answered=False).first()

        if not unanswered_turn:
            session.complete_session()
            return Response(
                {'detail': 'All questions have already been answered.', 'session': InterviewSessionSerializer(session).data},
                status=status.HTTP_200_OK
            )

        # Record answer
        unanswered_turn.candidate_answer = serializer.validated_data['answer']
        unanswered_turn.time_taken_seconds = serializer.validated_data.get('time_taken_seconds', 0)
        unanswered_turn.is_answered = True
        unanswered_turn.submitted_at = timezone.now()
        unanswered_turn.save()

        # Advance index
        session.current_question_index += 1
        if session.current_question_index >= session.total_questions:
            session.complete_session()
        else:
            session.save(update_fields=['current_question_index'])

        return Response({
            'message': 'Answer submitted successfully.',
            'turn': {
                'turn_number': unanswered_turn.turn_number,
                'is_answered': True,
                'candidate_answer': unanswered_turn.candidate_answer
            },
            'session': InterviewSessionSerializer(session, context={'request': request}).data
        })


class CancelInterviewSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            session = InterviewSession.objects.get(pk=pk, user=request.user)
        except InterviewSession.DoesNotExist:
            return Response({'detail': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        session.status = 'cancelled'
        session.save(update_fields=['status'])
        return Response({'status': 'cancelled', 'message': 'Interview session ended.'})