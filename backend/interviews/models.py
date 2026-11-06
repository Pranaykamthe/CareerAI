from django.db import models
from django.conf import settings
from django.utils import timezone


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


class InterviewSession(models.Model):
    STATUS_CHOICES = (
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    CATEGORY_CHOICES = (
        ('Mixed', 'Comprehensive Mixed (Technical + HR + Behavioral)'),
        ('Technical', 'Technical & Coding Architecture'),
        ('HR', 'HR & Culture Fit'),
        ('Behavioral', 'Behavioral (STAR Method)'),
        ('Project-based', 'Project Deep Dive'),
    )

    DIFFICULTY_CHOICES = (
        ('Easy', 'Easy (Entry Level)'),
        ('Medium', 'Medium (Mid Level)'),
        ('Hard', 'Hard (Senior / Lead)'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='interview_sessions'
    )
    role_target = models.CharField(max_length=150, default='Python / Django Developer')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Mixed')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='Medium')
    total_questions = models.PositiveIntegerField(default=3)
    current_question_index = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    overall_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Session #{self.id} - {self.role_target} ({self.status})"

    def complete_session(self):
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at'])


class InterviewTurn(models.Model):
    session = models.ForeignKey(
        InterviewSession,
        on_delete=models.CASCADE,
        related_name='turns'
    )
    question = models.ForeignKey(
        QuestionBank,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='turns'
    )
    turn_number = models.PositiveIntegerField()
    question_text = models.TextField()
    category = models.CharField(max_length=50, default='Technical')
    candidate_answer = models.TextField(blank=True, default='')
    is_answered = models.BooleanField(default=False)
    time_taken_seconds = models.PositiveIntegerField(default=0)
    submitted_at = models.DateTimeField(null=True, blank=True)

    # Placeholders populated in Phase 12 evaluation
    ai_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    ai_feedback = models.TextField(blank=True, default='')
    better_answer = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['session', 'turn_number']
        unique_together = ('session', 'turn_number')

    def __str__(self):
        return f"Session #{self.session.id} - Turn #{self.turn_number}"