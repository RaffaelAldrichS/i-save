'use client';

import React, { useState } from 'react';
import { MediaMetadata } from '@/types/media';
import {
  Link as LinkIcon,
  ArrowRight,
  Loader2,
  Clipboard,
  X,
  Shield,
  Zap,
  Gift,
  Film,
  Music,
  User,
  Clock,
  AlertCircle,
  Download,
  CheckCircle2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { YoutubeIcon, TiktokIcon, InstagramIcon, FacebookIcon } from './BrandIcons';

interface DownloaderWorkspaceProps {
  onExtract: (url: string) => void;
  isLoading: boolean;
  metadata: MediaMetadata | null;
  error?: string | null;
  onDownloadFormat: (formatId: string) => void;
  isProcessingFormat?: string | null;
}

export const DownloaderWorkspace: React.FC<DownloaderWorkspaceProps> = ({
  onExtract,
  isLoading,
  metadata,
  error,
  onDownloadFormat,
  isProcessingFormat,
}) => {
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
      // Clipboard permission denied or unavailable
    }
  };

  const getPlatformIcon = (platformName: string) => {
    const lower = platformName.toLowerCase();
    if (lower.includes('youtube')) return <YoutubeIcon className="w-4 h-4" />;
    if (lower.includes('tiktok')) return <TiktokIcon className="w-4 h-4" />;
    if (lower.includes('instagram')) return <InstagramIcon className="w-4 h-4" />;
    if (lower.includes('facebook')) return <FacebookIcon className="w-4 h-4" />;
    return null;
  };

  return (
    <div
      id="downloader"
      className="w-full bg-surface border border-border rounded-3xl p-4 sm:p-6 lg:p-8 shadow-card space-y-6 transition-all"
    >
      {/* 1. URL INPUT FORM */}
      <form onSubmit={handleSubmit} className="w-full space-y-3">
        <div className="relative flex flex-col sm:flex-row items-stretch gap-2 bg-surface-soft p-2 rounded-2xl border border-border focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 transition-all">
          <div className="relative flex-1 flex items-center min-h-[52px]">
            <div className="pl-3.5 pr-2.5 text-text-muted select-none">
              <LinkIcon className="w-5 h-5 stroke-[2]" aria-hidden="true" />
            </div>

            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Tempelkan tautan YouTube, TikTok, Instagram, atau Facebook..."
              aria-label="Tautan media sosial untuk diunduh"
              required
              disabled={isLoading}
              autoComplete="off"
              spellCheck={false}
              className="flex-1 bg-transparent text-text text-sm sm:text-base font-medium placeholder:text-text-muted/60 focus:outline-none pr-10 min-w-0"
            />

            {url ? (
              <button
                type="button"
                onClick={() => setUrl('')}
                aria-label="Bersihkan input"
                className="absolute right-3 p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePaste}
                title="Tempel dari Clipboard"
                aria-label="Tempel dari Clipboard"
                className="absolute right-3 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-surface text-text-muted hover:text-primary hover:bg-primary-soft transition-colors cursor-pointer border border-border/80"
              >
                <Clipboard className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden xs:inline">Tempel</span>
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
                <span>Ekstrak</span>
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </>
            )}
          </button>
        </div>

        {/* Microcopy Trust Badges */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 px-1 text-xs font-medium text-text-muted">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-secondary" aria-hidden="true" />
            100% Aman & Stateless
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-secondary" aria-hidden="true" />
            Proses Instan
          </span>
          <span className="flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5 text-secondary" aria-hidden="true" />
            Tanpa Watermark
          </span>
        </div>
      </form>

      {/* 2. DYNAMIC WORKSPACE CONTENT AREA */}
      <div className="border-t border-border/70 pt-6">
        {/* State A: Loading / Extraction Spinner */}
        {isLoading && (
          <div className="w-full py-10 px-4 text-center flex flex-col items-center justify-center space-y-3 animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-secondary" aria-hidden="true" />
            </div>
            <p className="font-bold text-base text-text">Mengekstraksi Informasi Media...</p>
            <p className="text-xs text-text-muted">Menganalisis format video dan audio yang tersedia</p>
          </div>
        )}

        {/* State B: Error Alert */}
        {!isLoading && error && (
          <div
            role="alert"
            aria-live="assertive"
            className="w-full bg-error-bg border border-error-border rounded-2xl p-5 text-error flex items-start gap-3.5 shadow-sm"
          >
            <div className="p-2 rounded-xl bg-error/10 text-error shrink-0">
              <AlertCircle className="w-5 h-5 stroke-[2]" aria-hidden="true" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-bold text-base text-error">Gagal Mengekstraksi Media</h3>
              <p className="text-sm text-error/90 font-medium leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={() => url && onExtract(url)}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-error hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Coba Lagi
              </button>
            </div>
          </div>
        )}

        {/* State C: Empty Placeholder */}
        {!isLoading && !error && !metadata && (
          <div className="w-full bg-surface-soft/60 border border-dashed border-border rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[160px]">
            <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-2.5">
              <Film className="w-5 h-5 text-secondary" aria-hidden="true" />
            </div>
            <p className="font-bold text-sm text-text">Pratinjau Hasil Media</p>
            <p className="text-xs text-text-muted mt-1 max-w-sm">
              Tempelkan URL media di atas dan klik Ekstrak untuk memilih opsi unduhan.
            </p>
          </div>
        )}

        {/* State D: Success Metadata & Formats */}
        {!isLoading && !error && metadata && (
          <div className="w-full space-y-6">
            {/* Header Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-soft text-primary text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                  Media Siap Diunduh
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-soft border border-border text-xs font-bold text-text">
                {getPlatformIcon(metadata.platform)}
                <span className="capitalize">{metadata.platform}</span>
              </span>
            </div>

            {/* Thumbnail & Video Info */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
              <div className="relative w-full sm:w-52 aspect-video rounded-2xl overflow-hidden bg-surface-soft border border-border shrink-0 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={metadata.thumbnail}
                  alt={metadata.title}
                  className="w-full h-full object-cover"
                />
                {metadata.duration ? (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[11px] font-mono font-medium text-white flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.floor(metadata.duration / 60)}:
                    {String(metadata.duration % 60).padStart(2, '0')}
                  </span>
                ) : null}
              </div>

              <div className="flex-1 space-y-2 min-w-0">
                <h2 className="font-bold text-base sm:text-lg text-text leading-snug line-clamp-2">
                  {metadata.title}
                </h2>

                <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-text-muted">
                  {metadata.author && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-soft border border-border/60">
                      <User className="w-3.5 h-3.5 text-secondary" aria-hidden="true" />
                      {metadata.author}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-soft border border-border/60">
                    <Sparkles className="w-3.5 h-3.5 text-secondary" aria-hidden="true" />
                    {metadata.formats.length} Opsi Format
                  </span>
                </div>
              </div>
            </div>

            {/* Format Selection Grid */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-text-muted uppercase tracking-wider">
                Pilihan Format Unduhan
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {metadata.formats.map((fmt) => {
                  const isProcessing = isProcessingFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      onClick={() => onDownloadFormat(fmt.id)}
                      disabled={Boolean(isProcessingFormat)}
                      aria-label={`Unduh ${fmt.quality} ${fmt.ext}`}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface hover:bg-surface-soft hover:border-secondary/40 transition-all text-left cursor-pointer group disabled:opacity-60 disabled:cursor-wait"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center group-hover:bg-accent transition-colors shrink-0">
                          {fmt.type === 'audio' ? (
                            <Music className="w-4 h-4" aria-hidden="true" />
                          ) : (
                            <Film className="w-4 h-4" aria-hidden="true" />
                          )}
                        </div>
                        <div className="min-w-0 truncate">
                          <p className="font-bold text-sm text-text group-hover:text-primary transition-colors truncate">
                            {fmt.quality}
                          </p>
                          <p className="text-xs text-text-muted font-medium uppercase">
                            {fmt.ext} {fmt.requiresMerge ? '• HD Merge' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="px-3.5 py-2 rounded-lg bg-primary text-surface text-xs font-bold group-hover:bg-primary-hover transition-colors flex items-center gap-1.5 shrink-0 ml-2">
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                            <span>Proses</span>
                          </>
                        ) : (
                          <>
                            <span>Unduh</span>
                            <Download className="w-3.5 h-3.5" aria-hidden="true" />
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
