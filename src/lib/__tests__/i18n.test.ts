import { describe, it, expect } from 'vitest';
import { getTranslation, detectLanguage, SupportedLang } from '../i18n';

describe('i18n Multi-language Module', () => {
  it('supports ID, EN, and ES languages', () => {
    const idTitle = getTranslation('id', 'heroTitle');
    const enTitle = getTranslation('en', 'heroTitle');
    const esTitle = getTranslation('es', 'heroTitle');

    expect(idTitle).toContain('Unduh');
    expect(enTitle).toContain('Download');
    expect(esTitle).toContain('Descargar');
  });

  it('detects language from browser header or default to ID', () => {
    expect(detectLanguage('en-US,en;q=0.9')).toBe('en');
    expect(detectLanguage('es-ES,es;q=0.9')).toBe('es');
    expect(detectLanguage('id-ID,id;q=0.9')).toBe('id');
    expect(detectLanguage('')).toBe('id');
    expect(detectLanguage(null)).toBe('id');
  });

  it('falls back to ID for unsupported key or lang', () => {
    expect(getTranslation('fr' as SupportedLang, 'heroTitle')).toContain('Unduh');
  });
});
