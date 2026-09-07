'use client';

import React from 'react';
import { MediaMetadata } from '@/types/media';
import { Download, Film, Music, User, Clock, AlertCircle, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { YoutubeIcon, TiktokIcon, InstagramIcon, FacebookIcon } from './BrandIcons';

interface MediaPreviewProps {
  metadata: MediaMetadata | null;
  error?: string | null;
  onDownloadFormat: (formatId: string) => void;
  isProcessingFormat?: string | null;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  metadata,
  error,
  onDownloadFormat,
  isProcessingFormat,
}) => {
  const getPlatformIcon = (platformName: string) => {
    const lower = platformName.toLowerCase();
    if (lower.includes('youtube')) return <YoutubeIcon className="w-3.5 h-3.5 text-red-600" />;
    if (lower.includes('tiktok')) return <TiktokIcon className="w-3.5 h-3.5 text-text" />;
    if (lower.includes('instagram')) return <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />;
    if (lower.includes('facebook')) return <FacebookIcon className="w-3.5 h-3.5 text-blue-600" />;
    return null;
  };

  if (error) {
    return (
      <div 
        role="alert" 
        aria-live="assertive" 
        className="w-full bg-error-bg border border-error-border rounded-2xl p-5 text-error flex items-start gap-3.5 shadow-sm"
      >
        <div className="p-2 rounded-xl bg-error/10 text-error shrink-0">
          <AlertCircle className="w-5 h-5 stroke-[2]" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-base text-error">Link tidak dapat diproses.</h3>
          <p className="text-sm text-error/90 font-medium">
            {error || 'Coba periksa kembali tautan atau gunakan platform yang didukung.'}
          </p>
        </div>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="w-full bg-surface border border-dashed border-border rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[220px] shadow-subtle hover:border-border-hover transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-surface-soft text-primary-soft flex items-center justify-center mb-3">
          <Film className="w-6 h-6 text-secondary" aria-hidden="true" />
        </div>
        <h3 className="font-bold text-base text-text">Pratinjau media akan muncul di sini</h3>
        <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-sm">
          Tempelkan URL media di atas untuk melihat pratinjau dan memilih format unduhan.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-card space-y-6">
      {/* Top Header / Result Overview */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-soft text-primary text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
            Media Siap Diunduh
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-soft border border-border text-xs font-semibold text-text">
          {getPlatformIcon(metadata.platform)}
          {metadata.platform}
        </span>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        {/* Media Thumbnail */}
        <div className="relative w-full sm:w-56 aspect-video rounded-xl overflow-hidden bg-surface-soft border border-border shrink-0 shadow-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={metadata.thumbnail}
            alt={metadata.title}
            className="w-full h-full object-cover"
          />
          {metadata.duration ? (
            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[11px] font-mono font-medium text-white flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {Math.floor(metadata.duration / 60)}:{String(metadata.duration % 60).padStart(2, '0')}
            </span>
          ) : null}
        </div>

        {/* Media Metadata Details */}
        <div className="flex-1 space-y-2.5">
          <h2 className="font-bold text-lg sm:text-xl text-text leading-snug line-clamp-2">
            {metadata.title}
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-text-muted">
            {metadata.author && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-soft border border-border/60">
                <User className="w-3.5 h-3.5 text-secondary" aria-hidden="true" />
                {metadata.author}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-soft border border-border/60">
              <Sparkles className="w-3.5 h-3.5 text-secondary" aria-hidden="true" />
              {metadata.formats.length} Pilihan Format
            </span>
          </div>
        </div>
      </div>

      {/* Format Selection Grid */}
      <div className="pt-2 space-y-3">
        <h3 className="font-bold text-sm text-text-muted uppercase tracking-wider">
          Pilih Format Unduhan
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {metadata.formats.map((fmt) => {
            const isProcessing = isProcessingFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                onClick={() => onDownloadFormat(fmt.id)}
                disabled={Boolean(isProcessingFormat)}
                aria-label={`Unduh ${fmt.quality} ${fmt.ext}${fmt.requiresMerge ? ' • HD Merge' : ''}`}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface hover:bg-surface-soft hover:border-secondary/40 transition-all text-left cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center group-hover:bg-accent transition-colors">
                    {fmt.type === 'audio' ? (
                      <Music className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Film className="w-4 h-4" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-text group-hover:text-primary transition-colors">
                      {fmt.quality}
                    </p>
                    <p className="text-xs text-text-muted font-medium">
                      {fmt.ext.toUpperCase()} {fmt.requiresMerge ? '• HD Merge' : ''}
                    </p>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-lg bg-primary text-surface text-xs font-bold group-hover:bg-primary-hover transition-colors flex items-center gap-1.5 shrink-0">
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      <span>Memproses</span>
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
  );
};
