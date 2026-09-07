'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { UrlForm } from '@/components/UrlForm';
import { PlatformBadges } from '@/components/PlatformBadges';
import { HeroVisual } from '@/components/HeroVisual';
import { MediaPreview } from '@/components/MediaPreview';
import { Features } from '@/components/Features';
import { HowItWorks } from '@/components/HowItWorks';
import { FAQSection } from '@/components/FAQSection';
import { Footer } from '@/components/Footer';
import { MediaMetadata } from '@/types/media';

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
        throw new Error(json.error || 'Gagal mengekstraksi informasi media.');
      }

      setMetadata(json.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
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

      const link = document.createElement('a');
      link.href = json.downloadUrl;
      link.download = json.filename || 'media.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memulai unduhan';
      setError(msg);
    } finally {
      setProcessingFormat(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-text font-sans">
      <Navbar />

      <main className="flex-1 w-full">
        {/* HERO SECTION */}
        <section id="hero" className="w-full pt-10 pb-16 lg:pt-16 lg:pb-24 overflow-hidden">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* LEFT COLUMN: Copy & Downloader */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary tracking-tight leading-[1.1]">
                    Unduh Media{' '}
                    <span className="inline-block px-3 py-0.5 rounded-xl bg-accent text-primary">
                      Tanpa Batas
                    </span>
                  </h1>

                  <p className="text-base sm:text-lg text-text-muted max-w-xl leading-relaxed font-normal">
                    Simpan video, audio, dan konten dari berbagai platform dengan mudah dan cepat. Cukup tempel tautan, pilih format, dan unduh.
                  </p>
                </div>

                {/* Supported Platform Badges */}
                <PlatformBadges />

                {/* Main Downloader Input Box */}
                <div className="pt-2 w-full max-w-2xl">
                  <UrlForm onExtract={handleExtract} isLoading={isLoading} />
                </div>
              </div>

              {/* RIGHT COLUMN: Visual Illustration */}
              <div className="lg:col-span-5 w-full">
                <HeroVisual />
              </div>
            </div>
          </div>
        </section>

        {/* WORKSPACE PREVIEW / RESULT SECTION */}
        <section className="w-full pb-16 lg:pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <MediaPreview
              metadata={metadata}
              error={error}
              onDownloadFormat={handleDownloadFormat}
              isProcessingFormat={processingFormat}
            />
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
