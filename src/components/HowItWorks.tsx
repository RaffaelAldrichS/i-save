import React from 'react';
import { Link as LinkIcon, Settings, Download, ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: '1',
      title: 'Tempel Link',
      description: 'Salin tautan dari YouTube, TikTok, Instagram, Twitter/X, Reddit, atau Threads.',
      icon: LinkIcon,
    },
    {
      number: '2',
      title: 'Pilih Format',
      description: 'Pilih resolusi video atau format audio yang tersedia.',
      icon: Settings,
    },
    {
      number: '3',
      title: 'Unduh Media',
      description: 'Klik tombol unduh dan simpan media langsung ke perangkat Anda.',
      icon: Download,
    },
  ];

  return (
    <section id="cara-kerja" className="w-full py-16 lg:py-24">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto space-y-3 mb-12 lg:mb-16">
          <span className="inline-block px-3.5 py-1 rounded-full bg-primary-soft text-primary text-xs font-bold uppercase tracking-wider">
            CARA KERJA
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
            3 Langkah Mudah
          </h2>
          <p className="text-base text-text-muted">
            Proses pengunduhan media yang simpel tanpa perlu mendaftar akun.
          </p>
        </div>

        {/* Process Cards Grid with Connectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative bg-surface border border-border rounded-2xl p-7 shadow-subtle flex flex-col items-start space-y-4 hover:border-border-hover transition-colors"
              >
                {/* Step Number Badge */}
                <div className="flex items-center justify-between w-full">
                  <div className="w-10 h-10 rounded-xl bg-accent text-primary font-extrabold text-base flex items-center justify-center">
                    {step.number}
                  </div>
                  <div className="p-2 rounded-xl bg-surface-soft text-text-muted">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <h3 className="font-bold text-lg text-text">
                    {step.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow Connector for Desktop (between items) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute -right-4 lg:-right-5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-surface border border-border text-text-muted items-center justify-center shadow-xs">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
