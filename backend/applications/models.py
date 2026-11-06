from django.db import models
from django.conf import settings
from jobs.models import Job

class JobApplication(models.Model):
    STATUS_CHOICES = (
        ('Saved', 'Saved'),
        ('Applied', 'Applied'),
        ('Screening', 'Screening'),
        ('Interview', 'Interview'),
        ('Offer', 'Offer'),
        ('Rejected', 'Rejected'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='Saved'
    )
    notes = models.TextField(blank=True, default='')
    applied_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        unique_together = ('user', 'job')

    def __str__(self):
        return f"{self.user.email} - {self.job.title} ({self.status})"