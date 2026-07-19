import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import ChatInterface from './components/ChatInterface';
import DocumentDetails from './components/DocumentDetails';
import DocumentComparison from './components/DocumentComparison';
import AuthModal from './components/AuthModal';
import UpgradeModal from './components/UpgradeModal';
import { documentService, guestService } from './services/api';
import { Sparkles } from 'lucide-react';

// ─────────────────────────────────────────────
//  Inner App (has access to AuthContext)
// ─────────────────────────────────────────────
function AppInner() {
  const { isAuthenticated, isGuest, user } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'chat' | 'details' | 'compare'
  const [selectedCompareDocs, setSelectedCompareDocs] = useState([]);

  // Modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');

  // Fetch docs whenever auth state changes
  useEffect(() => {
    fetchDocuments();
  }, [isAuthenticated]);

  const fetchDocuments = async () => {
    setDocsLoading(true);
    try {
      const data = await documentService.getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setDocsLoading(false);
    }
  };

  const handleDeleteDocument = async (id) => {
    try {
      await documentService.deleteDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      if (selectedDoc?.id === id) {
        setSelectedDoc(null);
        setCurrentView('list');
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Error deleting document.');
    }
  };

  const handleSelectDoc = (doc, view) => {
    setSelectedDoc(doc);
    setCurrentView(view);
  };

  const handleToggleCompareDoc = (id) => {
    setSelectedCompareDocs((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  // Auth modal helpers
  const openAuth = (tab = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  // Upgrade modal helpers
  const openUpgrade = (reason = '') => {
    setUpgradeReason(reason);
    setUpgradeModalOpen(true);
  };

  // Actions that require auth — guests see upgrade modal
  const requireAuth = (action, reason) => {
    if (isAuthenticated) {
      action();
    } else {
      openUpgrade(reason || 'This feature requires a free account.');
    }
  };

  const handleUploadSuccess = () => {
    fetchDocuments();
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">

      {/* ── Navbar ───────────────────────────────────────── */}
      <Navbar
        onBackToDocs={() => {
          setSelectedDoc(null);
          setCurrentView('list');
        }}
        onShowAuth={(tab) => openAuth(tab)}
      />

      {/* ── Main Content ──────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="space-y-8 animate-in fade-in duration-200">

          {/* ── List View ────────────────────────────────── */}
          {currentView === 'list' && (
            <>
              {/* Hero Banner */}
              <div className="space-y-3 pb-2 border-b border-slate-900">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/10 border border-brand-500/30 text-brand-400 rounded-full text-[10px] uppercase font-bold tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  Next Generation Document Intelligence
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight m-0">
                  {isAuthenticated
                    ? `Welcome back, ${user?.username}!`
                    : 'Interact with Your Documents via AI'}
                </h2>
                <p className="text-slate-400 text-xs md:text-sm max-w-2xl leading-relaxed">
                  {isAuthenticated
                    ? "Upload PDFs, Word files (DOCX), or plain text files (TXT). Your documents are saved and accessible anytime."
                    : "Upload a document to get started for free. You can upload files and send up to 5 AI messages as a guest — no account required."}
                </p>
                {/* Guest CTA */}
                {isGuest && !guestService.hasUploadedDocument() && (
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => openAuth('signup')}
                      className="text-xs font-semibold text-brand-400 hover:text-brand-300 underline transition-colors"
                    >
                      Create a free account
                    </button>
                    <span className="text-slate-600 text-xs">for unlimited access</span>
                  </div>
                )}
              </div>

              {/* Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-6">
                  <div className="glass p-6 rounded-2xl border border-slate-800/80">
                    <h3 className="text-sm font-bold text-white mb-2">Upload Center</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      {isGuest
                        ? 'Upload your first document for free. Create an account to upload unlimited documents.'
                        : 'Upload your PDF, DOCX or TXT file below to parse content and activate AI chat features.'}
                    </p>
                    <DocumentUpload
                      onUploadSuccess={handleUploadSuccess}
                      onUpgradeRequired={() => openUpgrade('Guest users can only upload one document. Create a free account to upload unlimited documents.')}
                      isGuest={isGuest}
                      guestHasDocument={guestService.hasUploadedDocument()}
                    />
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <DocumentList
                    documents={documents}
                    loading={docsLoading}
                    onSelectDoc={handleSelectDoc}
                    onDeleteDoc={handleDeleteDocument}
                    selectedCompareDocs={selectedCompareDocs}
                    onToggleCompareDoc={handleToggleCompareDoc}
                    onCompareClick={() => {
                      requireAuth(
                        () => setCurrentView('compare'),
                        'Document comparison is available for registered users. It\'s free to sign up!'
                      );
                    }}
                    onDetailsClick={(doc) => {
                      handleSelectDoc(doc, 'details');
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Chat View ─────────────────────────────────── */}
          {currentView === 'chat' && selectedDoc && (
            <ChatInterface
              document={selectedDoc}
              onBack={() => {
                setSelectedDoc(null);
                setCurrentView('list');
              }}
              onUpgradeRequired={(reason) => openUpgrade(reason)}
            />
          )}

          {/* ── Details View ──────────────────────────────── */}
          {currentView === 'details' && selectedDoc && (
            <DocumentDetails
              documentId={selectedDoc.id}
              onBack={() => {
                setSelectedDoc(null);
                setCurrentView('list');
              }}
              onUpgradeRequired={(reason) => openUpgrade(reason)}
            />
          )}

          {/* ── Compare View ──────────────────────────────── */}
          {currentView === 'compare' && selectedCompareDocs.length === 2 && (
            <DocumentComparison
              doc1={documents.find((d) => d.id === selectedCompareDocs[0])}
              doc2={documents.find((d) => d.id === selectedCompareDocs[1])}
              onBack={() => {
                setSelectedCompareDocs([]);
                setCurrentView('list');
              }}
            />
          )}
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-5 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} DocuMind AI. Powering interactive reading workflows.
      </footer>

      {/* ── Auth Modal ───────────────────────────────────── */}
      <AuthModal
        isOpen={authModalOpen}
        defaultTab={authModalTab}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={() => {
          setAuthModalOpen(false);
          fetchDocuments();
        }}
      />

      {/* ── Upgrade Modal ────────────────────────────────── */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        reason={upgradeReason}
        onClose={() => setUpgradeModalOpen(false)}
        onSignUp={() => {
          setUpgradeModalOpen(false);
          openAuth('signup');
        }}
        onLogin={() => {
          setUpgradeModalOpen(false);
          openAuth('login');
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
//  Root App — wraps with AuthProvider
// ─────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;
