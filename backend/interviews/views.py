import json
import random
from django.utils import timezone
from django.db.models import Q
from django.shortcuts import get_object_or_404
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
    InterviewReportSerializer,
)
from .seed_questions import seed_default_questions
from ai_services.factory import get_ai_service


class QuestionBankListView(generics.ListAPIView):
    """
    Lists all active curated interview questions with optional filtering by
    category, difficulty tier, text search, or bookmarked items.
    """
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
    """
    Retrieves a single question bank record with its talking points and model answer.
    """
    queryset = QuestionBank.objects.filter(is_active=True)
    serializer_class = QuestionBankSerializer
    permission_classes = [permissions.IsAuthenticated]


class ToggleBookmarkView(APIView):
    """
    Toggles a question in or out of the authenticated candidate's bookmarked list.
    """
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
    """
    Seeds the question bank database with curated baseline interview questions.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        count = seed_default_questions()
        return Response({'status': 'success', 'seeded_count': count})


class StartInterviewSessionView(APIView):
    """
    Initializes a new mock interview session and assembles questions matching
    the target role, format track, and difficulty tier.
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

        # 1. Query pool of active questions
        pool = QuestionBank.objects.filter(is_active=True)
        if category != 'Mixed':
            pool = pool.filter(category=category)
        if difficulty:
            matching_diff = pool.filter(difficulty=difficulty)
            if matching_diff.count() >= total_questions:
                pool = matching_diff

        selected_questions = list(pool)
        random.shuffle(selected_questions)

        # 2. Fallback if matching pool does not fulfill required question count
        if len(selected_questions) < total_questions:
            remaining_needed = total_questions - len(selected_questions)
            fallback_qs = list(
                QuestionBank.objects.filter(is_active=True).exclude(
                    id__in=[q.id for q in selected_questions]
                )
            )
            random.shuffle(fallback_qs)
            selected_questions.extend(fallback_qs[:remaining_needed])

        # 3. Emergency baseline population if database has not yet been seeded
        if not selected_questions:
            seed_default_questions()
            selected_questions = list(QuestionBank.objects.filter(is_active=True)[:total_questions])

        selected_questions = selected_questions[:total_questions]

        # 4. Create InterviewSession record
        session = InterviewSession.objects.create(
            user=request.user,
            role_target=role_target,
            category=category,
            difficulty=difficulty,
            total_questions=len(selected_questions),
            current_question_index=0,
            status='in_progress'
        )

        # 5. Create InterviewTurns sequentially
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
    """
    Lists past and current mock interview sessions for the logged-in candidate.
    """
    serializer_class = InterviewSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return InterviewSession.objects.filter(user=self.request.user).order_by('-created_at')


class InterviewSessionDetailView(generics.RetrieveAPIView):
    """
    Retrieves the full details and turn transcript of a specific interview session.
    """
    serializer_class = InterviewSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return InterviewSession.objects.filter(user=self.request.user)


