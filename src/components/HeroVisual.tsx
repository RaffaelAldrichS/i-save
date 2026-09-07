import React from 'react';
import { Download, Film, Music, CheckCircle2, Play, Sparkles } from 'lucide-react';
import { YoutubeIcon } from './BrandIcons';

export const HeroVisual: React.FC = () => {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none flex items-center justify-center py-4 select-none">
      {/* Background Soft Glow & Ambient Circles */}
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 via-primary-soft/60 to-transparent rounded-3xl blur-2xl -z-10 transform scale-95" />

      {/* Main Container Card (Browser / App Mockup) */}
      <div className="w-full bg-surface border border-border rounded-2xl shadow-card p-4 sm:p-5 relative space-y-4">
        {/* Mock Window Top Bar */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
          </div>
          <div className="px-3 py-1 bg-surface-soft rounded-full text-[11px] font-semibold text-text-muted flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            isave.app / download
          </div>
          <div className="w-12" />
        </div>

        {/* Media Preview Mockup */}
        <div className="relative rounded-xl overflow-hidden bg-primary-soft/40 border border-border/80 aspect-[16/9] flex items-center justify-center group">
          {/* Mock thumbnail gradient with play icon */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/30 to-transparent flex flex-col justify-end p-4 text-surface">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-surface/20 backdrop-blur-sm text-[10px] font-bold tracking-wide uppercase text-surface flex items-center gap-1">
                <YoutubeIcon className="w-3 h-3 text-red-400" /> YouTube
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/80 text-[10px] font-bold text-surface">
                1080p Full HD
              </span>
            </div>
            <p className="font-bold text-sm sm:text-base line-clamp-1">
              Tutorial Membuat Web App Modern dengan React & Next.js
            </p>
          </div>

          {/* Play Icon Badge */}
          <div className="w-12 h-12 rounded-full bg-surface/90 text-primary shadow-lg flex items-center justify-center pl-1 group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-current stroke-none" />
          </div>
        </div>

        {/* Format Selector Mockup */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="p-3 rounded-xl border border-secondary/30 bg-accent-soft/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent text-primary flex items-center justify-center">
                <Film className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary">MP4 Video</p>
                <p className="text-[10px] text-text-muted font-medium">1080p • 48 MB</p>
              </div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-secondary" />
          </div>

          <div className="p-3 rounded-xl border border-border bg-surface-soft/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-text">MP3 Audio</p>
                <p className="text-[10px] text-text-muted font-medium">320kbps • 4 MB</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Badge 1: Instant Download */}
      <div className="absolute -top-3 -right-2 sm:-top-4 sm:-right-4 bg-surface border border-border shadow-card rounded-2xl p-3 flex items-center gap-3 animate-bounce-slow">
        <div className="w-9 h-9 rounded-xl bg-accent text-primary flex items-center justify-center">
          <Download className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-primary">Siap Diunduh</p>
          <p className="text-[10px] font-medium text-text-muted">Proses super cepat</p>
        </div>
      </div>

      {/* Floating Badge 2: No Watermark */}
      <div className="absolute -bottom-3 -left-2 sm:-bottom-4 sm:-left-4 bg-surface border border-border shadow-card rounded-2xl p-2.5 px-3.5 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-secondary" />
        <span className="text-xs font-bold text-primary">Tanpa Watermark</span>
      </div>
    </div>
  );
};
