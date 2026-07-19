import React from 'react';
import { X, MessageSquare, FolderOpen, Download, History, Languages, Sparkles, ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Unlimited AI Chats',
    desc: 'Ask unlimited questions across all your documents',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
    border: 'border-brand-500/20',
  },
  {
    icon: FolderOpen,
    title: 'Save Documents',
    desc: 'Upload and keep all your documents in one place',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  {
    icon: Download,
    title: 'Download Reports',
    desc: 'Export AI-generated summaries as text files',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    icon: History,
    title: 'Chat History',
    desc: 'All your conversations are saved and searchable',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    icon: Languages,
    title: 'Translation',
    desc: 'Translate documents into 10+ languages instantly',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
];

const UpgradeModal = ({ isOpen, onClose, onSignUp, onLogin, reason }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-700/60">

        {/* ── Header ────────────────────────────────────────── */}
        <div className="relative p-6 pb-4 bg-gradient-to-br from-brand-900/40 via-slate-900/20 to-transparent border-b border-slate-800/60">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Glowing badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/15 border border-brand-500/30 text-brand-400 rounded-full text-[10px] uppercase font-bold tracking-wider mb-3">
            <Sparkles className="w-3 h-3 animate-pulse" />
            Free Limit Reached
          </div>

          <h2 className="text-2xl font-extrabold text-white leading-tight m-0">
            Unlock the Full<br />
            <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">
              DocuMind Experience
            </span>
          </h2>

          {reason && (
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">{reason}</p>
          )}
        </div>

        {/* ── Feature List ──────────────────────────────────── */}
        <div className="p-6 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Create an account to unlock:
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg, border }) => (
              <div
                key={title}
                className={`flex items-center gap-3 p-3 rounded-xl ${bg} border ${border} transition-all hover:scale-[1.01]`}
              >
                <div className={`p-2 rounded-lg ${bg} border ${border} flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">{title}</p>
                  <p className="text-xs text-slate-400 leading-tight mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Action Buttons ────────────────────────────────── */}
        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={onSignUp}
            className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-brand-900/20 font-bold text-sm transition-all flex items-center justify-center gap-2 group"
          >
            Create Free Account
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={onLogin}
            className="w-full py-2.5 bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 text-slate-300 rounded-xl font-medium text-sm transition-all"
          >
            Already have an account? Sign In
          </button>
          <button
            onClick={onClose}
            className="w-full text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            Continue as guest (limited access)
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
