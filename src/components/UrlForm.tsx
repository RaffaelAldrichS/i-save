'use client';

import React, { useState } from 'react';
import { Link as LinkIcon, ArrowRight, Loader2, Clipboard, X, Shield, Zap, Gift } from 'lucide-react';

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
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) setUrl(text.trim());
      }
    } catch {
      // Permission denied or unavailable
    }
  };

  return (
    <div id="downloader" className="w-full">
      {/* Downloader Input Container */}
      <form
        onSubmit={handleSubmit}
        className="w-full bg-surface p-2 sm:p-2.5 rounded-2xl border border-transparent shadow-card hover:border-border-hover transition-colors flex flex-col sm:flex-row gap-2 items-stretch"
      >
        <div className="relative flex-1 flex items-center min-h-[52px]">
          <div className="pl-3.5 pr-2 text-text-muted">
            <LinkIcon className="w-5 h-5 stroke-[2]" aria-hidden="true" />
          </div>

          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Tempelkan tautan media di sini..."
            aria-label="Tempelkan tautan media YouTube, TikTok, Instagram, atau Facebook"
            required
            disabled={isLoading}
            className="flex-1 bg-transparent text-text text-sm sm:text-base font-medium placeholder:text-text-muted/60 focus:outline-none pr-10"
          />

          {url ? (
            <button
              type="button"
              onClick={() => setUrl('')}
              aria-label="Bersihkan input"
              className="absolute right-3 p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-soft transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePaste}
              title="Tempel dari Clipboard"
              aria-label="Tempel dari Clipboard"
              className="absolute right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-soft text-text-muted hover:text-primary hover:bg-primary-soft transition-colors cursor-pointer"
            >
              <Clipboard className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Tempel</span>
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="px-6 py-3.5 rounded-xl font-bold text-base bg-primary text-surface hover:bg-primary-hover active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0 min-h-[52px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <span>Unduh</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      {/* Hero Trust Microcopy */}
      <div className="flex items-center justify-center sm:justify-start gap-6 mt-3.5 px-2 text-xs font-medium text-text-muted">
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-secondary" aria-hidden="true" />
          Aman
        </span>
        <span className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-secondary" aria-hidden="true" />
          Cepat
        </span>
        <span className="flex items-center gap-1.5">
          <Gift className="w-3.5 h-3.5 text-secondary" aria-hidden="true" />
          Gratis
        </span>
      </div>
    </div>
  );
};