class SubmitAnswerView(APIView):
    """
    Phase 12: Evaluates the candidate's submitted answer in real time using
    the modular AI service engine (Groq/Gemini with deterministic fallback).
    Persists evaluation metrics (score, feedback, model answer) onto InterviewTurn,
    recalculates session averages, and advances session progression.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        session = get_object_or_404(InterviewSession, pk=pk, user=request.user)

        if session.status in ['completed', 'Completed', 'cancelled']:
            return Response(
                {'detail': f'Cannot submit answer to a session that is {session.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Accept payload from either turn-based or sequential submissions
        turn_id = request.data.get('turn_id')
        candidate_answer = (
            request.data.get('candidate_answer') or request.data.get('answer', '')
        ).strip()
        time_spent_seconds = request.data.get('time_spent_seconds') or request.data.get(
            'time_taken_seconds', 0
        )

        if not candidate_answer:
            return Response(
                {'detail': 'Please provide an answer before submitting.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Identify target turn
        if turn_id:
            turn = get_object_or_404(InterviewTurn, pk=turn_id, session=session)
        else:
            turns = session.turns.order_by('turn_number')
            turn = turns.filter(is_answered=False).first()
            if not turn:
                if hasattr(session, 'complete_session'):
                    session.complete_session()
                else:
                    session.status = 'completed'
                    session.save(update_fields=['status'])
                return Response(
                    {
                        'detail': 'All questions have already been answered.',
                        'session': InterviewSessionSerializer(session, context={'request': request}).data,
                    },
                    status=status.HTTP_200_OK,
                )

        # 1. Run AI / Heuristic Fallback Evaluation
        ai_engine = get_ai_service()
        ideal_points = (
            turn.question.ideal_points if turn.question and hasattr(turn.question, 'ideal_points') else []
        )
        sample_answer = (
            turn.question.sample_answer if turn.question and hasattr(turn.question, 'sample_answer') else ''
        )
        difficulty = getattr(turn, 'difficulty', session.difficulty)

        evaluation = ai_engine.evaluate_answer(
            question_text=turn.question_text,
            category=turn.category,
            difficulty=difficulty,
            ideal_points=ideal_points,
            sample_answer=sample_answer,
            candidate_answer=candidate_answer,
            role_target=session.role_target,
        )

        # 2. Persist turn evaluation fields
        turn.candidate_answer = candidate_answer
        turn.time_taken_seconds = int(time_spent_seconds)
        if hasattr(turn, 'time_spent_seconds'):
            turn.time_spent_seconds = int(time_spent_seconds)
        turn.is_answered = True
        turn.submitted_at = timezone.now()
        turn.ai_score = evaluation.get('score', 70)

        feedback_data = {
            'summary': evaluation.get('feedback', ''),
            'strengths': evaluation.get('strengths', []),
            'weaknesses': evaluation.get('weaknesses', []),
            'provider': evaluation.get('provider', 'CareerAI Engine'),
        }
        turn.ai_feedback = json.dumps(feedback_data)
        turn.better_answer = evaluation.get('better_answer', '')
        turn.save()

        # 3. Advance question index and check session completion
        all_turns = session.turns.all()
        answered_turns = all_turns.filter(is_answered=True)
        all_completed = answered_turns.count() >= session.total_questions

        # Compute aggregate overall score
        scores = [t.ai_score for t in answered_turns if t.ai_score is not None]
        session.overall_score = round(sum(scores) / len(scores)) if scores else 0
        session.current_question_index = answered_turns.count()

        if all_completed:
            session.completed_at = timezone.now()
            # Retain in_progress so the frontend can display the evaluation result card for the final turn
            session.status = 'in_progress'
            session.save(update_fields=['current_question_index', 'status', 'overall_score', 'completed_at'])
        else:
            session.status = 'in_progress'
            session.save(update_fields=['current_question_index', 'status', 'overall_score'])

        # 4. Return unified response
        return Response(
            {
                'message': 'Answer submitted and evaluated successfully.',
                'detail': 'Answer submitted and evaluated successfully.',
                'turn_id': turn.id,
                'ai_score': turn.ai_score,
                'feedback': feedback_data,
                'better_answer': turn.better_answer,
                'is_session_completed': all_completed,
                'overall_score': session.overall_score,
                'turn': {
                    'id': turn.id,
                    'turn_number': turn.turn_number,
                    'is_answered': True,
                    'candidate_answer': turn.candidate_answer,
                    'ai_score': turn.ai_score,
                    'ai_feedback': turn.ai_feedback,
                    'better_answer': turn.better_answer,
                },
                'session': InterviewSessionSerializer(session, context={'request': request}).data,
            },
            status=status.HTTP_200_OK,
        )


class CancelInterviewSessionView(APIView):
    """
    Cancels an in-progress interview session.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            session = InterviewSession.objects.get(pk=pk, user=request.user)
        except InterviewSession.DoesNotExist:
            return Response({'detail': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        session.status = 'cancelled'
        session.save(update_fields=['status'])
        return Response({'status': 'cancelled', 'message': 'Interview session ended.'})


class InterviewSessionReportView(APIView):
    """
    GET /api/interviews/sessions/<pk>/report/
    Retrieves the complete post-interview performance diagnostics report.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk=None, session_id=None):
        target_id = pk or session_id or self.kwargs.get('pk')
        
        # 1. Allow owner access or staff/admin access
        queryset = InterviewSession.objects.prefetch_related('turns')
        if not (request.user.is_staff or getattr(request.user, 'role', '') == 'admin'):
            queryset = queryset.filter(user=request.user)

        session = get_object_or_404(queryset, pk=target_id)

        # 2. Recalculate average score and finalize session status safely
        try:
            evaluated_turns = session.turns.filter(ai_score__isnull=False)
            if evaluated_turns.exists():
                avg_score = round(sum(t.ai_score for t in evaluated_turns) / evaluated_turns.count())
                session.overall_score = avg_score
                update_fields = ['overall_score', 'status']

                if session.status != 'completed':
                    session.status = 'completed'

                if hasattr(session, 'completed_at'):
                    session.completed_at = session.completed_at or timezone.now()
                    update_fields.append('completed_at')

                session.save(update_fields=update_fields)
        except Exception as e:
            # Fallback if specific update fields do not exist in schema
            session.save()

        # 3. Serialize and return report
        serializer = InterviewReportSerializer(session, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)