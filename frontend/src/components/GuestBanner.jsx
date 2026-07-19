import React from 'react';
import { Zap, MessageSquare } from 'lucide-react';
import { guestService } from '../services/api';

const GuestBanner = ({ onUpgrade }) => {
  const total = guestService.getLimit();
  const remaining = guestService.getRemainingMessages();
  const used = total - remaining;
  const progressPct = Math.round((used / total) * 100);
  const isNearLimit = remaining <= 1;
  const isAtLimit = remaining === 0;

  return (
    <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 text-sm transition-all ${
      isAtLimit
        ? 'bg-red-500/10 border-red-500/30'
        : isNearLimit
        ? 'bg-amber-500/10 border-amber-500/30'
        : 'bg-brand-500/8 border-brand-500/20'
    }`}>
      {/* Icon */}
      <div className={`p-1.5 rounded-lg flex-shrink-0 ${
        isAtLimit ? 'bg-red-500/20' : isNearLimit ? 'bg-amber-500/20' : 'bg-brand-500/15'
      }`}>
        <MessageSquare className={`w-4 h-4 ${
          isAtLimit ? 'text-red-400' : isNearLimit ? 'text-amber-400' : 'text-brand-400'
        }`} />
      </div>

      {/* Text + progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className={`text-xs font-semibold ${
            isAtLimit ? 'text-red-300' : isNearLimit ? 'text-amber-300' : 'text-slate-200'
          }`}>
            {isAtLimit
              ? 'Guest limit reached'
              : `${remaining} free message${remaining !== 1 ? 's' : ''} remaining`}
          </p>
          <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">{used}/{total} used</span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-brand-500'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Upgrade CTA */}
      <button
        onClick={onUpgrade}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold transition-all flex-shrink-0 whitespace-nowrap shadow-md shadow-brand-900/20"
      >
        <Zap className="w-3 h-3" />
        Upgrade
      </button>
    </div>
  );
};

export default GuestBanner;
