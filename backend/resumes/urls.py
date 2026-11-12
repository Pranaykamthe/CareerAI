from django.urls import path
from .views import (
    ResumeListCreateView,
    ResumeDetailView,
    ResumeParseView,
    ResumeAnalyzeView,
    SetPrimaryResumeView,
    DownloadResumeView,
    ResumeDraftListCreateView,
    ResumeDraftDetailView,
    ResumeAIImproveSectionView,
    ResumeAutoFixATSView,
    ResumeExportDocxView,
)

urlpatterns = [
    path('', ResumeListCreateView.as_view(), name='resume-list-create'),
    path('<int:pk>/', ResumeDetailView.as_view(), name='resume-detail'),
    path('<int:pk>/parse/', ResumeParseView.as_view(), name='resume-parse'),
    path('<int:pk>/analyze/', ResumeAnalyzeView.as_view(), name='resume-analyze'),
    path('<int:pk>/set-primary/', SetPrimaryResumeView.as_view(), name='resume-set-primary'),
    path('<int:pk>/download/', DownloadResumeView.as_view(), name='resume-download'),

    # Phase 19: AI Resume Builder & Groq ATS Improvement Endpoints
    path('builder/', ResumeDraftListCreateView.as_view(), name='resume-builder-list'),
    path('builder/<int:pk>/', ResumeDraftDetailView.as_view(), name='resume-builder-detail'),
    path('builder/ai-improve/', ResumeAIImproveSectionView.as_view(), name='resume-ai-improve'),
    path('builder/auto-fix-ats/', ResumeAutoFixATSView.as_view(), name='resume-auto-fix-ats'),
    path('builder/export-docx/', ResumeExportDocxView.as_view(), name='resume-export-docx'),
]