import React, { useState } from 'react';
import { FileText, MessageSquare, Trash2, Search, Calendar, ChevronRight, Scale } from 'lucide-react';
import { documentService } from '../services/api';

const DocumentList = ({ 
  documents, 
  loading, 
  onSelectDoc, 
  onDeleteDoc, 
  selectedCompareDocs = [], 
  onToggleCompareDoc, 
  onCompareClick,
  onDetailsClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = documents.filter(doc => {
    const filenameMatch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const keywordMatch = doc.keywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()));
    return filenameMatch || keywordMatch;
  });

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="space-y-6">
      {/* Comparison Action Bar */}
      {selectedCompareDocs.length > 0 && (
        <div className="flex items-center justify-between bg-brand-500/10 border border-brand-500/30 p-4 rounded-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-brand-400 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-white">Comparison Dashboard Active</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {selectedCompareDocs.length === 1 
                  ? "Select one more document in the list to trigger comparison" 
                  : "Two documents selected. Ready to run side-by-side analysis."}
              </p>
            </div>
          </div>
          {selectedCompareDocs.length === 2 && (
            <button 
              onClick={onCompareClick}
              className="py-2 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-900/20 hover:shadow-brand-900/30 transition-all flex items-center gap-1.5"
            >
              <Scale className="w-3.5 h-3.5" />
              Run Comparison
            </button>
          )}
        </div>
      )}

      {/* Search Header */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
        <h2 className="text-lg font-bold text-white m-0">My Documents</h2>
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Search by name or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors text-sm"
          />
        </div>
      </div>

      {/* Grid of Documents */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass p-5 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl shimmer"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 rounded shimmer"></div>
                  <div className="h-3 w-1/3 rounded shimmer"></div>
                </div>
              </div>
              <div className="h-16 rounded shimmer"></div>
              <div className="flex gap-2">
                <div className="h-8 w-1/2 rounded shimmer"></div>
                <div className="h-8 w-1/2 rounded shimmer"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/10 border border-dashed border-slate-800 rounded-2xl">
          <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">No documents found</p>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery ? "Try refining your search terms" : "Upload a PDF, DOCX, or TXT file to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <div 
              key={doc.id} 
              className={`glass glass-hover p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                selectedCompareDocs.includes(doc.id) 
                  ? 'border-brand-500 bg-slate-900/40 shadow-inner' 
                  : 'border-slate-800'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={selectedCompareDocs.includes(doc.id)}
                      disabled={!selectedCompareDocs.includes(doc.id) && selectedCompareDocs.length >= 2}
                      onChange={() => onToggleCompareDoc(doc.id)}
                      className="w-4 h-4 rounded border-slate-800 text-brand-600 bg-slate-950 focus:ring-brand-500/25 transition-all cursor-pointer mr-1"
                      title="Select for contract comparison"
                    />
                    <div className="bg-brand-600/10 p-2.5 rounded-xl border border-brand-500/20 flex-shrink-0">
                      <FileText className="w-5 h-5 text-brand-400" />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="text-sm font-semibold text-white truncate max-w-[130px]" title={doc.filename}>
                        {doc.filename}
                      </h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-850 text-slate-400">
                          {doc.file_type}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 ml-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(doc.uploaded_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this document?')) {
                        onDeleteDoc(doc.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Metadata tags */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[10px] text-slate-400 font-semibold border-b border-slate-900 pb-2">
                  <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800/60 text-slate-350">
                    {doc.page_count || 1} {doc.page_count === 1 ? 'Page' : 'Pages'}
                  </span>
                  <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800/60 text-slate-350">
                    {doc.word_count ? (doc.word_count >= 1000 ? (doc.word_count / 1000).toFixed(1) + 'k' : doc.word_count) : 0} words
                  </span>
                  <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800/60 text-slate-350">
                    {doc.file_size ? (doc.file_size / (1024 * 1024)).toFixed(1) + ' MB' : '0.1 MB'}
                  </span>
                </div>

                {/* Summary Snippet */}
                <p className="text-xs text-slate-400 mt-4 line-clamp-3 leading-relaxed">
                  {doc.summary || "Generating summary..."}
                </p>

                {/* Keywords */}
                {doc.keywords && doc.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4">
                    {doc.keywords.slice(0, 3).map((kw, i) => (
                      <span key={i} className="text-[10px] px-2 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg">
                        {kw}
                      </span>
                    ))}
                    {doc.keywords.length > 3 && (
                      <span className="text-[10px] px-1.5 py-1 text-slate-400 rounded-lg font-medium">
                        +{doc.keywords.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-6 border-t border-slate-800/80 pt-4">
                <button 
                  onClick={() => onSelectDoc(doc, 'chat')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-900/10 hover:shadow-brand-900/20 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chat
                </button>
                <button 
                  onClick={() => onDetailsClick ? onDetailsClick(doc) : onSelectDoc(doc, 'details')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Details
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;
