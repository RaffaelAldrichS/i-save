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
  const [downloadProgress, setDownloadProgress] = useState<{ percent: number; stageText: string } | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [lastDownloadUrl, setLastDownloadUrl] = useState<string | null>(null);
  const [lastFilename, setLastFilename] = useState<string | null>(null);

  const handleExtract = async (url: string) => {
    setDownloadError(null);
    setLastDownloadUrl(null);
    setLastFilename(null);
    setDownloadProgress(null);
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

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setDownloadProgress({ percent: 5, stageText: 'Menyiapkan proses unduhan...' });

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: state.metadata.url, formatId, jobId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyiapkan unduhan');
      }

      // Async job queued (HTTP 202). Poll progress until the worker completes and
      // a signed download URL becomes available.
      const deadline = Date.now() + 15 * 60 * 1000;
      let finalUrl: string | null = null;
      let finalFilename: string | null = null;

      while (Date.now() < deadline) {
        const pRes = await fetch(`/api/download/progress?jobId=${jobId}`);
        if (!pRes.ok) {
          await new Promise((r) => setTimeout(r, 750));
          continue;
        }
        const pJson = await pRes.json();
        const data = pJson.data;

        if (pJson.success && data) {
          setDownloadProgress({
            percent: data.percent || 5,
            stageText: data.stageText || 'Memproses unduhan...',
          });

          if (data.jobStage === 'failed' || data.stage === 'error') {
            throw new Error(data.error || data.errorDetails?.message || 'Gagal menyiapkan unduhan');
          }

          if (data.jobStage === 'completed' && data.downloadUrl) {
            finalUrl = data.downloadUrl;
            finalFilename = data.filename || 'media.mp4';
            break;
          }
        }

        await new Promise((r) => setTimeout(r, 750));
      }

      if (!finalUrl) {
        throw new Error('Waktu proses unduhan habis. Silakan coba lagi.');
      }

      setDownloadProgress({ percent: 100, stageText: 'Selesai!' });
      setLastDownloadUrl(finalUrl);
      setLastFilename(finalFilename);

      const link = document.createElement('a');
      link.href = finalUrl;
      link.download = finalFilename || 'media.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memulai unduhan';
      setDownloadError(msg);
    } finally {
      setTimeout(() => {
        setProcessingFormat(null);
        setDownloadProgress(null);
      }, 1000);
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
            <div className="space-y-4 max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary tracking-tight leading-[1.15]">
                Unduh Video & Audio HD{' '}
                <span className="inline-block px-3 py-1 rounded-2xl bg-accent text-primary">
                  Tanpa Watermark
                </span>
              </h1>

              <p className="text-base sm:text-lg text-text-muted leading-relaxed font-normal max-w-2xl mx-auto">
                Simpan video MP4, MP3, Subtitle & konten media dari YouTube, TikTok, Instagram, Facebook, Twitter/X, Reddit & Threads secara instan. 100% gratis, super cepat, tanpa pendaftaran.
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
                downloadProgress={downloadProgress}
                lastDownloadUrl={lastDownloadUrl}
                lastFilename={lastFilename}
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
