import os
import secrets
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Document, ChatSession, ChatMessage, GuestSession
from .serializers import (
    UserSerializer,
    DocumentSerializer, 
    DocumentDetailSerializer,
    ChatSessionSerializer, 
    ChatMessageSerializer
)
from .utils import (
    extract_text_from_file, 
    generate_summary_and_keywords, 
    chat_with_document, 
    translate_text,
    generate_comparison_report
)

GUEST_MESSAGE_LIMIT = 5

# ─────────────────────────────────────────────
#  Auth helpers
# ─────────────────────────────────────────────

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def get_current_user(request):
    """Returns (user, is_guest, guest_session) based on JWT or guest cookie."""
    if request.user and request.user.is_authenticated:
        return request.user, False, None

    # Guest flow: read/create a guest session from header/cookie
    guest_key = request.headers.get('X-Guest-Session') or request.COOKIES.get('guest_session_key')
    if guest_key:
        session, _ = GuestSession.objects.get_or_create(session_key=guest_key)
        return None, True, session

    return None, True, None


# ─────────────────────────────────────────────
#  Auth Views
# ─────────────────────────────────────────────

class RegisterView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = get_tokens_for_user(user)
            return Response({
                'user': {'id': user.id, 'username': user.username, 'email': user.email},
                **tokens
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')
        
        if not username or not password:
            return Response({'detail': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)
        if not user:
            return Response({'detail': 'Invalid credentials. Please check your username and password.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'detail': 'This account is inactive.'}, status=status.HTTP_403_FORBIDDEN)

        tokens = get_tokens_for_user(user)
        return Response({
            'user': {'id': user.id, 'username': user.username, 'email': user.email},
            **tokens
        })


class UserProfileView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        user = request.user
        return Response({'id': user.id, 'username': user.username, 'email': user.email})


class PasswordResetRequestView(APIView):
    """
    In production this would send an email. For now it returns a mock reset token
    that is printed to the console.
    """
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            # Generate a simple reset token (in production use django.contrib.auth.tokens)
            token = secrets.token_urlsafe(32)
            print(f"\n[PASSWORD RESET] User: {user.username} | Token: {token}\n")
            # In production: send_password_reset_email(user, token)
        except User.DoesNotExist:
            pass  # Don't reveal if email exists

        return Response({'detail': 'If that email is registered, a reset link has been sent.'})


# ─────────────────────────────────────────────
#  Document Views
# ─────────────────────────────────────────────

class DocumentViewSet(viewsets.ModelViewSet):
    permission_classes = (AllowAny,)
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        user, is_guest, guest_session = get_current_user(self.request)
        if user:
            return Document.objects.filter(user=user).order_by('-uploaded_at')
        elif guest_session:
            # Return ALL docs belonging to this guest session (multiple uploads allowed)
            return Document.objects.filter(
                guest_session_key=guest_session.session_key
            ).order_by('-uploaded_at')
        return Document.objects.none()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DocumentDetailSerializer
        return DocumentSerializer

    def perform_create(self, serializer):
        uploaded_file = self.request.FILES.get('file')
        filename = uploaded_file.name
        file_size = uploaded_file.size
        
        ext = os.path.splitext(filename)[1].lower().replace('.', '')
        if not ext:
            ext = 'txt'

        user, is_guest, guest_session = get_current_user(self.request)

        # Create a new guest session if guest has no session key yet
        if is_guest and not guest_session:
            guest_key = secrets.token_hex(32)
            guest_session = GuestSession.objects.create(session_key=guest_key)

        # Store on self so create() can read it for the response
        self._guest_session_for_response = guest_session

        # Save document to DB
        instance = serializer.save(
            user=user,
            filename=filename,
            file_type=ext,
            file_size=file_size,
            is_guest=is_guest,
            guest_session_key=guest_session.session_key if guest_session else ''
        )
        
        # Parse content
        file_path = instance.file.path
        parsed_content = extract_text_from_file(file_path, ext)
        instance.content = parsed_content
        
        word_count = len(parsed_content.split())
        instance.word_count = word_count
        
        page_count = 1
        if ext == 'pdf':
            try:
                from pypdf import PdfReader
                reader = PdfReader(file_path)
                page_count = len(reader.pages)
            except Exception:
                page_count = 1
        else:
            page_count = max(1, word_count // 500)
        instance.page_count = page_count
        instance.reading_time = max(1, word_count // 200)
        
        summary, keywords, language = generate_summary_and_keywords(parsed_content)
        instance.summary = summary
        instance.keywords = keywords
        instance.language = language
        
        instance.save()

    def create(self, request, *args, **kwargs):
        """Override to attach guest_session_key to the response.
        Uses _guest_session_for_response set by perform_create to avoid
        a second get_current_user() call that wouldn't find the new session.
        """
        self._guest_session_for_response = None
        response = super().create(request, *args, **kwargs)
        gs = getattr(self, '_guest_session_for_response', None)
        if gs:
            response.data['guest_session_key'] = gs.session_key
        return response


# ─────────────────────────────────────────────
#  Chat Session Views
# ─────────────────────────────────────────────

class ChatSessionListCreateView(generics.ListCreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = ChatSessionSerializer

    def get_queryset(self):
        doc_id = self.kwargs.get('doc_id')
        user, is_guest, guest_session = get_current_user(self.request)
        if user:
            return ChatSession.objects.filter(document_id=doc_id, user=user).order_by('-updated_at')
        elif guest_session:
            # Allow guest to access chat sessions for any of their uploaded docs
            guest_doc_exists = Document.objects.filter(
                id=doc_id,
                guest_session_key=guest_session.session_key
            ).exists()
            if guest_doc_exists:
                return ChatSession.objects.filter(
                    document_id=doc_id,
                    user=None
                ).order_by('-updated_at')
        return ChatSession.objects.none()

    def perform_create(self, serializer):
        doc_id = self.kwargs.get('doc_id')
        user, is_guest, guest_session = get_current_user(self.request)

        if user:
            document = get_object_or_404(Document, id=doc_id, user=user)
            title = self.request.data.get('title', f"Chat about {document.filename}")
            serializer.save(user=user, document=document, title=title)
        elif guest_session:
            # Support any guest-owned document (not just the first)
            document = get_object_or_404(
                Document, id=doc_id, guest_session_key=guest_session.session_key
            )
            title = self.request.data.get('title', f"Chat about {document.filename}")
            serializer.save(user=None, document=document, title=title)


class ChatSessionDetailView(APIView):
    """Rename or Delete a chat session."""
    permission_classes = (AllowAny,)

    def _get_session(self, request, session_id):
        user, is_guest, guest_session = get_current_user(request)
        if user:
            return get_object_or_404(ChatSession, id=session_id, user=user)
        return get_object_or_404(ChatSession, id=session_id, user=None)

    def patch(self, request, session_id):
        """Rename a session."""
        session = self._get_session(request, session_id)
        new_title = request.data.get('title', '').strip()
        if not new_title:
            return Response({'detail': 'Title cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
        session.title = new_title
        session.save()
        return Response(ChatSessionSerializer(session).data)

    def delete(self, request, session_id):
        """Delete a session and all its messages."""
        session = self._get_session(request, session_id)
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────
#  Chat Message Views
# ─────────────────────────────────────────────

class ChatMessageListCreateView(APIView):
    permission_classes = (AllowAny,)

    def _get_session_and_guest(self, request, session_id):
        user, is_guest, guest_session = get_current_user(request)
        if user:
            session = get_object_or_404(ChatSession, id=session_id, user=user)
        else:
            session = get_object_or_404(ChatSession, id=session_id, user=None)
        return session, is_guest, guest_session

    def get(self, request, session_id):
        session, _, _ = self._get_session_and_guest(request, session_id)
        messages = session.messages.all().order_by('timestamp')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, session_id):
        session, is_guest, guest_session = self._get_session_and_guest(request, session_id)
        
        # Enforce guest message limit
        if is_guest and guest_session:
            if guest_session.has_reached_limit():
                return Response({
                    'error': 'guest_limit_reached',
                    'detail': f'Guest users are limited to {GUEST_MESSAGE_LIMIT} AI chat messages. Please create an account to continue.',
                    'limit': GUEST_MESSAGE_LIMIT,
                }, status=status.HTTP_403_FORBIDDEN)

        user_message_text = request.data.get('message')
        if not user_message_text:
            return Response({'error': 'Message content is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Save user message
        user_message = ChatMessage.objects.create(
            session=session,
            sender='user',
            message=user_message_text
        )
        
        # Build chat history context
        previous_messages_qs = session.messages.exclude(id=user_message.id).order_by('timestamp')
        chat_history = [
            {"sender": msg.sender, "message": msg.message} 
            for msg in previous_messages_qs
        ]
        
        # Call AI — returns dict with answer + source references
        result = chat_with_document(
            document_content=session.document.content,
            chat_history=chat_history,
            new_message=user_message_text
        )
        
        # Save AI message with source references
        ai_message = ChatMessage.objects.create(
            session=session,
            sender='ai',
            message=result['answer'],
            source_page=result.get('source_page'),
            source_paragraph=result.get('source_paragraph'),
            source_text=result.get('source_text', '')
        )

        # Update session timestamp
        session.save()  # triggers auto_now on updated_at

        # Increment guest message counter
        if is_guest and guest_session:
            guest_session.message_count += 1
            guest_session.save()

        return Response({
            "user_message": ChatMessageSerializer(user_message).data,
            "ai_message": ChatMessageSerializer(ai_message).data,
            "guest_messages_remaining": (
                max(0, GUEST_MESSAGE_LIMIT - guest_session.message_count)
                if is_guest and guest_session else None
            )
        }, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────
#  Translate / Download / Compare
# ─────────────────────────────────────────────

class TranslateView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, doc_id):
        user, is_guest, guest_session = get_current_user(request)
        
        if is_guest:
            return Response({
                'error': 'auth_required',
                'detail': 'Translation is available for registered users only. Please create an account.'
            }, status=status.HTTP_403_FORBIDDEN)

        document = get_object_or_404(Document, id=doc_id, user=user)
        target_lang = request.data.get('target_language')
        translate_type = request.data.get('type', 'summary')
        
        if not target_lang:
            return Response({"error": "Target language is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        text_to_translate = document.summary if translate_type == 'summary' else document.content
        
        if not text_to_translate:
            return Response({"error": f"No {translate_type} content available to translate"}, status=status.HTTP_400_BAD_REQUEST)
            
        translated = translate_text(text_to_translate, target_lang)
        return Response({
            "original_text": text_to_translate[:1000],
            "translated_text": translated,
            "target_language": target_lang
        })


class DownloadSummaryView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request, doc_id):
        user, is_guest, guest_session = get_current_user(request)
        
        if is_guest:
            return Response({
                'error': 'auth_required',
                'detail': 'Download reports is available for registered users only. Please create an account.'
            }, status=status.HTTP_403_FORBIDDEN)

        document = get_object_or_404(Document, id=doc_id, user=user)
        
        summary_content = (
            f"DOCUMENT SUMMARY: {document.filename}\n"
            f"Uploaded At: {document.uploaded_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
            f"Keywords: {', '.join(document.keywords)}\n"
            f"{'='*60}\n\n"
            f"{document.summary}\n"
        )
        
        response = HttpResponse(summary_content, content_type='text/plain')
        response['Content-Disposition'] = f'attachment; filename="{document.filename}_summary.txt"'
        return response


class CompareDocumentsView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        doc1_id = request.data.get('doc1_id')
        doc2_id = request.data.get('doc2_id')
        
        if not doc1_id or not doc2_id:
            return Response({"error": "Both doc1_id and doc2_id are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        user, is_guest, guest_session = get_current_user(request)
        
        if user:
            doc1 = get_object_or_404(Document, id=doc1_id, user=user)
            doc2 = get_object_or_404(Document, id=doc2_id, user=user)
        elif is_guest and guest_session:
            # Guests can compare their own uploaded documents
            doc1 = get_object_or_404(Document, id=doc1_id, guest_session_key=guest_session.session_key)
            doc2 = get_object_or_404(Document, id=doc2_id, guest_session_key=guest_session.session_key)
        else:
            return Response({"error": "Authentication required"}, status=status.HTTP_403_FORBIDDEN)
        
        report = generate_comparison_report(
            doc1_content=doc1.content,
            doc1_name=doc1.filename,
            doc2_content=doc2.content,
            doc2_name=doc2.filename
        )
        
        return Response(report, status=status.HTTP_200_OK)
