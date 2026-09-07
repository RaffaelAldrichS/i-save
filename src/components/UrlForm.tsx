'use client';

import React, { useState } from 'react';
import { ArrowRight, Clipboard, Loader2, Play, Video, Share2, Globe } from 'lucide-react';

interface UrlFormProps {
  onExtract: (url: string) => void;
  isLoading: boolean;
}

export const UrlForm: React.FC<UrlFormProps> = ({ onExtract, isLoading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onExtract(url.trim());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
      }
    } catch {
      // Clipboard access denied or unsupported
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 p-1.5 focus-within:border-zinc-900 dark:focus-within:border-zinc-400 focus-within:ring-1 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-400 transition-all">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Tempel link video (YouTube, TikTok, Instagram, Facebook)..."
            required
            disabled={isLoading}
            className="w-full px-3.5 py-2.5 bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none text-sm font-sans"
          />

          <div className="flex items-center gap-2 pr-1">
            {!url && (
              <button
                type="button"
                onClick={handlePaste}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-2 text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                <Clipboard className="w-3.5 h-3.5" /> Tempel
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium rounded-lg text-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Proses
                </>
              ) : (
                <>
                  Download <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Platform Indicators */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500 font-mono">
        <span className="text-zinc-400 font-sans">Platform:</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
          <Play className="w-3 h-3 text-red-500" /> YouTube
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
          <Video className="w-3 h-3 text-cyan-500" /> TikTok (No WM)
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
          <Share2 className="w-3 h-3 text-pink-500" /> Instagram
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
          <Globe className="w-3 h-3 text-blue-500" /> Facebook
        </span>
      </div>
    </div>
  );
};
