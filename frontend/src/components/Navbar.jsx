import React, { useState, useRef, useEffect } from 'react';
import { FileText, LogIn, UserPlus, LogOut, ChevronDown, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onBackToDocs, onShowAuth }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    onBackToDocs?.();
  };

  return (
    <header className="glass sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between border-b border-slate-800">
      {/* Brand */}
      <div
        className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={onBackToDocs}
      >
        <div className="bg-brand-600/20 p-2 rounded-xl border border-brand-500/30 flex items-center justify-center">
          <FileText className="w-6 h-6 text-brand-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white m-0 p-0 text-left leading-tight">
            DocuMind <span className="text-brand-400 font-medium text-sm">AI</span>
          </h1>
          <p className="text-xs text-slate-400 font-light">Interactive Document Assistant</p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          /* ── Logged in: avatar dropdown ── */
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all"
            >
              <div className="w-7 h-7 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
                <User className="w-4 h-4 text-brand-400" />
              </div>
              <span className="text-sm font-medium text-slate-200 max-w-[120px] truncate">
                {user?.username}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 glass rounded-xl border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-slate-800/80">
                  <p className="text-xs text-slate-400">Signed in as</p>
                  <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
                  {user?.email && (
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ── Guest: login + signup buttons ── */
          <>
            <button
              onClick={() => onShowAuth?.('login')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl bg-slate-900/40 hover:bg-slate-900/70 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              onClick={() => onShowAuth?.('signup')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-md shadow-brand-900/20 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Sign Up
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
