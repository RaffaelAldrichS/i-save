'use client';

import React from 'react';
import { MediaMetadata } from '@/types/media';
import { Download, Film, Music, User, Clock, AlertCircle } from 'lucide-react';

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
  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-red-500/40 text-red-600 dark:text-red-400 flex items-start gap-3 text-sm">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Gagal Memproses Link</p>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!metadata) return null;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {/* Thumbnail */}
        <div className="relative w-full sm:w-44 aspect-video rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 border border-zinc-200 dark:border-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={metadata.thumbnail}
            alt={metadata.title}
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-zinc-900/90 text-white text-[10px] font-mono uppercase tracking-wider">
            {metadata.platform}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-1.5 flex-1">
          <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-tight">
            {metadata.title}
          </h3>

          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 pt-1 font-sans">
            {metadata.author && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> {metadata.author}
              </span>
            )}
            {metadata.duration && (
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5" /> {Math.floor(metadata.duration / 60)}:
                {String(metadata.duration % 60).padStart(2, '0')}
              </span>
            )}
          </div>
        </div>
      </div>

      <hr className="border-zinc-200 dark:border-zinc-800" />

      {/* Formats */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Pilihan Format File
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {metadata.formats.map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => onDownloadFormat(fmt.id)}
              disabled={isProcessingFormat === fmt.id}
              className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100 bg-zinc-50 dark:bg-zinc-950/50 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-900 transition-colors">
                  {fmt.type === 'audio' ? <Music className="w-4 h-4" /> : <Film className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    {fmt.quality}
                  </p>
                  <p className="text-[11px] font-mono text-zinc-500 uppercase">
                    {fmt.ext} {fmt.requiresMerge ? '• HD Merge' : ''}
                  </p>
                </div>
              </div>

              <div className="p-1.5 rounded-lg text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                <Download className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
