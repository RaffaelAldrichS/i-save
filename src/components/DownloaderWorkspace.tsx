"use client";

import React, { useState } from "react";
import { MediaMetadata } from "@/types/media";
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
  QrCode,
  Bookmark,
  Play,
  ExternalLink,
} from "lucide-react";
import {
  YoutubeIcon,
  TiktokIcon,
  InstagramIcon,
  FacebookIcon,
  TwitterIcon,
  RedditIcon,
  ThreadsIcon,
  PinterestIcon,
} from "./BrandIcons";
import { QrCodeModal } from "./QrCodeModal";
import { BookmarkletModal } from "./BookmarkletModal";

export async function handleClipboardPaste(
  clipboardObj?: Clipboard,
): Promise<{ url: string | null; error: string | null }> {
  try {
    const cb =
      clipboardObj ||
      (typeof navigator !== "undefined" ? navigator.clipboard : undefined);
    if (cb) {
      const text = await cb.readText();
      if (text && text.trim()) {
        return { url: text.trim(), error: null };
      }
      return { url: null, error: "Papan klip (clipboard) kosong" };
    }
    return { url: null, error: "Clipboard tidak didukung peramban ini" };
  } catch {
    return {
      url: null,
      error: "Izin clipboard ditolak. Silakan tempel manual (Ctrl+V)",
    };
  }
}

interface DownloaderWorkspaceProps {
  onExtract: (url: string) => void;
  isLoading: boolean;
  metadata: MediaMetadata | null;
  error?: string | null;
  downloadError?: string | null;
  onDownloadFormat: (formatId: string) => void;
  isProcessingFormat?: string | null;
  downloadProgress?: { percent: number; stageText: string } | null;
  lastDownloadUrl?: string | null;
  lastFilename?: string | null;
}

