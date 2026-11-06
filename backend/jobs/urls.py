from django.urls import path
from .views import (
    JobListCreateView,
    JobDetailView,
    JobParseTextView,
    JobSeedDefaultsView,
)

urlpatterns = [
    path('', JobListCreateView.as_view(), name='job-list-create'),
    path('<int:pk>/', JobDetailView.as_view(), name='job-detail'),
    path('parse-text/', JobParseTextView.as_view(), name='job-parse-text'),
    path('seed-defaults/', JobSeedDefaultsView.as_view(), name='job-seed-defaults'),
]