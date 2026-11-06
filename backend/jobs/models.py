from django.db import models
from django.conf import settings

class Job(models.Model):
    JOB_TYPE_CHOICES = (
        ('Full-time', 'Full-time'),
        ('Part-time', 'Part-time'),
        ('Contract', 'Contract'),
        ('Internship', 'Internship'),
        ('Remote', 'Remote'),
    )

    EXPERIENCE_LEVEL_CHOICES = (
        ('Entry Level', 'Entry Level (0-2 yrs)'),
        ('Mid Level', 'Mid Level (2-5 yrs)'),
        ('Senior Level', 'Senior Level (5-8 yrs)'),
        ('Expert Level', 'Expert Level (8+ yrs)'),
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_jobs'
    )
    title = models.CharField(max_length=200)
    company = models.CharField(max_length=200)
    location = models.CharField(max_length=200, default='Remote')
    job_type = models.CharField(max_length=50, choices=JOB_TYPE_CHOICES, default='Full-time')
    experience_level = models.CharField(max_length=50, choices=EXPERIENCE_LEVEL_CHOICES, default='Mid Level')
    min_experience_years = models.PositiveIntegerField(default=1)
    salary_range = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField()
    required_skills = models.JSONField(default=list, help_text="List of required technical skills")
    preferred_skills = models.JSONField(default=list, blank=True, help_text="List of preferred nice-to-have skills")
    responsibilities = models.JSONField(default=list, blank=True, help_text="Bullet points of key duties")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} at {self.company}"


class JobMatch(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='job_matches'
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='candidate_matches'
    )
    resume = models.ForeignKey(
        'resumes.Resume',
        on_delete=models.CASCADE,
        related_name='job_matches'
    )
    match_score = models.PositiveIntegerField(default=0, help_text="Weighted compatibility score 0-100")
    skill_score = models.PositiveIntegerField(default=0, help_text="Skill overlap score 0-100")
    experience_score = models.PositiveIntegerField(default=0, help_text="Experience alignment score 0-100")
    keyword_score = models.PositiveIntegerField(default=0, help_text="Keyword overlap score 0-100")
    
    matched_skills = models.JSONField(default=list, blank=True)
    missing_skills = models.JSONField(default=list, blank=True)
    preferred_matched_skills = models.JSONField(default=list, blank=True)
    match_level = models.CharField(max_length=50, default='Moderate Match')
    summary = models.TextField(blank=True, default='')
    
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-match_score', '-updated_at']
        unique_together = ('user', 'job', 'resume')

    def __str__(self):
        return f"{self.user.email} - {self.job.title} ({self.match_score}%)"