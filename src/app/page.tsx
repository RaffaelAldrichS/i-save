'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { UrlForm } from '@/components/UrlForm';
import { MediaPreview } from '@/components/MediaPreview';
import { Footer } from '@/components/Footer';
import { MediaMetadata } from '@/types/media';
import { Zap, ShieldCheck, Layers } from 'lucide-react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingFormat, setProcessingFormat] = useState<string | null>(null);

  const handleExtract = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setMetadata(null);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengekstraksi informasi media dari tautan ini.');
      }

      setMetadata(json.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat memproses tautan.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFormat = async (formatId: string) => {
    if (!metadata) return;
    setProcessingFormat(formatId);

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: metadata.url, formatId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.downloadUrl) {
        throw new Error(json.error || 'Gagal menyiapkan unduhan');
      }

      // Trigger automatic file download in browser
      const link = document.createElement('a');
      link.href = json.downloadUrl;
      link.download = json.filename || 'media.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memulai unduhan';
      alert(msg);
    } finally {
      setProcessingFormat(null);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-900">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 md:py-16 space-y-10">
        {/* Design Read: B2B/Consumer Clean Minimalist Hero */}
        <div className="text-center space-y-3 max-w-xl mx-auto pt-4">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Unduh Media <span className="underline underline-offset-4 decoration-zinc-400 dark:decoration-zinc-600">Tanpa Batas</span>
          </h1>

          <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 max-w-[50ch] mx-auto leading-relaxed">
            Ekstraksi cepat & gratis untuk video YouTube, TikTok tanpa watermark, Instagram Reels, & Facebook.
          </p>
        </div>

        {/* Input Form */}
        <UrlForm onExtract={handleExtract} isLoading={isLoading} />

        {/* Media Preview & Formats */}
        <MediaPreview
          metadata={metadata}
          error={error}
          onDownloadFormat={handleDownloadFormat}
          isProcessingFormat={processingFormat}
        />

        {/* Minimalist Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="p-2 w-fit rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm">Respon Instan</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Ekstraksi link cepat kurang dari 2 detik menggunakan engine hybrid.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="p-2 w-fit rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm">Tanpa Watermark</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Kualitas video asli HD bersih untuk TikTok & Instagram Reels.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="p-2 w-fit rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm">Stateless Privacy</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Tanpa pendaftaran akun atau penyimpanan riwayat di server.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
