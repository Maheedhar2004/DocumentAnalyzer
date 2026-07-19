from django.db import models
from django.contrib.auth.models import User

class Document(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents', null=True, blank=True)
    file = models.FileField(upload_to='documents/')
    filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=10)  # 'pdf', 'docx', 'txt'
    uploaded_at = models.DateTimeField(auto_now_add=True)
    content = models.TextField(blank=True, default='')
    summary = models.TextField(blank=True, default='')
    keywords = models.JSONField(blank=True, default=list)
    page_count = models.IntegerField(default=1)
    word_count = models.IntegerField(default=0)
    language = models.CharField(max_length=50, default='English')
    reading_time = models.IntegerField(default=0)  # in minutes
    file_size = models.BigIntegerField(default=0)  # in bytes
    is_guest = models.BooleanField(default=False)  # True for anonymous uploads
    guest_session_key = models.CharField(max_length=64, blank=True, default='')  # link to guest session

    def __str__(self):
        owner = self.user.username if self.user else 'guest'
        return f"{self.filename} ({owner})"

class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_sessions', null=True, blank=True)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chat_sessions')
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        owner = self.user.username if self.user else 'guest'
        return f"{self.title} - {owner}"

class ChatMessage(models.Model):
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=[('user', 'User'), ('ai', 'AI')])
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    # Source reference fields (populated for AI messages)
    source_page = models.IntegerField(null=True, blank=True)
    source_paragraph = models.IntegerField(null=True, blank=True)
    source_text = models.TextField(blank=True, default='')  # brief excerpt from source

    def __str__(self):
        return f"{self.sender}: {self.message[:30]}..."

class GuestSession(models.Model):
    """Tracks anonymous usage for rate-limiting guest users."""
    session_key = models.CharField(max_length=64, unique=True)
    document = models.ForeignKey(Document, on_delete=models.SET_NULL, null=True, blank=True)
    message_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)

    GUEST_MESSAGE_LIMIT = 5

    def has_reached_limit(self):
        return self.message_count >= self.GUEST_MESSAGE_LIMIT

    def __str__(self):
        return f"GuestSession({self.session_key[:8]}...) - {self.message_count} messages"
