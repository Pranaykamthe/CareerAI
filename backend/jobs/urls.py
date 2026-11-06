from django.urls import path
from .views import (
    JobListCreateView,
    JobDetailView,
    JobMatchDetailView,
    JobBatchMatchView,
    JobParseTextView,
    JobSeedDefaultsView,
)

urlpatterns = [
    path('', JobListCreateView.as_view(), name='job-list-create'),
    path('matches/', JobBatchMatchView.as_view(), name='job-batch-matches'),
    path('<int:pk>/', JobDetailView.as_view(), name='job-detail'),
    path('<int:pk>/match/', JobMatchDetailView.as_view(), name='job-single-match'),
    path('parse-text/', JobParseTextView.as_view(), name='job-parse-text'),
    path('seed-defaults/', JobSeedDefaultsView.as_view(), name='job-seed-defaults'),
]