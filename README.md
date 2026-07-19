# 🧠 DocuMind AI — Interactive Document Assistant

> **Upload. Analyze. Compare. Chat.** — A full-stack AI-powered platform for intelligent document analysis, powered by the Groq LLM API and a modern React + Django stack.

![Backend](https://img.shields.io/badge/Backend-Django%204.2%20%7C%20DRF-092E20?logo=django&logoColor=white)
![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%208-61DAFB?logo=react&logoColor=black)
![AI](https://img.shields.io/badge/AI-Groq%20%7C%20LLaMA%203-8B4FDB?logo=meta)

---

## ✨ Features

| Feature | Description |
|---|---|
| 📤 **Smart Document Upload** | Upload PDF, DOCX, or TXT files with a live progress bar and step-by-step status updates |
| 🔍 **AI-Powered Analysis** | Instantly generates summaries, extracts keywords, and detects document language via Groq LLaMA |
| 📊 **Document Metadata** | Displays pages, word count, detected language, reading time, and file size |
| 💬 **Contextual AI Chat** | Multi-session Q&A with typewriter animations and bouncing-dot typing indicators |
| 🌐 **Translation Engine** | Translate document summaries or full content to any target language |
| ⚖️ **Contract Comparison** | Compare two documents side-by-side — highlights differences, missing clauses, and a detailed Markdown report |
| 📥 **Summary Download** | Export AI-generated document summaries as `.txt` files |
| 🎨 **Premium UI** | Glassmorphism dark mode, shimmer skeleton loaders, smooth micro-animations |

---

## 📁 Project Structure

```
DocAnalyzer/
├── backend/                    # Django REST Framework API
│   ├── api/
│   │   ├── models.py           # Document, ChatSession, ChatMessage models
│   │   ├── serializers.py      # DRF serializers
│   │   ├── views.py            # API views and viewsets
│   │   ├── urls.py             # URL routing
│   │   └── utils.py            # AI pipeline (Groq integration, parsing, comparison)
│   ├── document_assistant/     # Django project settings
│   ├── media/                  # Uploaded document storage
│   ├── .env                    # Environment variables (not committed)
│   ├── requirements.txt        # Python dependencies
│   └── manage.py
│
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Top navigation bar
│   │   │   ├── DocumentUpload.jsx      # Drag-and-drop uploader with progress
│   │   │   ├── DocumentList.jsx        # Document grid with metadata + comparison checkboxes
│   │   │   ├── DocumentDetails.jsx     # Full detail view with skeleton loaders
│   │   │   ├── ChatInterface.jsx       # AI chat with typewriter & typing bubble
│   │   │   ├── DocumentComparison.jsx  # Side-by-side contract comparison UI
│   │   │   └── AuthModal.jsx           # Auth modal (mock session)
│   │   ├── services/
│   │   │   └── api.js          # Axios service layer
│   │   ├── App.jsx             # Root component and routing state
│   │   ├── main.jsx            # React entry point
│   │   └── index.css           # Global styles, glassmorphism, shimmer animations
│   ├── tailwind.config.js      # Custom brand color palette
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+ and **npm** 9+
- A free **[Groq API Key](https://console.groq.com/)** (for AI features)

---

## 🐍 Backend Setup

### 1. Navigate to the backend directory

```bash
cd DocAnalyzer/backend
```

### 2. Create and activate a virtual environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file inside `backend/`:

```env
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-change-me-in-production

# Groq AI Configuration
# Get your free key at: https://console.groq.com/
GROQ_API_KEY=gsk_your_groq_api_key_here
```

> 💡 **Without a Groq API key**, the app falls back to a local mock generator that still produces realistic summaries and keywords.

### 5. Apply database migrations

```bash
python manage.py migrate
```

### 6. Start the development server

```bash
python manage.py runserver 8000
```

The Django API will be available at **`https://documentanalyzer-tgso.onrender.com`**.

---

## ⚛️ Frontend Setup

### 1. Navigate to the frontend directory

```bash
cd DocAnalyzer/frontend
```

### 2. Install npm dependencies

```bash
npm install
```

### 3. Start the Vite dev server

```bash
npm run dev
```

The React app will be available at **`http://localhost:5173`**.

---

## 🔌 REST API Reference

All endpoints are prefixed with `/api/`.

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/documents/` | List all documents |
| `POST` | `/api/documents/` | Upload and analyze a new document (`multipart/form-data`) |
| `GET` | `/api/documents/{id}/` | Get full document details |
| `DELETE` | `/api/documents/{id}/` | Delete a document |
| `POST` | `/api/documents/{id}/translate/` | Translate summary or full content |
| `GET` | `/api/documents/{id}/download-summary/` | Download AI summary as a `.txt` file |
| `POST` | `/api/documents/compare/` | Run AI comparison between two documents |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/documents/{doc_id}/chats/` | List chat sessions for a document |
| `POST` | `/api/documents/{doc_id}/chats/` | Create a new chat session |
| `GET` | `/api/chats/{session_id}/messages/` | List all messages in a session |
| `POST` | `/api/chats/{session_id}/messages/` | Send a message and receive an AI response |

### Example: Upload a Document

**POST** `/api/documents/` — `multipart/form-data`

```json
// Response
{
  "id": 1,
  "filename": "contract.pdf",
  "file_type": "pdf",
  "uploaded_at": "2026-07-12T10:00:00Z",
  "summary": "This contract outlines the terms between...",
  "keywords": ["contract", "terms", "payment", "liability"],
  "page_count": 12,
  "word_count": 5340,
  "language": "English",
  "reading_time": 27,
  "file_size": 204800
}
```

### Example: Compare Two Documents

**POST** `/api/documents/compare/`

```json
// Request
{ "doc1_id": 1, "doc2_id": 2 }

// Response
{
  "summary": "Document 1 is an older operations manual...",
  "differences": [
    {
      "topic": "Product Warranty",
      "doc1_version": "2-Year warranty",
      "doc2_version": "3-Year Platinum warranty",
      "difference_type": "High"
    }
  ],
  "missing_clauses": [
    {
      "clause_name": "Dispute Resolution",
      "document_missing_from": "Document 2",
      "description": "No arbitration clause found in Document 2."
    }
  ],
  "comparison_report_markdown": "## Detailed Comparison Report\n..."
}
```

### Example: AI Chat

**POST** `/api/chats/{session_id}/messages/`

```json
// Request
{ "message": "What is the main topic of this document?" }

// Response
{
  "user_message": { "id": 5, "sender": "user", "message": "...", "timestamp": "..." },
  "ai_message":   { "id": 6, "sender": "ai",   "message": "...", "timestamp": "..." }
}
```

---

## 🗃️ Data Models

### `Document`

| Field | Type | Description |
|-------|------|-------------|
| `filename` | `CharField` | Original uploaded filename |
| `file_type` | `CharField` | `pdf`, `docx`, or `txt` |
| `content` | `TextField` | Full extracted text |
| `summary` | `TextField` | AI-generated summary |
| `keywords` | `JSONField` | List of extracted keywords |
| `page_count` | `IntegerField` | Number of pages |
| `word_count` | `IntegerField` | Total word count |
| `language` | `CharField` | Detected document language |
| `reading_time` | `IntegerField` | Estimated reading time (minutes) |
| `file_size` | `BigIntegerField` | File size in bytes |

### `ChatSession`

| Field | Type | Description |
|-------|------|-------------|
| `document` | `ForeignKey` | Associated document |
| `title` | `CharField` | Session title |
| `created_at` | `DateTimeField` | Creation timestamp |

### `ChatMessage`

| Field | Type | Description |
|-------|------|-------------|
| `session` | `ForeignKey` | Associated chat session |
| `sender` | `CharField` | `user` or `ai` |
| `message` | `TextField` | Message content |
| `timestamp` | `DateTimeField` | Message timestamp |

---

## 🤖 AI Pipeline

The entire AI pipeline lives in [`backend/api/utils.py`](./backend/api/utils.py).
All Groq calls have graceful local fallbacks for offline/keyless mode.

```
Document Upload
    │
    ▼
extract_text_from_file()
    │  PDF (pypdf) · DOCX (python-docx) · TXT (UTF-8/Latin-1)
    │
    ▼
generate_summary_and_keywords()
    │  ┌─ Groq available ──► llama-3.1-8b-instant  (fast)
    │  └─ No key        ──► Smart local mock (frequency analysis)
    │
    ▼
chat_with_document()
    │  ┌─ Groq available ──► llama-3.3-70b-versatile (deep Q&A)
    │  └─ No key        ──► Context-aware fallback responses
    │
    ▼
generate_comparison_report()
       ┌─ Groq available ──► llama-3.3-70b-versatile (clause analysis)
       └─ No key        ──► Structured textual diff + keyword matching
```

### Groq Models

| Task | Model |
|------|-------|
| Summary & keyword extraction | `llama-3.1-8b-instant` |
| Chat Q&A | `llama-3.3-70b-versatile` |
| Document comparison | `llama-3.3-70b-versatile` |
| Translation | `llama-3.3-70b-versatile` |

---

## 🎨 Frontend Architecture

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `App.jsx` | Global state — documents, view routing, comparison selection |
| `Navbar.jsx` | Top navigation with back-to-list action |
| `DocumentUpload.jsx` | Drag-and-drop uploader, 3-step progress bar, status labels |
| `DocumentList.jsx` | Document grid with metadata chips, comparison checkboxes, action banner |
| `DocumentDetails.jsx` | Skeleton-loaded detail view, tabbed AI analysis, metadata dashboard |
| `ChatInterface.jsx` | Session management, typewriter text reveal, bouncing-dot typing indicator |
| `DocumentComparison.jsx` | Tabbed comparison report — summary, differences, missing clauses, full Markdown |

### Design System

| Aspect | Technology |
|--------|-----------|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS 3 + custom `brand` palette |
| Icons | Lucide React |
| HTTP | Axios (with upload progress callbacks) |
| Animations | Shimmer keyframes, `animate-bounce`, `animate-spin`, `animate-pulse` |
| Design pattern | Glassmorphism dark mode (`rgba` + `backdrop-filter: blur`) |

### npm Scripts

```bash
npm run dev       # Start Vite dev server with hot reload
npm run build     # Build production bundle → /dist
npm run preview   # Serve production build locally
npm run lint      # Run oxlint static analysis
```

---

## ⚙️ Configuration Reference

### Backend `.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | ✅ | Django secret key — change in production |
| `DEBUG` | ✅ | `True` (dev) or `False` (prod) |
| `GROQ_API_KEY` | ⚠️ Optional | Enables live LLM features — [get one free](https://console.groq.com) |

### CORS

Configured in `document_assistant/settings.py` for the Vite dev origin:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://documentanalyzer-frontend-78atyxyt6-mr2004.vercel.app/"
]
```


---

## 🛠️ Development Notes

- **`.env` changes** require a manual server restart (Django StatReloader does not pick up env changes automatically).
- **Page count (non-PDF):** Estimated as `max(1, word_count // 500)`.
- **Reading time:** Calculated at `max(1, word_count // 200)` minutes (200 wpm).
- **Single-user mode:** All documents are linked to an auto-created `default_user`. Authentication UI is present but mocked — no JWT validation is enforced.

---

## 📦 Python Dependencies

| Package | Purpose |
|---------|---------|
| `django ≥4.2` | Web framework |
| `djangorestframework ≥3.14` | REST API layer |
| `django-cors-headers ≥4.3` | CORS middleware |
| `djangorestframework-simplejwt ≥5.3` | JWT auth (currently mocked) |
| `groq ≥0.9` | Groq LLM API client |
| `pypdf ≥4.1` | PDF text extraction |
| `python-docx ≥1.1` | DOCX text extraction |
| `python-dotenv ≥1.0` | `.env` file loading |
| `pillow ≥10.2` | Image processing support |

---

## 🧪 Quick End-to-End Test

1. Start the backend: `python manage.py runserver 8000`
2. Start the frontend: `npm run dev`
3. Open **http://localhost:5173**
4. Upload `test_doc.txt` — watch the 3-step progress bar
5. Observe metadata chips on the document card (Pages · Words · Size)
6. Click **Details** — verify the metadata dashboard (Pages, Words, Language, Reading Time, Size)
7. Click **Chat** — ask a question, observe the bouncing-dot AI typing indicator
8. Return to the list, check both `test_doc.txt` and `test_doc_v2.txt`
9. Click **Run Comparison** — explore the contract analysis tabs

---

<p align="center">Built with ❤️ using Django, React, and Groq AI</p>
