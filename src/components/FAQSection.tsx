'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
}

export const FAQSection: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      q: 'Apakah iSave Downloader gratis digunakan?',
      a: 'Ya, 100% gratis tanpa batasan jumlah pengunduhan dan tanpa memerlukan pendaftaran akun.',
    },
    {
      q: 'Apakah video TikTok & Instagram yang diunduh bebas watermark?',
      a: 'Tentu saja! Sistem kami mengekstraksi stream media langsung HD tanpa watermark.',
    },
    {
      q: 'Format apa saja yang didukung?',
      a: 'Kami mendukung resolusi MP4 (1080p, 720p, 480p), MP3 (320k, 192k, 128k), Subtitle Teks (.SRT/.TXT), dan Bundel Photo Slide ZIP.',
    },
    {
      q: 'Platform apa saja yang didukung?',
      a: 'iSave Downloader mendukung YouTube, TikTok, Instagram, Facebook, Twitter/X, Reddit, dan Threads.',
    },
    {
      q: 'Apakah data saya disimpan di server?',
      a: 'Tidak. Kami menggunakan arsitektur stateless privacy-first, sehingga tidak ada riwayat atau URL yang disimpan.',
    },
  ];

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a,
      },
    })),
  };

  return (
    <section id="faq" className="w-full py-16 lg:py-24 bg-surface-soft/40 border-t border-border/60">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto space-y-3 mb-12">
          <span className="inline-block px-3.5 py-1 rounded-full bg-primary-soft text-primary text-xs font-bold uppercase tracking-wider">
            PERTANYAAN UMUM
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
            FAQ & Bantuan
          </h2>
          <p className="text-base text-text-muted">
            Temukan jawaban untuk pertanyaan yang sering ditanyakan.
          </p>
        </div>

        {/* Accordion Container */}
        <div className="max-w-3xl mx-auto space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-surface border border-border rounded-2xl overflow-hidden transition-colors hover:border-border-hover"
              >
                <button
                  type="button"
                  id={`faq-btn-${idx}`}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  className="w-full p-5 text-left font-bold text-base sm:text-lg text-text flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-secondary shrink-0" aria-hidden="true" />
                    <span>{faq.q}</span>
                  </span>
                  <div className={`p-1.5 rounded-lg bg-surface-soft text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}>
                    <ChevronDown className="w-4 h-4" aria-hidden="true" />
                  </div>
                </button>

                <div
                  id={`faq-answer-${idx}`}
                  role="region"
                  aria-labelledby={`faq-btn-${idx}`}
                  aria-hidden={!isOpen}
                  className={`px-5 pb-5 pt-1 text-sm text-text-muted leading-relaxed border-t border-border/40 ${isOpen ? 'block' : 'hidden'}`}
                >
                  {faq.a}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
