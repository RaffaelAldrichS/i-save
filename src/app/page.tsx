'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { PlatformBadges } from '@/components/PlatformBadges';
import { DownloaderWorkspace } from '@/components/DownloaderWorkspace';
import { Features } from '@/components/Features';
import { HowItWorks } from '@/components/HowItWorks';
import { FAQSection } from '@/components/FAQSection';
import { Footer } from '@/components/Footer';
import { MediaMetadata } from '@/types/media';

type DownloaderState =
  | { status: 'idle' }
  | { status: 'extracting' }
  | { status: 'success'; metadata: MediaMetadata }
  | { status: 'error'; message: string };

export default function Home() {
  const [state, setState] = useState<DownloaderState>({ status: 'idle' });
  const [processingFormat, setProcessingFormat] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleExtract = async (url: string) => {
    setDownloadError(null);
    setState({ status: 'extracting' });

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengekstraksi informasi media.');
      }

      setState({ status: 'success', metadata: json.data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setState({ status: 'error', message: msg });
    }
  };

  const handleDownloadFormat = async (formatId: string) => {
    if (state.status !== 'success') return;
    setProcessingFormat(formatId);
    setDownloadError(null);

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: state.metadata.url, formatId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.downloadUrl) {
        throw new Error(json.error || 'Gagal menyiapkan unduhan');
      }

      const link = document.createElement('a');
      link.href = json.downloadUrl;
      link.download = json.filename || 'media.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memulai unduhan';
      setDownloadError(msg);
    } finally {
      setProcessingFormat(null);
    }
  };

  const isLoading = state.status === 'extracting';
  const metadata = state.status === 'success' ? state.metadata : null;
  const error = state.status === 'error' ? state.message : null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-text font-sans selection:bg-accent selection:text-primary">
      <Navbar />

      <main id="main-content" className="flex-1 w-full">
        {/* HERO SECTION WITH SINGLE UNIFIED WORKSPACE */}
        <section id="hero" className="w-full pt-10 pb-16 lg:pt-16 lg:pb-24 overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-center">
            {/* Hero Copy */}
            <div className="space-y-4 max-w-2xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary tracking-tight leading-[1.15]">
                Unduh Media{' '}
                <span className="inline-block px-3 py-1 rounded-2xl bg-accent text-primary">
                  Tanpa Watermark
                </span>
              </h1>

              <p className="text-base sm:text-lg text-text-muted leading-relaxed font-normal">
                Simpan video, audio, dan konten dari YouTube, TikTok, Instagram, dan Facebook secara instan dan 100% gratis.
              </p>
            </div>

            {/* Supported Platform Badges */}
            <div className="flex justify-center">
              <PlatformBadges />
            </div>

            {/* Main Single Unified Downloader Workspace */}
            <div className="w-full text-left">
              <DownloaderWorkspace
                onExtract={handleExtract}
                isLoading={isLoading}
                metadata={metadata}
                error={error}
                downloadError={downloadError}
                onDownloadFormat={handleDownloadFormat}
                isProcessingFormat={processingFormat}
              />
            </div>
          </div>
        </section>

        {/* FEATURES / WHY iSAVE SECTION */}
        <Features />

        {/* HOW IT WORKS SECTION */}
        <HowItWorks />

        {/* FAQ SECTION */}
        <FAQSection />
      </main>

      <Footer />
    </div>
  );
}
