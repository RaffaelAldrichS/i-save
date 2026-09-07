import React from 'react';
import { Zap, Film, Globe, Sparkles, Layers, ShieldCheck } from 'lucide-react';

export const Features: React.FC = () => {
  const featureCards = [
    {
      title: 'Mudah & Cepat',
      description: 'Hanya dengan menempelkan tautan, media langsung siap diunduh dalam hitungan detik.',
      icon: Zap,
    },
    {
      title: 'Pilihan Format Lengkap',
      description: 'Tersedia berbagai format seperti MP4, MP3, dan resolusi hingga HD.',
      icon: Film,
    },
    {
      title: 'Unduh Tanpa Aplikasi',
      description: 'Tidak perlu instal aplikasi tambahan. Semua bisa dilakukan langsung dari browser.',
      icon: Globe,
    },
    {
      title: 'Gratis Selamanya',
      description: 'Tidak ada batasan unduhan. Gunakan kapan saja, tanpa biaya.',
      icon: Sparkles,
    },
    {
      title: 'Dukung Banyak Platform',
      description: 'YouTube, TikTok, Instagram, Facebook, dan lainnya.',
      icon: Layers,
    },
    {
      title: 'Aman & Terpercaya',
      description: 'Kami menjaga privasi dan keamanan data Anda dengan baik.',
      icon: ShieldCheck,
    },
  ];

  return (
    <section id="keunggulan" className="w-full py-16 lg:py-24 bg-surface-soft/40 border-y border-border/60">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12 lg:mb-16">
          <span className="inline-block px-3.5 py-1 rounded-full bg-primary-soft text-primary text-xs font-bold uppercase tracking-wider">
            KEUNGGULAN
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
            Kenapa Pilih iSAVE?
          </h2>
          <p className="text-base text-text-muted">
            Kami menyediakan cara termudah untuk mengunduh media favoritmu dengan kualitas terbaik.
          </p>
        </div>

        {/* 3-Column Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-surface border border-border rounded-2xl p-7 shadow-subtle hover:-translate-y-1 hover:shadow-card hover:border-secondary/30 transition-all duration-200 flex flex-col items-start space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 stroke-[2]" aria-hidden="true" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-lg text-text">
                    {card.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