export const DownloaderWorkspace: React.FC<DownloaderWorkspaceProps> = ({
  onExtract,
  isLoading,
  metadata,
  error,
  downloadError,
  onDownloadFormat,
  isProcessingFormat,
  downloadProgress,
  lastDownloadUrl,
  lastFilename,
}) => {
  const [url, setUrl] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isBookmarkletOpen, setIsBookmarkletOpen] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isTrimmerActive, setIsTrimmerActive] = useState(false);
  const [trimStart, setTrimStart] = useState("00:00");
  const [trimEnd, setTrimEnd] = useState("00:30");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setPasteError(null);
    setIsPlayingPreview(false);
    onExtract(url.trim());
  };

  const handlePaste = async () => {
    setPasteError(null);
    const res = await handleClipboardPaste();
    if (res.url) {
      setUrl(res.url);
    } else if (res.error) {
      setPasteError(res.error);
    }
  };

  const BRAND_ICONS: Record<string, React.FC<{ className?: string }>> = {
    youtube: YoutubeIcon,
    tiktok: TiktokIcon,
    instagram: InstagramIcon,
    facebook: FacebookIcon,
    twitter: TwitterIcon,
    reddit: RedditIcon,
    threads: ThreadsIcon,
    pinterest: PinterestIcon,
  };

  const getPlatformIcon = (platformName: string) => {
    const Icon = BRAND_ICONS[platformName.toLowerCase()];
    if (Icon) return <Icon className="w-4 h-4" />;
    return <Film className="w-4 h-4 text-secondary" />;
  };

  return (
    <div
      id="downloader"
      className="w-full bg-surface border border-border rounded-3xl p-4 sm:p-6 lg:p-8 shadow-card space-y-6 transition-all"
    >
      {/* Modals */}
      <QrCodeModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        downloadUrl={lastDownloadUrl || "/"}
        filename={lastFilename || "media.mp4"}
      />
      <BookmarkletModal
        isOpen={isBookmarkletOpen}
        onClose={() => setIsBookmarkletOpen(false)}
      />

      {/* 1. URL INPUT FORM */}
      <form onSubmit={handleSubmit} className="w-full space-y-3">
        <label htmlFor="url-input" className="sr-only">
          Tautan media sosial YouTube, TikTok, Instagram, atau Facebook
        </label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const text = e.dataTransfer.getData("text");
            if (text && text.trim()) {
              setUrl(text.trim());
              setPasteError(null);
              onExtract(text.trim());
            }
          }}
          className={`relative flex flex-col sm:flex-row items-stretch gap-2 bg-surface-soft p-2 rounded-2xl border transition-all ${
            isDragging
              ? "border-secondary ring-2 ring-secondary/30 bg-accent/10"
              : error
              ? "border-error ring-1 ring-error/20"
              : "border-transparent"
          } focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20`}
        >
          <div className="relative flex-1 flex items-center min-h-[52px]">
            <div className="pl-3.5 pr-2.5 text-text-muted select-none">
              <LinkIcon className="w-5 h-5 stroke-[2]" aria-hidden="true" />
            </div>

            <input
              id="url-input"
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (pasteError) setPasteError(null);
              }}
              placeholder="Tempelkan tautan YouTube, TikTok, Instagram, atau Facebook..."
              aria-label="Tautan media sosial untuk diunduh"
              aria-describedby={error || pasteError ? "workspace-error" : undefined}
              required
              disabled={isLoading}
              autoComplete="off"
              spellCheck={false}
              className="flex-1 bg-transparent text-text text-sm sm:text-base font-medium placeholder:text-text-muted/80 focus:outline-none pr-10 min-w-0"
            />

            {url ? (
              <button
                type="button"
                onClick={() => setUrl("")}
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
                className="absolute right-3 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-surface text-text-muted hover:text-primary hover:bg-primary-soft transition-colors cursor-pointer"
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

        {/* Paste Error Toast/Message */}
        {pasteError && (
          <div id="workspace-error" className="text-xs text-error font-medium px-1 flex items-center gap-1.5" role="alert">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{pasteError}</span>
          </div>
        )}

        {/* Microcopy Trust Badges & Action Shortcuts */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-1 text-xs font-medium text-text-muted">
          <div className="flex flex-wrap items-center gap-4">
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

          <button
            type="button"
            onClick={() => setIsBookmarkletOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-soft border border-border hover:border-secondary text-primary font-bold transition-all cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5 text-secondary" />
            <span>Bookmarklet PC</span>
          </button>
        </div>
      </form>

      {/* 2. DYNAMIC WORKSPACE CONTENT AREA */}
      <div className="pt-4" aria-live="polite" aria-atomic="true">
        {/* State A: Loading / Extraction Spinner */}
        {isLoading && (
          <div className="w-full py-10 px-4 text-center flex flex-col items-center justify-center space-y-3 animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center">
              <Loader2
                className="w-6 h-6 animate-spin text-secondary"
                aria-hidden="true"
              />
            </div>
            <p className="font-bold text-base text-text">
              Mengekstraksi Informasi Media...
            </p>
            <p className="text-xs text-text-muted">
              Menganalisis format video dan audio yang tersedia
            </p>
          </div>
        )}

        {/* State B: Error Alert */}
        {!isLoading && error && (
          <div
            id="workspace-error"
            role="alert"
            aria-live="assertive"
            className="w-full bg-error-bg border border-error-border rounded-2xl p-5 text-error flex items-start gap-3.5 shadow-sm"
          >
            <div className="p-2 rounded-xl bg-error/10 text-error shrink-0">
              <AlertCircle className="w-5 h-5 stroke-[2]" aria-hidden="true" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-bold text-base text-error">
                Gagal Mengekstraksi Media
              </h3>
              <p className="text-sm text-error/90 font-medium leading-relaxed">
                {error}
              </p>
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
          <div className="w-full bg-surface-soft/60 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[160px]">
            <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-2.5">
              <Film className="w-5 h-5 text-secondary" aria-hidden="true" />
            </div>
            <p className="font-bold text-sm text-text">Pratinjau Hasil Media</p>
            <p className="text-xs text-text-muted mt-1 max-w-sm">
              Tempelkan URL media di atas dan klik Ekstrak untuk memilih opsi
              unduhan.
            </p>
          </div>
        )}

        {/* State D: Success Metadata & Formats */}
        {!isLoading && !error && metadata && (
          <div className="w-full space-y-6">
            {/* Header Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-soft text-primary text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                  Media Siap Diunduh
                </span>
              </div>

              <div className="flex items-center gap-2">
                {lastDownloadUrl && (
                  <button
                    type="button"
                    onClick={() => setIsQrOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-primary text-xs font-extrabold hover:bg-accent-dark transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan Unduh di HP</span>
                  </button>
                )}

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-soft border border-border text-xs font-bold text-text">
                  {getPlatformIcon(metadata.platform)}
                  <span className="capitalize">{metadata.platform}</span>
                </span>
              </div>
            </div>

            {/* Thumbnail / Inline Media Player & Info */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
              <div className="relative w-full sm:w-52 aspect-video rounded-2xl overflow-hidden bg-surface-soft border border-border shrink-0 shadow-xs group">
                {isPlayingPreview ? (
                  metadata.previewUrl ? (
                    <video
                      src={metadata.previewUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : (
                    <div className="relative w-full h-full bg-black flex flex-col items-center justify-center p-3 text-center text-white space-y-2">
                      <p className="text-xs font-semibold">
                        Buka tautan media asli di tab baru
                      </p>
                      <a
                        href={metadata.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-primary text-xs font-bold hover:bg-accent-dark transition-colors"
                      >
                        <span>Buka Media Asli</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={metadata.thumbnail}
                      alt={metadata.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setIsPlayingPreview(true)}
                      aria-label="Putar pratinjau media"
                      className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-accent text-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-primary ml-0.5" />
                      </div>
                    </button>
                    {metadata.duration ? (
                      <span
                        className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md backdrop-blur-xs text-[11px] font-mono font-medium flex items-center gap-1 pointer-events-none"
                        style={{
                          backgroundColor: "var(--color-overlay-dark)",
                          color: "var(--color-surface-white)",
                        }}
                      >
                        <Clock className="w-3 h-3" />
                        {Math.floor(metadata.duration / 60)}:
                        {String(metadata.duration % 60).padStart(2, "0")}
                      </span>
                    ) : null}
                  </>
                )}
              </div>

              <div className="flex-1 space-y-2 min-w-0">
                <h2 className="font-bold text-base sm:text-lg text-text leading-snug line-clamp-2">
                  {metadata.title}
                </h2>

                <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-text-muted">
                  {metadata.author && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-soft">
                      <User
                        className="w-3.5 h-3.5 text-secondary"
                        aria-hidden="true"
                      />
                      {typeof metadata.author === 'string' ? metadata.author : (metadata.author.displayName || metadata.author.username || '')}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-soft">
                    <Sparkles
                      className="w-3.5 h-3.5 text-secondary"
                      aria-hidden="true"
                    />
                    {metadata.formats.length} Opsi Format
                  </span>
                  <a
                    href={metadata.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-soft hover:bg-primary-soft text-text hover:text-primary transition-colors font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-secondary" />
                    <span>Buka Media Asli</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Real-time Download Progress Banner */}
            {isProcessingFormat && (
              <div className="w-full p-4 rounded-2xl bg-surface-soft border border-secondary/40 space-y-2.5 animate-fadeIn shadow-xs">
                <div className="flex items-center justify-between text-xs font-bold text-primary">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin text-secondary" />
                    <span>{downloadProgress?.stageText || "Memproses unduhan..."}</span>
                  </span>
                  <span className="font-mono text-secondary">
                    {downloadProgress?.percent || 0}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-surface border border-border rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-secondary rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${downloadProgress?.percent || 5}%` }}
                  />
                </div>
              </div>
            )}

            {/* Download Error Banner */}
            {downloadError && (
              <div
                role="alert"
                className="w-full bg-error-bg border border-error-border rounded-xl p-3.5 text-error flex items-start gap-3 text-sm font-medium shadow-xs"
              >
                <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                <div className="flex-1 space-y-0.5">
                  <p className="font-bold text-xs uppercase tracking-wide">
                    Gagal Menyiapkan Unduhan
                  </p>
                  <p className="text-xs">{downloadError}</p>
                </div>
              </div>
            )}

            {/* Format Selection Grid & Trimmer Tool */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-xs text-text-muted uppercase tracking-wider">
                  Pilihan Format Unduhan
                </h3>

                <button
                  type="button"
                  onClick={() => setIsTrimmerActive(!isTrimmerActive)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    isTrimmerActive
                      ? "bg-accent border-secondary text-primary shadow-xs"
                      : "bg-surface-soft border-border text-text-muted hover:text-text"
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>{isTrimmerActive ? "Trimmer Aktif" : "Pemotong Audio / Ringtone"}</span>
                </button>
              </div>

              {/* Trimmer Inputs Panel */}
              {isTrimmerActive && (
                <div className="p-4 rounded-2xl bg-surface-soft border border-secondary/30 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-secondary" />
                      Atur Durasi Potong Audio (Menit:Detik)
                    </p>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => { setTrimStart("00:00"); setTrimEnd("00:30"); }}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface border border-border text-text hover:bg-accent/20"
                      >
                        30s Ringtone
                      </button>
                      <button
                        type="button"
                        onClick={() => { setTrimStart("00:00"); setTrimEnd("00:15"); }}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface border border-border text-text hover:bg-accent/20"
                      >
                        15s Klip
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label htmlFor="trim-start-input" className="text-xs font-semibold text-text-muted">Mulai:</label>
                      <input
                        id="trim-start-input"
                        type="text"
                        value={trimStart}
                        onChange={(e) => setTrimStart(e.target.value)}
                        placeholder="00:00"
                        aria-label="Waktu mulai potong audio"
                        className="w-20 px-2.5 py-1 rounded-lg bg-surface border border-border text-xs font-mono font-bold text-text focus:outline-none focus:border-secondary"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor="trim-end-input" className="text-xs font-semibold text-text-muted">Selesai:</label>
                      <input
                        id="trim-end-input"
                        type="text"
                        value={trimEnd}
                        onChange={(e) => setTrimEnd(e.target.value)}
                        placeholder="00:30"
                        aria-label="Waktu selesai potong audio"
                        className="w-20 px-2.5 py-1 rounded-lg bg-surface border border-border text-xs font-mono font-bold text-text focus:outline-none focus:border-secondary"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {metadata.formats.map((fmt) => {
                  const targetFormatId = isTrimmerActive
                    ? `${fmt.id}_trim_${trimStart}_${trimEnd}`
                    : fmt.id;
                  const isProcessing = isProcessingFormat === fmt.id || isProcessingFormat === targetFormatId;
                  return (
                    <button
                      key={fmt.id}
                      onClick={() => onDownloadFormat(targetFormatId)}
                      disabled={Boolean(isProcessingFormat)}
                      aria-label={`Unduh ${fmt.quality} ${fmt.ext}`}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface hover:bg-surface-soft hover:border-secondary/40 transition-all text-left cursor-pointer group disabled:opacity-60 disabled:cursor-wait"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center group-hover:bg-accent transition-colors shrink-0">
                          {fmt.type === "audio" ? (
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
                            {fmt.ext} {fmt.requiresMerge ? "• HD Merge" : ""}
                          </p>
                        </div>
                      </div>

                      <div className="px-3.5 py-2 rounded-lg bg-primary text-surface text-xs font-bold group-hover:bg-primary-hover transition-colors flex items-center gap-1.5 shrink-0 ml-2">
                        {isProcessing ? (
                          <>
                            <Loader2
                              className="w-3.5 h-3.5 animate-spin"
                              aria-hidden="true"
                            />
                            <span>Proses</span>
                          </>
                        ) : (
                          <>
                            <span>Unduh</span>
                            <Download
                              className="w-3.5 h-3.5"
                              aria-hidden="true"
                            />
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

