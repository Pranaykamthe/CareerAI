import os
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

def validate_resume_file(file):
    valid_extensions = ['.pdf', '.docx']
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in valid_extensions:
        raise ValidationError("Unsupported file format. Only PDF and DOCX files are allowed.")
    
    max_size_bytes = 10 * 1024 * 1024  # 10 MB limit
    if file.size > max_size_bytes:
        raise ValidationError("File size exceeds 10MB limit.")

def resume_upload_path(instance, filename):
    return f"resumes/user_{instance.user.id}/{filename}"

class Resume(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='resumes')
    file = models.FileField(upload_to=resume_upload_path, validators=[validate_resume_file])
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(help_text="File size in bytes")
    file_type = models.CharField(max_length=10, help_text="pdf or docx")
    raw_text = models.TextField(blank=True, default='')
    parsed_data = models.JSONField(default=dict, blank=True)
    is_parsed = models.BooleanField(default=False)
    is_primary = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.file_name} ({self.user.email})"

    def save(self, *args, **kwargs):
        if not self.pk and not Resume.objects.filter(user=self.user).exists():
            self.is_primary = True
        elif self.is_primary:
            Resume.objects.filter(user=self.user, is_primary=True).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.file and os.path.isfile(self.file.path):
            try:
                os.remove(self.file.path)
            except OSError:
                pass
        super().delete(*args, **kwargs)


class ResumeAnalysis(models.Model):
    resume = models.OneToOneField(Resume, on_delete=models.CASCADE, related_name='analysis')
    overall_score = models.IntegerField(default=0)  # 0 to 100
    
    # Sub-scores breakdown
    ats_compatibility_score = models.IntegerField(default=0)  # 0 to 100
    keyword_score = models.IntegerField(default=0)            # 0 to 100
    content_quality_score = models.IntegerField(default=0)    # 0 to 100
    measurable_impact_score = models.IntegerField(default=0)  # 0 to 100
    formatting_score = models.IntegerField(default=0)         # 0 to 100

    # Structured feedback items
    strengths = models.JSONField(default=list, blank=True)
    weaknesses = models.JSONField(default=list, blank=True)
    recommendations = models.JSONField(default=list, blank=True)
    metrics_summary = models.JSONField(default=dict, blank=True)

    analyzed_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Analysis of {self.resume.file_name} - Score: {self.overall_score}/100"