import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Scale, AlertCircle, FileText, Check, ShieldAlert } from 'lucide-react';
import { documentService } from '../services/api';

const DocumentComparison = ({ doc1, doc2, onBack }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'differences', 'missing', 'full'

  useEffect(() => {
    fetchComparison();
  }, [doc1.id, doc2.id]);

  const fetchComparison = async () => {
    setLoading(true);
    try {
      const data = await documentService.compareDocuments(doc1.id, doc2.id);
      setReport(data);
    } catch (err) {
      console.error("Comparison failed:", err);
      alert("Encountered error generating contract comparison. Ensure GROQ_API_KEY is configured.");
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const getSeverityStyles = (severity) => {
    const s = severity?.toLowerCase() || '';
    if (s.includes('high')) {
      return 'bg-rose-500/10 border border-rose-500/30 text-rose-400';
    }
    if (s.includes('medium')) {
      return 'bg-amber-500/10 border border-amber-500/30 text-amber-400';
    }
    return 'bg-sky-500/10 border border-sky-500/30 text-sky-400';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 max-w-xl mx-auto">
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-white font-medium text-base">Comparing Contracts & Documents...</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            docuMind is analyzing clauses, mapping differences, and identifying missing conditions between both files. This may take up to 20 seconds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Documents
        </button>
        <span className="text-[10px] uppercase font-bold px-3 py-1 bg-brand-500/10 border border-brand-500/30 text-brand-400 rounded-full">
          Deep comparison engine active
        </span>
      </div>

      {/* Comparison Hero Header */}
      <div className="glass p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="bg-brand-600/10 p-3.5 rounded-2xl border border-brand-500/25 flex items-center justify-center flex-shrink-0">
            <Scale className="w-8 h-8 text-brand-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white mb-1.5">Document Comparison</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="text-white font-semibold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-450" />
                {doc1.filename}
              </span>
              <span className="text-brand-500 font-bold">VS</span>
              <span className="text-white font-semibold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-450" />
                {doc2.filename}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'summary'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Executive Summary
        </button>
        <button
          onClick={() => setActiveTab('differences')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'differences'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Highlighted Changes ({report?.differences?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('missing')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'missing'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Missing Clauses ({report?.missing_clauses?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('full')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'full'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Detailed Comparison Report
        </button>
      </div>

      {/* Tab Panels */}
      <div className="min-h-[300px]">
        {activeTab === 'summary' && (
          <div className="glass p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-450" />
              Comparison Overview
            </h3>
            <p className="text-slate-250 leading-relaxed text-sm bg-slate-900/20 p-5 border border-slate-850 rounded-xl whitespace-pre-wrap">
              {report?.summary}
            </p>
          </div>
        )}

        {activeTab === 'differences' && (
          <div className="space-y-4">
            {report?.differences?.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/10 border border-dashed border-slate-800 rounded-2xl">
                <Check className="w-10 h-10 text-emerald-555 mx-auto mb-2" />
                <p className="text-slate-300 font-medium">No significant differences detected</p>
                <p className="text-xs text-slate-550 mt-1">Both documents contain matching structures and details.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {report?.differences?.map((diff, index) => (
                  <div key={index} className="glass rounded-2xl border border-slate-850 overflow-hidden">
                    {/* Header bar of diff card */}
                    <div className="bg-slate-900/40 px-5 py-3 border-b border-slate-850 flex justify-between items-center">
                      <span className="text-xs font-bold text-white">{diff.topic}</span>
                      <span className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full ${getSeverityStyles(diff.difference_type)}`}>
                        {diff.difference_type} Intensity
                      </span>
                    </div>
                    {/* Body columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-850">
                      <div className="p-5 space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">In {doc1.filename}</span>
                        <p className="text-xs text-slate-300 leading-relaxed pt-1">{diff.doc1_version}</p>
                      </div>
                      <div className="p-5 space-y-1">
                        <span className="text-[9px] uppercase font-bold text-brand-400 tracking-wider">In {doc2.filename}</span>
                        <p className="text-xs text-slate-300 leading-relaxed pt-1">{diff.doc2_version}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'missing' && (
          <div className="space-y-4">
            {report?.missing_clauses?.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/10 border border-dashed border-slate-800 rounded-2xl">
                <Check className="w-10 h-10 text-emerald-555 mx-auto mb-2" />
                <p className="text-slate-300 font-medium">All essential clauses present</p>
                <p className="text-xs text-slate-550 mt-1">Neither document is missing standard contractual conditions.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {report?.missing_clauses?.map((item, index) => (
                  <div key={index} className="glass p-5 rounded-2xl border border-slate-850 flex items-start gap-4 hover:border-brand-500/15 transition-all">
                    <div className="bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 text-rose-400 mt-0.5 flex-shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs font-bold text-white">{item.clause_name}</h4>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase">
                          Missing From: {item.document_missing_from}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mt-2">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'full' && (
          <div className="glass p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-brand-400" />
              Detailed Comparison Report
            </h3>
            <div className="max-h-[500px] overflow-y-auto bg-slate-950 border border-slate-900 rounded-xl p-5 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
              {report?.comparison_report_markdown}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentComparison;
