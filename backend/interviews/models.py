from django.db import models
from django.conf import settings

class QuestionBank(models.Model):
    CATEGORY_CHOICES = (
        ('Technical', 'Technical'),
        ('HR', 'HR & Culture'),
        ('Behavioral', 'Behavioral (STAR)'),
        ('Project-based', 'Project Architecture & Deep Dive'),
    )

    DIFFICULTY_CHOICES = (
        ('Easy', 'Easy'),
        ('Medium', 'Medium'),
        ('Hard', 'Hard'),
    )

    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Technical')
    role_target = models.CharField(max_length=150, default='General Software Engineer')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='Medium')
    question_text = models.TextField()
    ideal_points = models.JSONField(
        default=list,
        help_text="Core key concepts and talking points interviewers look for"
    )
    sample_answer = models.TextField(
        blank=True,
        default='',
        help_text="Structured model answer demonstrating best practices"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['category', 'difficulty', 'id']

    def __str__(self):
        return f"[{self.category} - {self.difficulty}] {self.question_text[:60]}..."


class QuestionBookmark(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='question_bookmarks'
    )
    question = models.ForeignKey(
        QuestionBank,
        on_delete=models.CASCADE,
        related_name='bookmarked_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('user', 'question')

    def __str__(self):
        return f"{self.user.email} bookmarked question #{self.question.id}"