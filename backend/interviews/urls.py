from django.urls import path
from .views import (
    QuestionBankListView,
    QuestionDetailView,
    ToggleBookmarkView,
    SeedQuestionsView,
)

urlpatterns = [
    path('questions/', QuestionBankListView.as_view(), name='question-bank-list'),
    path('questions/<int:pk>/', QuestionDetailView.as_view(), name='question-detail'),
    path('questions/<int:pk>/bookmark/', ToggleBookmarkView.as_view(), name='question-toggle-bookmark'),
    path('questions/seed/', SeedQuestionsView.as_view(), name='question-seed'),
]