import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare, Send, Sparkles, Plus, Loader2, ArrowLeft, Bot, User,
  FileText, Pencil, Trash2, Search, X, Check, BookOpen, Clock, Square
} from 'lucide-react';
import axios from 'axios';
import { chatService, guestService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import GuestBanner from './GuestBanner';

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
const TypewriterText = ({ text, speed = 8, onComplete, isStopped, onStop }) => {
  const [displayedText, setDisplayedText] = useState('');
  const indexRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayedText('');
    
    timerRef.current = setInterval(() => {
      setDisplayedText((prev) => {
        const next = text.substring(0, indexRef.current + 1);
        indexRef.current++;
        if (indexRef.current >= text.length) {
          clearInterval(timerRef.current);
          if (onComplete) onComplete();
        }
        return next;
      });
    }, speed);

    return () => clearInterval(timerRef.current);
  }, [text, speed]);

  useEffect(() => {
    if (isStopped) {
      clearInterval(timerRef.current);
      if (onStop) {
        onStop(text.substring(0, indexRef.current));
      }
    }
  }, [isStopped, text, onStop]);

  return <div className="whitespace-pre-wrap font-sans">{displayedText}</div>;
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
};

// ─────────────────────────────────────────────
//  Source Citation Badge
// ─────────────────────────────────────────────
const SourceBadge = ({ page, paragraph, sourceText }) => {
  const [expanded, setExpanded] = useState(false);
  if (!page && !paragraph) return null;

  return (
    <div className="mt-2.5 flex flex-col gap-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded-lg text-[11px] font-semibold hover:bg-amber-500/15 transition-all w-fit"
      >
        <BookOpen className="w-3 h-3 flex-shrink-0" />
        <span>
          Source
          {page && ` • Page ${page}`}
          {paragraph && ` • ¶${paragraph}`}
        </span>
      </button>
      {expanded && sourceText && (
        <div className="ml-0.5 px-3 py-2 bg-amber-500/5 border border-amber-500/15 rounded-lg text-[11px] text-amber-300/70 italic leading-relaxed max-w-sm animate-in fade-in slide-in-from-top-1 duration-150">
          "{sourceText}"
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
//  Session Item
// ─────────────────────────────────────────────
const SessionItem = ({ session, isActive, onClick, onRename, onDelete }) => {
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editMode) inputRef.current?.focus();
  }, [editMode]);

  const handleRenameSubmit = async () => {
    if (!editTitle.trim()) return;
    await onRename(session.id, editTitle.trim());
    setEditMode(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') { setEditMode(false); setEditTitle(session.title); }
  };

  return (
    <div className="group relative">
      {editMode ? (
        <div className="flex items-center gap-1 px-2 py-2">
          <input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-slate-900 border border-brand-500/40 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
          />
          <button onClick={handleRenameSubmit} className="p-1.5 text-brand-400 hover:text-brand-300">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setEditMode(false); setEditTitle(session.title); }} className="p-1.5 text-slate-500 hover:text-slate-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : confirmDelete ? (
        <div className="px-3 py-2 space-y-1.5">
          <p className="text-[11px] text-red-400 font-medium">Delete this conversation?</p>
          <div className="flex gap-1.5">
            <button
              onClick={() => { onDelete(session.id); setConfirmDelete(false); }}
              className="flex-1 py-1 bg-red-500/20 border border-red-500/30 text-red-400 text-[11px] rounded-lg hover:bg-red-500/30 transition-all"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-1 bg-slate-900/60 border border-slate-800 text-slate-400 text-[11px] rounded-lg hover:bg-slate-900 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onClick}
          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-start gap-2 ${
            isActive
              ? 'bg-brand-600/10 border border-brand-500/30 text-white shadow-inner'
              : 'border border-transparent text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="truncate block">{session.title}</span>
            {session.updated_at && (
              <span className="flex items-center gap-1 text-[10px] text-slate-600 mt-0.5">
                <Clock className="w-2.5 h-2.5" />
                {formatRelativeTime(session.updated_at)}
                {session.message_count > 0 && ` · ${session.message_count} msg`}
              </span>
            )}
          </div>
          {/* Hover actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-auto">
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); setEditMode(true); setEditTitle(session.title); }}
              className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-slate-700/50 transition-all"
            >
              <Pencil className="w-3 h-3" />
            </span>
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
              className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </span>
          </div>
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
//  Main ChatInterface
// ─────────────────────────────────────────────
const ChatInterface = ({ document, onBack, onUpgradeRequired }) => {
  const { isGuest } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastAnimatedMessageId, setLastAnimatedMessageId] = useState(null);
  const [isTypingStopped, setIsTypingStopped] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [guestCount, setGuestCount] = useState(guestService.getMessageCount());
  const [mobileActiveView, setMobileActiveView] = useState('chat'); // 'sidebar' | 'chat'
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  const handleTypingStop = useCallback((displayedText) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === lastAnimatedMessageId ? { ...m, message: displayedText } : m
      )
    );
    setLastAnimatedMessageId(null);
    setIsTypingStopped(false);
  }, [lastAnimatedMessageId]);

  const handleStop = useCallback(() => {
    if (sending) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    } else if (lastAnimatedMessageId !== null) {
      setIsTypingStopped(true);
    }
  }, [sending, lastAnimatedMessageId]);

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (document) fetchSessions();
  }, [document]);

  useEffect(() => {
    if (activeSession) {
      fetchMessages(activeSession.id);
    } else {
      setMessages([]);
    }
  }, [activeSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const data = await chatService.getSessions(document.id);
      setSessions(data);
      if (data.length > 0) {
        setActiveSession(data[0]);
      } else {
        handleCreateSession('General Discussion');
      }
    } catch (err) {
      console.error('Failed to load chat threads:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const fetchMessages = async (sessionId) => {
    setMessagesLoading(true);
    try {
      const data = await chatService.getMessages(sessionId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleCreateSession = async (customTitle = '') => {
    const title = customTitle || prompt('Enter a title for the chat session:', 'New Discussion') || 'Discussion';
    try {
      const newSession = await chatService.createSession(document.id, title);
      setSessions((prev) => [newSession, ...prev]);
      setActiveSession(newSession);
      setMobileActiveView('chat');
    } catch (err) {
      console.error('Failed to create chat session:', err);
    }
  };

  const handleRenameSession = async (sessionId, newTitle) => {
    try {
      const updated = await chatService.renameSession(sessionId, newTitle);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
      if (activeSession?.id === sessionId) {
        setActiveSession(updated);
      }
    } catch (err) {
      console.error('Failed to rename session:', err);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await chatService.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSession || sending) return;

    // Guest limit check
    if (isGuest && guestService.hasReachedLimit()) {
      onUpgradeRequired?.('You\'ve used all 3 free AI messages. Create an account to continue chatting.');
      return;
    }

    const userMsgText = inputText.trim();
    setInputText('');
    setSending(true);

    const tempUserMsg = {
      id: Date.now(),
      sender: 'user',
      message: userMsgText,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const data = await chatService.sendMessage(activeSession.id, userMsgText, { signal: controller.signal });

      // Check for guest limit error from backend
      if (data?.error === 'guest_limit_reached') {
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        onUpgradeRequired?.(data.detail);
        return;
      }

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
        return [...filtered, data.user_message, data.ai_message];
      });
      setLastAnimatedMessageId(data.ai_message.id);
      setIsTypingStopped(false);

      // Update guest counter
      if (isGuest) {
        guestService.incrementMessageCount();
        setGuestCount(guestService.getMessageCount());
      }

      // Update session in list (bump updated_at)
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? { ...s, updated_at: new Date().toISOString(), message_count: (s.message_count || 0) + 2 }
            : s
        )
      );
    } catch (err) {
      if (axios.isCancel(err) || err.name === 'CanceledError') {
        console.log('Chat message generation aborted by user.');
        // Remove the temporary user message
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        // Restore input text so they can edit it or resend
        setInputText(userMsgText);
      } else {
        const errorData = err.response?.data;
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));

        if (errorData?.error === 'guest_limit_reached') {
          onUpgradeRequired?.(errorData.detail);
        } else {
          alert('Error sending message. Please try again.');
        }
      }
    } finally {
      setSending(false);
      abortControllerRef.current = null;
    }
  };

  const isInputDisabled = !activeSession || sending || (isGuest && guestService.hasReachedLimit());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 h-[calc(100vh-120px)] min-h-[500px]">

      {/* ── Sidebar ──────────────────────────────────────── */}
      <div className={`lg:col-span-1 glass rounded-2xl border border-slate-800 flex flex-col overflow-hidden ${
        mobileActiveView === 'sidebar' ? 'block' : 'hidden lg:flex'
      }`}>
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <button
              onClick={() => handleCreateSession()}
              className="p-1.5 rounded-lg bg-brand-600/10 border border-brand-500/20 text-brand-400 hover:bg-brand-600 hover:text-white transition-all"
              title="New Chat"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Doc snippet */}
          <div className="p-4 bg-slate-900/20 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-white truncate" title={document.filename}>
                {document.filename}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Contextual Source</p>
          </div>

          {/* Search */}
          <div className="px-3 pt-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900/40 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Sessions list */}
          <div className="flex-1 px-2 pb-2 overflow-y-auto">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-3 py-2">
              Conversations {filteredSessions.length > 0 && `(${filteredSessions.length})`}
            </p>
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
              </div>
            ) : filteredSessions.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                {searchQuery ? 'No matching conversations' : 'No threads yet'}
              </p>
            ) : (
              <div className="space-y-0.5">
                {filteredSessions.map((sess) => (
                  <SessionItem
                    key={sess.id}
                    session={sess}
                    isActive={activeSession?.id === sess.id}
                    onClick={() => {
                      setActiveSession(sess);
                      setMobileActiveView('chat');
                    }}
                    onRename={handleRenameSession}
                    onDelete={handleDeleteSession}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Summary */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/10 hidden lg:block flex-shrink-0">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">AI Summary</p>
          <p className="text-xs text-slate-400 line-clamp-4 leading-relaxed italic">
            "{document.summary}"
          </p>
        </div>
      </div>

      {/* ── Main Chat Pane ────────────────────────────────── */}
      <div className={`lg:col-span-3 glass rounded-2xl border border-slate-800 flex flex-col overflow-hidden ${
        mobileActiveView === 'chat' ? 'flex' : 'hidden lg:flex'
      }`}>
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile back to threads list button */}
            <button
              type="button"
              onClick={() => setMobileActiveView('sidebar')}
              className="lg:hidden p-1.5 -ml-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              title="View Threads"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {activeSession ? activeSession.title : 'No Thread Selected'}
              </h3>
              <p className="text-[11px] text-brand-400 flex items-center gap-1 font-medium mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                llama-3.3-70b active
              </p>
            </div>
          </div>
        </div>

        {/* Guest banner */}
        {isGuest && (
          <div className="px-6 pt-3 flex-shrink-0">
            <GuestBanner onUpgrade={() => onUpgradeRequired?.('Upgrade to continue using AI chat without limits.')} />
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messagesLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
              <p className="text-xs text-slate-400">Loading conversation history...</p>
            </div>
          ) : !activeSession ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-slate-600" />
              <p className="text-slate-400 text-sm font-medium">Select or create a conversation thread in the sidebar</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-8 border border-dashed border-slate-800/80 rounded-2xl max-w-md mx-auto my-12">
              <Sparkles className="w-8 h-8 text-brand-400" />
              <h4 className="text-sm font-semibold text-white">Interactive Document Session Active</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ask questions regarding the document's contents, extract metadata, or request custom translations.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  } animate-in fade-in duration-250`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    msg.sender === 'user'
                      ? 'bg-brand-600/20 border border-brand-500/20 text-brand-400'
                      : 'bg-slate-900 border border-slate-800 text-slate-300'
                  }`}>
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Bubble + Source */}
                  <div className="flex flex-col">
                    <div className={`p-3.5 rounded-2xl text-sm border leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-brand-600/10 border-brand-500/20 text-slate-100 rounded-tr-none'
                        : 'bg-slate-900/60 border-slate-800/60 text-slate-200 rounded-tl-none'
                    }`}>
                      {msg.sender === 'ai' && msg.id === lastAnimatedMessageId ? (
                        <TypewriterText
                          text={msg.message}
                          isStopped={isTypingStopped}
                          onStop={handleTypingStop}
                          onComplete={() => {
                            setLastAnimatedMessageId(null);
                            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        />
                      ) : (
                        <div className="whitespace-pre-wrap font-sans">{msg.message}</div>
                      )}
                    </div>
                    {/* Source citation badge (AI messages only) */}
                    {msg.sender === 'ai' && (msg.source_page || msg.source_paragraph) && (
                      <SourceBadge
                        page={msg.source_page}
                        paragraph={msg.source_paragraph}
                        sourceText={msg.source_text}
                      />
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {sending && (
                <div className="flex gap-3 max-w-[85%] mr-auto animate-in fade-in duration-200">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="p-4 rounded-2xl rounded-tl-none bg-slate-900/60 border border-slate-800/60 text-slate-400 text-sm flex items-center gap-1.5 min-w-[60px] justify-center">
                    <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (sending || lastAnimatedMessageId !== null) {
              handleStop();
            } else {
              handleSendMessage(e);
            }
          }}
          className="p-4 border-t border-slate-800 bg-slate-900/20 flex gap-2 flex-shrink-0"
        >
          <input
            type="text"
            placeholder={
              isGuest && guestService.hasReachedLimit()
                ? 'Guest limit reached — create an account to continue...'
                : activeSession
                ? 'Ask a question about this document...'
                : 'Select a conversation thread to start chatting...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isInputDisabled}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 disabled:opacity-55 transition-colors text-sm"
          />
          {sending || lastAnimatedMessageId !== null ? (
            <button
              type="button"
              onClick={handleStop}
              className="px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 rounded-xl shadow-lg hover:shadow-red-900/20 font-semibold transition-all flex items-center justify-center animate-pulse"
              title="Stop"
            >
              <Square className="w-4 h-4 fill-red-400" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isInputDisabled || !inputText.trim()}
              className="px-4 py-3 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800/50 disabled:text-slate-500 text-white rounded-xl shadow-lg shadow-brand-900/10 hover:shadow-brand-900/20 font-semibold transition-all flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
