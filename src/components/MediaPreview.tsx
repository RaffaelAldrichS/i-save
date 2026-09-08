'use client';

import React, { useState } from 'react';
import { MediaMetadata } from '@/types/media';
import { Download, Film, Music, User, Clock, AlertCircle, Loader2, Sparkles, CheckCircle2, ChevronLeft, ChevronRight, Image as ImageIcon, Layers } from 'lucide-react';
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
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

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
        {/* Media Thumbnail & Interactive Carousel */}
        <div
          tabIndex={metadata.images && metadata.images.length > 1 ? 0 : -1}
          onKeyDown={(e) => {
            if (!metadata.images || metadata.images.length <= 1) return;
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              setCurrentSlideIndex((prev) => (prev === 0 ? metadata.images!.length - 1 : prev - 1));
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              setCurrentSlideIndex((prev) => (prev + 1) % metadata.images!.length);
            }
          }}
          aria-label={metadata.images && metadata.images.length > 1 ? 'Pratinjau Carousel (Gunakan Panah Kiri/Kanan untuk Navigasi)' : 'Pratinjau Media'}
          className="relative w-full sm:w-56 aspect-video rounded-xl overflow-hidden bg-surface-soft border border-border shrink-0 shadow-xs group focus:outline-none focus:ring-2 focus:ring-secondary/50"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              metadata.images && metadata.images.length > 0
                ? metadata.images[currentSlideIndex % metadata.images.length] || metadata.thumbnail
                : metadata.thumbnail
            }
            alt={metadata.title}
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== metadata.thumbnail) {
                target.src = metadata.thumbnail;
              }
            }}
            className="w-full h-full object-cover transition-all duration-300"
          />

          {metadata.images && metadata.images.length > 1 && (
            <>
              <span className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-xs text-[11px] font-semibold text-white flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-secondary" />
                Slide {currentSlideIndex + 1} / {metadata.images.length}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlideIndex((prev) =>
                    prev === 0 ? metadata.images!.length - 1 : prev - 1
                  );
                }}
                aria-label="Slide Sebelumnya"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-opacity opacity-90 sm:opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlideIndex((prev) => (prev + 1) % metadata.images!.length);
                }}
                aria-label="Slide Selanjutnya"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-opacity opacity-90 sm:opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

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
                {typeof metadata.author === 'string' ? metadata.author : (metadata.author.displayName || metadata.author.username || '')}
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
      <div className="pt-2 space-y-4">
        {/* Main Formats Section */}
        <div className="space-y-3">
          <h3 className="font-bold text-xs sm:text-sm text-text-muted uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-secondary" />
            Format Utama
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {metadata.formats
              .filter((fmt) => !fmt.id.includes('slide-'))
              .map((fmt) => {
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
                        ) : fmt.type === 'gallery' || fmt.ext === 'zip' ? (
                          <Layers className="w-4 h-4" aria-hidden="true" />
                        ) : fmt.type === 'image' || fmt.ext === 'jpg' ? (
                          <ImageIcon className="w-4 h-4" aria-hidden="true" />
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

        {/* Individual Slide Formats Section (For Carousels) */}
        {metadata.formats.some((fmt) => fmt.id.includes('slide-')) && (
          <div className="space-y-3 pt-3 border-t border-border/60">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs sm:text-sm text-text-muted uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-secondary" />
                Unduh Slide Spesifik
              </h3>
              <span className="text-xs font-medium text-text-muted">
                {metadata.formats.filter((f) => f.id.includes('slide-')).length} Slide Tersedia
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto p-1 pr-2 rounded-xl bg-surface-soft/50 border border-border/60 scrollbar-thin">
              {metadata.formats
                .filter((fmt) => fmt.id.includes('slide-'))
                .map((fmt, idx) => {
                  const isProcessing = isProcessingFormat === fmt.id;
                  const isCurrentSlide = currentSlideIndex === idx;
                  return (
                    <button
                      key={fmt.id}
                      onClick={() => {
                        setCurrentSlideIndex(idx);
                        onDownloadFormat(fmt.id);
                      }}
                      disabled={Boolean(isProcessingFormat)}
                      aria-label={`Unduh ${fmt.quality}`}
                      className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer group text-xs ${
                        isCurrentSlide
                          ? 'border-secondary bg-accent-soft/40 text-primary font-bold shadow-xs'
                          : 'border-border bg-surface hover:border-secondary/40 text-text font-medium'
                      }`}
                    >
                      <span className="truncate">Slide {idx + 1}</span>
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-secondary shrink-0" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-text-muted group-hover:text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
