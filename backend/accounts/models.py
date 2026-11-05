from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

class User(AbstractUser):
    ROLE_CHOICES = (
        ('candidate', 'Candidate'),
        ('admin', 'Administrator'),
    )

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='candidate')
    phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} ({self.role})"


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    headline = models.CharField(max_length=255, blank=True, default='')
    target_role = models.CharField(max_length=150, blank=True, default='')
    bio = models.TextField(blank=True, default='')
    experience_years = models.DecimalField(max_digits=4, decimal_places=1, default=0.0)
    location = models.CharField(max_length=150, blank=True, default='')
    linkedin_url = models.URLField(max_length=300, blank=True, default='')
    github_url = models.URLField(max_length=300, blank=True, default='')
    portfolio_url = models.URLField(max_length=300, blank=True, default='')
    
    # Structured JSON Fields
    skills_list = models.JSONField(default=list, blank=True)
    education = models.JSONField(default=list, blank=True)
    experience = models.JSONField(default=list, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.email}"

    @property
    def completion_percentage(self):
        """
        Calculates profile completeness across 6 core criteria.
        """
        score = 0
        if self.headline.strip():
            score += 15
        if self.target_role.strip():
            score += 15
        if self.bio.strip():
            score += 15
        if self.skills_list and len(self.skills_list) > 0:
            score += 25
        if self.experience and len(self.experience) > 0:
            score += 15
        if self.education and len(self.education) > 0:
            score += 15
        return min(score, 100)


@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
    else:
        if hasattr(instance, 'profile'):
            instance.profile.save()