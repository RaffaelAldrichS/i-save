"use client";

import React, { useState } from "react";
import { X, Bookmark, Copy, Check, Sparkles } from "lucide-react";

interface BookmarkletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookmarkletModal: React.FC<BookmarkletModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const bookmarkletCode = `javascript:(function(){var u=location.href;window.open('https://isave.app/?url='+encodeURIComponent(u),'_blank');})();`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(bookmarkletCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore copy error
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bookmarklet-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-surface border border-border rounded-3xl p-6 shadow-2xl space-y-5 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup modal Bookmarklet"
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-xl text-text-muted hover:text-text hover:bg-surface-soft transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1.5 pt-2">
          <div className="w-10 h-10 rounded-2xl bg-accent-soft text-primary flex items-center justify-center mb-2">
            <Bookmark className="w-5 h-5 text-secondary" />
          </div>
          <h2 id="bookmarklet-title" className="font-extrabold text-xl text-primary">
            Pintasan Bookmarklet Browser PC
          </h2>
          <p className="text-xs text-text-muted">
            Unduh video saat menonton di YouTube/TikTok/Instagram cukup dengan 1-klik dari Bar Bookmark Browser Anda.
          </p>
        </div>

        <div className="p-4 bg-surface-soft border border-border rounded-2xl space-y-3">
          <p className="text-xs font-bold text-text uppercase tracking-wider">
            Langkah Pemasangan:
          </p>
          <ol className="text-xs text-text-muted space-y-2 list-decimal list-inside font-medium">
            <li>Tarik tombol hijau di bawah ini langsung ke <strong>Bookmark Bar</strong> browser (Ctrl+Shift+B).</li>
            <li>Saat membuka video YouTube, TikTok, atau Instagram, klik bookmarklet <strong>Save with iSAVE</strong>!</li>
          </ol>

          {/* Drag to Bookmarks Button */}
          <div className="pt-2 text-center">
            <a
              href={bookmarkletCode}
              onClick={(e) => e.preventDefault()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-xs bg-accent text-primary border border-accent-dark hover:bg-accent-dark shadow-sm transition-all cursor-grab active:cursor-grabbing"
              title="Tarik tombol ini ke Bookmark Bar browser Anda"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span>⚡ Save with iSAVE</span>
            </a>
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={handleCopyCode}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-surface-soft border border-border hover:border-secondary text-primary flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-secondary" />
                <span>Kode Javascript Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-secondary" />
                <span>Salin Kode Bookmarklet Manual</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
