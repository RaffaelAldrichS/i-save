'use client';

import React, { useState, useEffect } from 'react';
import { Download, Menu, X, CheckCircle2 } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';

export function getActiveSectionId(sectionIds: string[]): string | null {
  if (typeof document === 'undefined') return null;
  let activeId: string | null = null;
  let minDistance = Infinity;
  for (const id of sectionIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    const distance = Math.abs(rect.top - 80);
    if (rect.top <= 120 && distance < minDistance) {
      minDistance = distance;
      activeId = id;
    }
  }
  return activeId;
}

const NAV_LINKS = [
  { label: 'Beranda', href: '#hero' },
  { label: 'Keunggulan', href: '#keunggulan' },
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'FAQ', href: '#faq' },
];

const SECTION_IDS = NAV_LINKS.map((l) => l.href.slice(1));

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const handleScrollEvent = () => {
      setActiveSection(getActiveSectionId(SECTION_IDS));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScrollEvent, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', handleScrollEvent);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/90 backdrop-blur-md border-b border-border/80 transition-colors">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* LEFT: Logo */}
        <a 
          href="#hero" 
          onClick={(e) => handleScroll(e, '#hero')}
          className="flex items-center gap-2.5 group focus-visible:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center group-hover:bg-accent transition-colors">
            <Download className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-primary">
            iSAVE
          </span>
        </a>

        {/* CENTER: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.href.slice(1);
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScroll(e, link.href)}
                className={`text-sm font-semibold transition-colors ${
                  isActive ? 'text-primary border-b-2 border-primary py-1' : 'text-text-muted hover:text-primary'
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* RIGHT: CTA Button & Theme Switcher (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeSwitcher />
          <a
            href="#downloader"
            onClick={(e) => handleScroll(e, '#downloader')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-primary-soft text-primary hover:bg-accent transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
            Gratis Selamanya
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeSwitcher />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-primary hover:bg-primary-soft transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 stroke-[2]" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6 stroke-[2]" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 top-18 backdrop-blur-xs md:hidden z-40"
          style={{ backgroundColor: 'var(--color-overlay)' }}
        />
      )}

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="relative z-50 md:hidden border-b border-border bg-surface px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-2">
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.href.slice(1);
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleScroll(e, link.href)}
                  className={`px-3 py-2 rounded-lg text-base font-semibold transition-colors ${
                    isActive ? 'bg-primary-soft text-primary font-bold' : 'text-text hover:bg-primary-soft hover:text-primary'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>
          <div className="pt-2 border-t border-border/60">
            <a
              href="#downloader"
              onClick={(e) => handleScroll(e, '#downloader')}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-primary text-surface hover:bg-primary-hover transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-accent" />
              Gratis Selamanya
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
