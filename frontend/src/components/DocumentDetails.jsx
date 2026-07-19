import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Download, Globe, Sparkles, Loader2, BookOpen, Key } from 'lucide-react';
import { documentService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DocumentDetails = ({ documentId, onBack, onUpgradeRequired }) => {
  const { isAuthenticated } = useAuth();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'content', 'translation'
  
  // Translation state
  const [targetLang, setTargetLang] = useState('spanish');
  const [translateType, setTranslateType] = useState('summary');
  const [translating, setTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [translationError, setTranslationError] = useState('');

  const languages = [
    { code: 'spanish', name: 'Spanish' },
    { code: 'french', name: 'French' },
    { code: 'german', name: 'German' },
    { code: 'italian', name: 'Italian' },
    { code: 'portuguese', name: 'Portuguese' },
    { code: 'hindi', name: 'Hindi' },
    { code: 'japanese', name: 'Japanese' },
    { code: 'chinese', name: 'Chinese' },
  ];

  useEffect(() => {
    fetchDocumentDetails();
  }, [documentId]);

  const fetchDocumentDetails = async () => {
    setLoading(true);
    try {
      const data = await documentService.getDocument(documentId);
      setDocument(data);
    } catch (err) {
      console.error("Failed to load document details:", err);
      alert("Error loading document details.");
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!isAuthenticated) {
      onUpgradeRequired?.('Document translation is a premium feature. Sign up now to translate summaries or full text!');
      return;
    }

    setTranslating(true);
    setTranslationError('');
    setTranslatedText('');
    
    try {
      const data = await documentService.translateDocument(document.id, targetLang, translateType);
      setTranslatedText(data.translated_text);
    } catch (err) {
      console.error(err);
      setTranslationError("Failed to generate translation. Ensure GROQ_API_KEY is configured.");
    } finally {
      setTranslating(false);
    }
  };

  const handleDownloadSummary = () => {
    if (!document) return;
    if (!isAuthenticated) {
      onUpgradeRequired?.('Downloading summaries is a premium feature. Sign up to save reports offline!');
      return;
    }
    window.open(documentService.getDownloadSummaryUrl(document.id), '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Skeleton Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="h-4 w-32 rounded shimmer"></div>
          <div className="h-9 w-36 rounded-xl shimmer"></div>
        </div>

        {/* Skeleton Info Hero */}
        <div className="glass p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl shimmer"></div>
          <div className="space-y-2.5 flex-1">
            <div className="h-5 w-1/3 rounded shimmer"></div>
            <div className="h-3.5 w-1/4 rounded shimmer"></div>
          </div>
        </div>

        {/* Skeleton Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="glass p-4 rounded-xl border border-slate-800/60 space-y-2">
              <div className="h-2.5 w-12 rounded shimmer"></div>
              <div className="h-4 w-20 rounded shimmer"></div>
            </div>
          ))}
        </div>

        {/* Skeleton Tabs */}
        <div className="flex border-b border-slate-800 space-x-2 pb-1">
          <div className="h-8 w-24 rounded shimmer"></div>
          <div className="h-8 w-24 rounded shimmer"></div>
          <div className="h-8 w-28 rounded shimmer"></div>
        </div>

        {/* Skeleton Content */}
        <div className="glass p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="h-4 w-36 rounded shimmer"></div>
          <div className="space-y-3 pt-2">
            <div className="h-4 w-full rounded shimmer"></div>
            <div className="h-4 w-full rounded shimmer"></div>
            <div className="h-4 w-5/6 rounded shimmer"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Detail Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between border-b border-slate-800/80 pb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Documents
        </button>
        <button 
          onClick={handleDownloadSummary}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 rounded-xl text-xs font-semibold transition-all w-full sm:w-auto justify-center"
        >
          <Download className="w-3.5 h-3.5" />
          Download Summary
        </button>
      </div>

      {/* Info Hero */}
      <div className="glass p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
        <div className="bg-brand-600/10 p-3.5 rounded-2xl border border-brand-500/25">
          <FileText className="w-8 h-8 text-brand-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-1.5">{document.filename}</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
              {document.file_type}
            </span>
            <span className="text-xs text-slate-400">
              Uploaded on {new Date(document.uploaded_at).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Metadata Dashboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass p-4 rounded-xl border border-slate-800/60 hover:border-brand-500/20 transition-all flex flex-col justify-between">
          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Pages</span>
          <span className="text-base font-bold text-white mt-1">{document.page_count}</span>
        </div>
        <div className="glass p-4 rounded-xl border border-slate-800/60 hover:border-brand-500/20 transition-all flex flex-col justify-between">
          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Words</span>
          <span className="text-base font-bold text-white mt-1">{document.word_count?.toLocaleString()}</span>
        </div>
        <div className="glass p-4 rounded-xl border border-slate-800/60 hover:border-brand-500/20 transition-all flex flex-col justify-between">
          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Language</span>
          <span className="text-base font-bold text-white mt-1 truncate">{document.language}</span>
        </div>
        <div className="glass p-4 rounded-xl border border-slate-800/60 hover:border-brand-500/20 transition-all flex flex-col justify-between">
          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Reading Time</span>
          <span className="text-base font-bold text-white mt-1">{document.reading_time} min</span>
        </div>
        <div className="glass p-4 rounded-xl border border-slate-800/60 hover:border-brand-500/20 transition-all flex flex-col justify-between">
          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Upload Size</span>
          <span className="text-base font-bold text-white mt-1">
            {document.file_size ? (document.file_size / (1024 * 1024)).toFixed(2) + ' MB' : '0.00 MB'}
          </span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI Analysis
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'content'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Parsed Content
        </button>
        <button
          onClick={() => setActiveTab('translation')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'translation'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Translation Engine
        </button>
      </div>

      {/* Tab Panels */}
      <div className="min-h-[300px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Keywords */}
            {document.keywords && document.keywords.length > 0 && (
              <div className="glass p-5 rounded-2xl border border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-slate-500" />
                  Key Entities & Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {document.keywords.map((kw, i) => (
                    <span key={i} className="text-xs px-3.5 py-1.5 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl hover:border-brand-500/30 transition-colors">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="glass p-6 rounded-2xl border border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-400" />
                Executive AI Summary
              </h3>
              <p className="text-slate-200 leading-relaxed text-sm whitespace-pre-wrap bg-slate-900/20 p-4 border border-slate-800/60 rounded-xl">
                {document.summary || "Summary generation failed or is in progress."}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="glass p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-slate-500" />
              Document Text Transcript
            </h3>
            <div className="max-h-[450px] overflow-y-auto bg-slate-950 border border-slate-900 rounded-xl p-4 text-sm text-slate-350 leading-relaxed whitespace-pre-wrap font-sans">
              {document.content || "[No extractable text content found in file]"}
            </div>
          </div>
        )}

        {activeTab === 'translation' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Options Panel */}
            <div className="md:col-span-1 glass p-5 rounded-2xl border border-slate-800 space-y-4 h-fit">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-brand-400" />
                Configure Translation
              </h3>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Language</label>
                <select 
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-brand-500 text-xs font-semibold"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Content Scope</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setTranslateType('summary')}
                    className={`py-2 px-3 border rounded-xl text-xs font-semibold transition-all ${
                      translateType === 'summary'
                        ? 'bg-brand-600/10 border-brand-500 text-brand-400'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-900/60'
                    }`}
                  >
                    Summary
                  </button>
                  <button 
                    onClick={() => setTranslateType('content')}
                    className={`py-2 px-3 border rounded-xl text-xs font-semibold transition-all ${
                      translateType === 'content'
                        ? 'bg-brand-600/10 border-brand-500 text-brand-400'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-900/60'
                    }`}
                  >
                    Full Text
                  </button>
                </div>
              </div>

              <button 
                onClick={handleTranslate}
                disabled={translating}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-900/10 hover:shadow-brand-900/20 transition-all flex items-center justify-center gap-2"
              >
                {translating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Translating...
                  </>
                ) : (
                  'Generate Translation'
                )}
              </button>
            </div>

            {/* Translation Output */}
            <div className="md:col-span-2 glass p-5 rounded-2xl border border-slate-800 min-h-[220px] flex flex-col">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                Translation Output ({targetLang.toUpperCase()})
              </h3>
              {translating ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-2">
                  <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
                  <p className="text-xs text-slate-400">Calling LLM translation module...</p>
                </div>
              ) : translationError ? (
                <div className="flex-1 flex items-center justify-center p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-medium">
                  {translationError}
                </div>
              ) : translatedText ? (
                <div className="flex-1 bg-slate-950 border border-slate-900 rounded-xl p-4 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {translatedText}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center border border-dashed border-slate-800/80 rounded-xl text-xs text-slate-500 italic p-6">
                  Select language parameters and run "Generate Translation" above to view translated transcription here.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentDetails;
