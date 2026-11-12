from django.urls import path
from .views import (
    # Question Bank & Bookmarks
    QuestionBankListView,
    QuestionDetailView,
    ToggleBookmarkView,
    SeedQuestionsView,
    # Interview Runtime Lifecycle
    StartInterviewSessionView,
    InterviewSessionListView,
    InterviewSessionDetailView,
    SubmitAnswerView,
    CancelInterviewSessionView,
    # Phase 14: Diagnostic Report
    InterviewSessionReportView,
    # Phase 15: History, Trends & Archiving
    InterviewHistoryListView,
    InterviewHistoryStatsView,
    InterviewSessionDeleteView,
)

urlpatterns = [
    # Catalog & Question Bank
    path('questions/', QuestionBankListView.as_view(), name='question-bank-list'),
    path('questions/<int:pk>/', QuestionDetailView.as_view(), name='question-detail'),
    path('questions/<int:pk>/bookmark/', ToggleBookmarkView.as_view(), name='question-toggle-bookmark'),
    path('questions/seed/', SeedQuestionsView.as_view(), name='question-seed'),

    # Mock Interview Sessions & Progression
    path('sessions/', InterviewSessionListView.as_view(), name='interview-session-list'),
    path('sessions/start/', StartInterviewSessionView.as_view(), name='interview-session-start'),
    path('sessions/<int:pk>/', InterviewSessionDetailView.as_view(), name='interview-session-detail'),
    path('sessions/<int:pk>/submit-answer/', SubmitAnswerView.as_view(), name='interview-submit-answer'),
    path('sessions/<int:pk>/cancel/', CancelInterviewSessionView.as_view(), name='interview-session-cancel'),

    # Phase 14: Post-Interview Diagnostic Performance Report
    path('sessions/<int:pk>/report/', InterviewSessionReportView.as_view(), name='interview-session-report'),

    # Phase 15: Interview History, Performance Trends & Deletion
    path('history/', InterviewHistoryListView.as_view(), name='interview-history-list'),
    path('history/stats/', InterviewHistoryStatsView.as_view(), name='interview-history-stats'),
    path('sessions/<int:pk>/delete/', InterviewSessionDeleteView.as_view(), name='interview-session-delete'),
]