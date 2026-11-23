from django.urls import path
from .views import (
    ResumeListCreateView,
    ResumeDetailView,
    ResumeParseView,
    ResumeAnalyzeView,
    SetPrimaryResumeView,
    DownloadResumeView,
    ResumeAutofillProfileView,
    ResumeDraftListCreateView,
    ResumeDraftDetailView,
    ResumeAIImproveSectionView,
    ResumeAutoFixATSView,
    GenerateCoverLetterView,
    ExportCoverLetterDocxView,
    ResumeExportDocxView,
)

urlpatterns = [
    # Core Resume Management & ATS Analysis
    path('', ResumeListCreateView.as_view(), name='resume-list-create'),
    path('<int:pk>/', ResumeDetailView.as_view(), name='resume-detail'),
    path('<int:pk>/parse/', ResumeParseView.as_view(), name='resume-parse'),
    path('<int:pk>/analyze/', ResumeAnalyzeView.as_view(), name='resume-analyze'),
    path('<int:pk>/set-primary/', SetPrimaryResumeView.as_view(), name='resume-set-primary'),
    path('<int:pk>/download/', DownloadResumeView.as_view(), name='resume-download'),

    # Groq AI Resume-to-Profile Auto-Fill
    path('autofill-profile/', ResumeAutofillProfileView.as_view(), name='resume-autofill-profile'),

    # AI Resume Builder, Groq ATS Improvements & Cover Letter Generator
    path('builder/', ResumeDraftListCreateView.as_view(), name='resume-builder-list'),
    path('builder/<int:pk>/', ResumeDraftDetailView.as_view(), name='resume-builder-detail'),
    path('builder/ai-improve/', ResumeAIImproveSectionView.as_view(), name='resume-ai-improve'),
    path('builder/auto-fix-ats/', ResumeAutoFixATSView.as_view(), name='resume-auto-fix-ats'),
    path('builder/export-docx/', ResumeExportDocxView.as_view(), name='resume-export-docx'),
    path('cover-letter/', GenerateCoverLetterView.as_view(), name='generate-cover-letter'),
    path('cover-letter/export-docx/', ExportCoverLetterDocxView.as_view(), name='export-cover-letter-docx'),
]