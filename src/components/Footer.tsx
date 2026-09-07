import React from 'react';
import { Download } from 'lucide-react';
import { YoutubeIcon, TiktokIcon, InstagramIcon, FacebookIcon } from './BrandIcons';

export const Footer: React.FC = () => {
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full bg-primary text-surface py-12 lg:py-16 border-t border-primary-hover">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* LEFT Column: Brand & Info (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <a 
              href="#hero" 
              onClick={(e) => handleScroll(e, '#hero')}
              className="inline-flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-accent text-primary flex items-center justify-center font-bold">
                <Download className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-surface">
                iSAVE
              </span>
            </a>
            <p className="text-sm text-surface/75 max-w-sm leading-relaxed">
              Unduh media favoritmu, kapan saja, di mana saja. Layanan ekstraksi media terpercaya, gratis, dan tanpa watermark.
            </p>
          </div>

          {/* CENTER Column: Quick Navigation (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold text-accent uppercase tracking-wider">Navigasi</h4>
            <ul className="space-y-2 text-sm text-surface/80">
              <li>
                <a href="#hero" onClick={(e) => handleScroll(e, '#hero')} className="hover:text-accent transition-colors">
                  Beranda
                </a>
              </li>
              <li>
                <a href="#keunggulan" onClick={(e) => handleScroll(e, '#keunggulan')} className="hover:text-accent transition-colors">
                  Keunggulan
                </a>
              </li>
              <li>
                <a href="#cara-kerja" onClick={(e) => handleScroll(e, '#cara-kerja')} className="hover:text-accent transition-colors">
                  Cara Kerja
                </a>
              </li>
              <li>
                <a href="#faq" onClick={(e) => handleScroll(e, '#faq')} className="hover:text-accent transition-colors">
                  FAQ & Bantuan
                </a>
              </li>
            </ul>
          </div>

          {/* RIGHT Column: Supported Platforms & Social (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-accent uppercase tracking-wider">Dukungan Platform</h4>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-surface-translucent hover:bg-surface-translucent-hover text-surface flex items-center justify-center transition-colors">
                <YoutubeIcon className="w-5 h-5 text-surface" />
              </div>
              <div className="w-11 h-11 rounded-xl bg-surface-translucent hover:bg-surface-translucent-hover text-surface flex items-center justify-center transition-colors">
                <TiktokIcon className="w-5 h-5 text-surface" />
              </div>
              <div className="w-11 h-11 rounded-xl bg-surface-translucent hover:bg-surface-translucent-hover text-surface flex items-center justify-center transition-colors">
                <InstagramIcon className="w-5 h-5 text-surface" />
              </div>
              <div className="w-11 h-11 rounded-xl bg-surface-translucent hover:bg-surface-translucent-hover text-surface flex items-center justify-center transition-colors">
                <FacebookIcon className="w-5 h-5 text-surface" />
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-surface-translucent-border" />

        {/* Bottom Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-surface/60">
          <p>© {new Date().getFullYear()} iSAVE. Semua hak dilindungi.</p>
          <div className="flex items-center gap-6">
            <a href="#faq" onClick={(e) => handleScroll(e, '#faq')} className="hover:text-surface transition-colors">Privasi</a>
            <span className="text-surface-translucent-border">•</span>
            <a href="#faq" onClick={(e) => handleScroll(e, '#faq')} className="hover:text-surface transition-colors">Syarat & Ketentuan</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
