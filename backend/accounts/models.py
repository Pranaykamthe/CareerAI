import os
import uuid
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


def validate_profile_photo(file):
    valid_extensions = ['.jpg', '.jpeg', '.png', '.webp']
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in valid_extensions:
        raise ValidationError("Unsupported image format. Allowed formats: JPG, JPEG, PNG, WEBP.")

    max_size_bytes = 5 * 1024 * 1024  # 5 MB limit
    if file.size > max_size_bytes:
        raise ValidationError("Profile photo size cannot exceed 5MB.")


def profile_photo_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1].lower()
    unique_id = uuid.uuid4().hex[:8]
    return f"profile_photos/user_{instance.user.id}/avatar_{unique_id}{ext}"


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
    profile_photo = models.ImageField(
        upload_to=profile_photo_upload_path,
        validators=[validate_profile_photo],
        blank=True,
        null=True,
    )
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

    def save(self, *args, **kwargs):
        # Clean up previous photo from disk when replacing or clearing it
        if self.pk:
            try:
                old_instance = Profile.objects.get(pk=self.pk)
                if (
                    old_instance.profile_photo
                    and old_instance.profile_photo != self.profile_photo
                    and os.path.isfile(old_instance.profile_photo.path)
                ):
                    os.remove(old_instance.profile_photo.path)
            except (Profile.DoesNotExist, ValueError, OSError):
                pass
        super().save(*args, **kwargs)

    @property
    def completion_percentage(self):
        """
        Calculates profile completeness across core criteria.
        """
        score = 0
        if self.profile_photo:
            score += 5
        if self.headline.strip():
            score += 15
        if self.target_role.strip():
            score += 15
        if self.bio.strip():
            score += 15
        if self.skills_list and len(self.skills_list) > 0:
            score += 20
        if self.experience and len(self.experience) > 0:
            score += 15
        if self.education and len(self.education) > 0:
            score += 15
        return min(score, 100)


@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)