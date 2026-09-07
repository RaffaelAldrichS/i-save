export type SupportedLang = 'id' | 'en' | 'es';

export const translations = {
  id: {
    heroTitle: 'Unduh Video & Audio HD Tanpa Watermark',
    heroSub: 'Simpan video MP4, MP3, dan konten media dari YouTube, TikTok, Instagram & Facebook secara instan. 100% gratis, super cepat, tanpa pendaftaran.',
    extract: 'Ekstrak',
    processing: 'Memproses...',
    download: 'Unduh',
    paste: 'Tempel',
    clear: 'Bersihkan',
    qrButton: 'Scan Unduh di HP',
    bookmarkletButton: 'Bookmarklet PC',
    noWatermark: 'Tanpa Watermark',
    fastProcessing: 'Proses Instan',
    statelessSecurity: '100% Aman & Stateless',
    themeToggle: 'Ganti Tema',
    audioBitrate: 'Pilihan Bitrate Audio',
    zipBundle: 'Unduh Semua Slide (ZIP)',
  },
  en: {
    heroTitle: 'Download HD Videos & Audio Without Watermark',
    heroSub: 'Save MP4 videos, MP3 audio, and media from YouTube, TikTok, Instagram & Facebook instantly. 100% free, ultra-fast, no registration.',
    extract: 'Extract',
    processing: 'Processing...',
    download: 'Download',
    paste: 'Paste',
    clear: 'Clear',
    qrButton: 'Scan QR for Mobile',
    bookmarkletButton: 'PC Bookmarklet',
    noWatermark: 'No Watermark',
    fastProcessing: 'Instant Process',
    statelessSecurity: '100% Safe & Stateless',
    themeToggle: 'Toggle Theme',
    audioBitrate: 'Audio Bitrate Options',
    zipBundle: 'Download All Slides (ZIP)',
  },
  es: {
    heroTitle: 'Descargar Videos y Audio HD Sin Marca de Agua',
    heroSub: 'Guarda videos MP4, audio MP3 y medios de YouTube, TikTok, Instagram y Facebook al instante. 100% gratis, rápido y sin registro.',
    extract: 'Extraer',
    processing: 'Procesando...',
    download: 'Descargar',
    paste: 'Pegar',
    clear: 'Limpiar',
    qrButton: 'Escanear QR Móvil',
    bookmarkletButton: 'Marcador PC',
    noWatermark: 'Sin marca de agua',
    fastProcessing: 'Proceso Instantáneo',
    statelessSecurity: '100% Seguro y Stateless',
    themeToggle: 'Cambiar Tema',
    audioBitrate: 'Opciones de Bitrate de Audio',
    zipBundle: 'Descargar Todo (ZIP)',
  },
};

export function getTranslation(lang: SupportedLang, key: keyof typeof translations.id): string {
  const currentLang = translations[lang] ? lang : 'id';
  return translations[currentLang][key] || translations.id[key];
}

export function detectLanguage(acceptLanguageHeader: string | null): SupportedLang {
  if (!acceptLanguageHeader) return 'id';
  const lower = acceptLanguageHeader.toLowerCase();
  if (lower.includes('es')) return 'es';
  if (lower.includes('en')) return 'en';
  if (lower.includes('id')) return 'id';
  return 'id';
}
