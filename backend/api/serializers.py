from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Document, ChatSession, ChatMessage, GuestSession

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ('id', 'filename', 'file_type', 'uploaded_at', 'summary', 'keywords', 'file', 
                  'page_count', 'word_count', 'language', 'reading_time', 'file_size', 'is_guest')
        read_only_fields = ('filename', 'file_type', 'summary', 'keywords', 
                            'page_count', 'word_count', 'language', 'reading_time', 'file_size', 'is_guest')

class DocumentDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ('id', 'filename', 'file_type', 'uploaded_at', 'content', 'summary', 'keywords', 'file',
                  'page_count', 'word_count', 'language', 'reading_time', 'file_size', 'is_guest')

class ChatSessionSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = ('id', 'document', 'title', 'created_at', 'updated_at', 'message_count')
        read_only_fields = ('document', 'created_at', 'updated_at')

    def get_message_count(self, obj):
        return obj.messages.count()

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ('id', 'sender', 'message', 'timestamp', 'source_page', 'source_paragraph', 'source_text')
