from django.urls import path
from .views import (
    ResumeListCreateView,
    ResumeDetailView,
    ResumeParseView,
    SetPrimaryResumeView,
    DownloadResumeView,
)

urlpatterns = [
    path('', ResumeListCreateView.as_view(), name='resume-list-create'),
    path('<int:pk>/', ResumeDetailView.as_view(), name='resume-detail'),
    path('<int:pk>/parse/', ResumeParseView.as_view(), name='resume-parse'),
    path('<int:pk>/set-primary/', SetPrimaryResumeView.as_view(), name='resume-set-primary'),
    path('<int:pk>/download/', DownloadResumeView.as_view(), name='resume-download'),
]