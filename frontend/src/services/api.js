import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

// ─────────────────────────────────────────────
//  Request interceptor — attach JWT & guest key
// ─────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const guestKey = localStorage.getItem('guest_session_key');
  if (guestKey && !token) {
    config.headers['X-Guest-Session'] = guestKey;
  }
  return config;
});

// ─────────────────────────────────────────────
//  Response interceptor — auto refresh on 401
// ─────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh/`, { refresh: refreshToken });
          const newAccess = res.data.access;
          localStorage.setItem('access_token', newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch {
          // Refresh failed — clear tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────
//  Auth Service
// ─────────────────────────────────────────────
export const authService = {
  register: async (username, email, password) => {
    const response = await api.post('/auth/register/', { username, email, password });
    const { user, access, refresh } = response.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  login: async (username, password) => {
    const response = await api.post('/auth/login/', { username, password });
    const { user, access, refresh } = response.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    // Keep guest_session_key so guest state persists on the same browser
  },

  getCurrentUser: () => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  requestPasswordReset: async (email) => {
    const response = await api.post('/auth/password-reset/', { email });
    return response.data;
  },
};

// ─────────────────────────────────────────────
//  Guest Service
// ─────────────────────────────────────────────
const GUEST_LIMIT = 5;

export const guestService = {
  getSessionKey: () => localStorage.getItem('guest_session_key'),

  setSessionKey: (key) => localStorage.setItem('guest_session_key', key),

  getMessageCount: () => parseInt(localStorage.getItem('guest_message_count') || '0', 10),

  incrementMessageCount: () => {
    const count = guestService.getMessageCount() + 1;
    localStorage.setItem('guest_message_count', String(count));
    return count;
  },

  hasUploadedDocument: () => !!localStorage.getItem('guest_session_key'),

  hasReachedLimit: () => guestService.getMessageCount() >= GUEST_LIMIT,

  getRemainingMessages: () => Math.max(0, GUEST_LIMIT - guestService.getMessageCount()),

  getLimit: () => GUEST_LIMIT,

  clear: () => {
    localStorage.removeItem('guest_session_key');
    localStorage.removeItem('guest_message_count');
  },
};

// ─────────────────────────────────────────────
//  Document Service
// ─────────────────────────────────────────────
export const documentService = {
  getDocuments: async () => {
    const response = await api.get('/documents/');
    return response.data;
  },

  getDocument: async (id) => {
    const response = await api.get(`/documents/${id}/`);
    return response.data;
  },

  uploadDocument: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(pct);
        }
      }
    });
    // If backend returned a guest_session_key, store it
    if (response.data.guest_session_key) {
      guestService.setSessionKey(response.data.guest_session_key);
    }
    return response.data;
  },

  deleteDocument: async (id) => {
    const response = await api.delete(`/documents/${id}/`);
    return response.data;
  },

  translateDocument: async (id, targetLanguage, type = 'summary') => {
    const response = await api.post(`/documents/${id}/translate/`, {
      target_language: targetLanguage,
      type
    });
    return response.data;
  },

  getDownloadSummaryUrl: (id) => {
    const token = localStorage.getItem('access_token');
    return `${API_URL}/documents/${id}/download-summary/?token=${token}`;
  },

  compareDocuments: async (doc1Id, doc2Id) => {
    const response = await api.post('/documents/compare/', {
      doc1_id: doc1Id,
      doc2_id: doc2Id
    });
    return response.data;
  }
};

// ─────────────────────────────────────────────
//  Chat Service
// ─────────────────────────────────────────────
export const chatService = {
  getSessions: async (docId) => {
    const response = await api.get(`/documents/${docId}/chats/`);
    return response.data;
  },

  createSession: async (docId, title) => {
    const response = await api.post(`/documents/${docId}/chats/`, { title });
    return response.data;
  },

  renameSession: async (sessionId, title) => {
    const response = await api.patch(`/chats/${sessionId}/`, { title });
    return response.data;
  },

  deleteSession: async (sessionId) => {
    await api.delete(`/chats/${sessionId}/`);
  },

  getMessages: async (sessionId) => {
    const response = await api.get(`/chats/${sessionId}/messages/`);
    return response.data;
  },

  sendMessage: async (sessionId, message, config = {}) => {
    const response = await api.post(`/chats/${sessionId}/messages/`, { message }, config);
    return response.data;
  }
};

export default api;
