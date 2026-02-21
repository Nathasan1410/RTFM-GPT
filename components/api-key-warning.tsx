'use client';

import { useState } from 'react';
import { AlertCircle, X, Settings } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import Link from 'next/link';

export function ApiKeyWarningBanner() {
  const { apiKeys } = useAppStore();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('rtfm_api_warning_dismissed') === 'true';
  });

  const hasGroqOrCerebras = Boolean(apiKeys.groq || apiKeys.cerebras);
  const hasBrave = Boolean(apiKeys.brave);

  if (dismissed) return null;
  if (hasGroqOrCerebras && hasBrave) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('rtfm_api_warning_dismissed', 'true');
  };

  const getWarningMessage = () => {
    if (!hasGroqOrCerebras && !hasBrave) {
      return 'To get started, add at least one AI API key (Groq or Cerebras) and Brave Search API key in Settings.';
    }
    if (!hasGroqOrCerebras) {
      return 'Add an AI API key (Groq or Cerebras) to enable roadmap generation and AI features.';
    }
    if (!hasBrave) {
      return 'Add Brave Search API key to enhance chatbot responses with web search results.';
    }
    return '';
  };

  return (
    <div className="fixed top-16 left-0 right-0 z-50 bg-amber-950/80 backdrop-blur-sm border-b border-amber-800/50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-100">
            {getWarningMessage()}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-400 text-black rounded-sm transition-colors"
          >
            <Settings className="w-3 h-3" />
            Settings
          </Link>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-amber-800/50 rounded-sm transition-colors text-amber-200 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
