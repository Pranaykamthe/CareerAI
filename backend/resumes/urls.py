from django.urls import path
from .views import (
    ResumeListCreateView,
    ResumeDetailDeleteView,
    SetPrimaryResumeView,
    DownloadResumeView,
)

urlpatterns = [
    path('', ResumeListCreateView.as_view(), name='resume-list-create'),
    path('<int:pk>/', ResumeDetailDeleteView.as_view(), name='resume-detail-delete'),
    path('<int:pk>/set-primary/', SetPrimaryResumeView.as_view(), name='resume-set-primary'),
    path('<int:pk>/download/', DownloadResumeView.as_view(), name='resume-download'),
]