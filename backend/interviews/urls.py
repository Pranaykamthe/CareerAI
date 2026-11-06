from django.urls import path
from .views import (
    QuestionBankListView,
    QuestionDetailView,
    ToggleBookmarkView,
    SeedQuestionsView,
    StartInterviewSessionView,
    InterviewSessionListView,
    InterviewSessionDetailView,
    SubmitAnswerView,
    CancelInterviewSessionView,
)

urlpatterns = [
    # Catalog & Questions
    path('questions/', QuestionBankListView.as_view(), name='question-bank-list'),
    path('questions/<int:pk>/', QuestionDetailView.as_view(), name='question-detail'),
    path('questions/<int:pk>/bookmark/', ToggleBookmarkView.as_view(), name='question-toggle-bookmark'),
    path('questions/seed/', SeedQuestionsView.as_view(), name='question-seed'),

    # Phase 11 Mock Interview Sessions
    path('sessions/', InterviewSessionListView.as_view(), name='interview-session-list'),
    path('sessions/start/', StartInterviewSessionView.as_view(), name='interview-session-start'),
    path('sessions/<int:pk>/', InterviewSessionDetailView.as_view(), name='interview-session-detail'),
    path('sessions/<int:pk>/submit-answer/', SubmitAnswerView.as_view(), name='interview-submit-answer'),
    path('sessions/<int:pk>/cancel/', CancelInterviewSessionView.as_view(), name='interview-session-cancel'),
]