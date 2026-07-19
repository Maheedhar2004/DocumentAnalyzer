from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    # Auth
    RegisterView,
    LoginView,
    UserProfileView,
    PasswordResetRequestView,
    # Documents
    DocumentViewSet,
    # Chat sessions
    ChatSessionListCreateView,
    ChatSessionDetailView,
    ChatMessageListCreateView,
    # Utilities
    TranslateView,
    DownloadSummaryView,
    CompareDocumentsView,
)

router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')

urlpatterns = [
    # ── Auth endpoints ──────────────────────────────
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', LoginView.as_view(), name='auth_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('auth/me/', UserProfileView.as_view(), name='auth_me'),
    path('auth/password-reset/', PasswordResetRequestView.as_view(), name='auth_password_reset'),

    # ── Document comparison ─────────────────────────
    path('documents/compare/', CompareDocumentsView.as_view(), name='documents_compare'),

    # ── Document nested views ───────────────────────
    path('documents/<int:doc_id>/chats/', ChatSessionListCreateView.as_view(), name='document_chats'),
    path('documents/<int:doc_id>/translate/', TranslateView.as_view(), name='document_translate'),
    path('documents/<int:doc_id>/download-summary/', DownloadSummaryView.as_view(), name='document_download_summary'),

    # ── Chat session detail (rename / delete) ───────
    path('chats/<int:session_id>/', ChatSessionDetailView.as_view(), name='chat_session_detail'),

    # ── Chat messages ───────────────────────────────
    path('chats/<int:session_id>/messages/', ChatMessageListCreateView.as_view(), name='chat_messages'),

    # ── Router (documents CRUD) ─────────────────────
    path('', include(router.urls)),
]
