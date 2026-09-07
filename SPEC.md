# Specification Document — `isave`

## 1. Overview
`isave` adalah aplikasi web (Web App & Service) multi-platform media downloader modern yang memungkinkan pengguna mengunduh video, audio, dan foto dari berbagai platform media sosial seperti YouTube, TikTok, Instagram, dan Facebook dengan cepat, tanpa watermark, 100% stateless, dan memiliki daya tarik UX tinggi.

## 2. Core Features & Scope
- **Multi-Platform Extraction**:
  - **YouTube**: Video SD/HD/1080p, Shorts, Audio MP3/M4A.
  - **TikTok**: Video tanpa watermark (HD), Audio track, Photo Slideshow / Carousel.
  - **Instagram**: Reels, Feed Posts, Stories, Carousels (Foto & Video).
  - **Facebook & Platform Lain**: Video public & media links.
- **High-Appeal UX Features**:
  - **Mobile QR Code Handoff**: Modal QR Code dinamis untuk scan dan unduh langsung dari perangkat HP tanpa perlu kirim link manual.
  - **Inline Media Preview Player**: Pratinjau video/audio langsung di workspace sebelum mengunduh.
  - **PWA & Web Share Target**: Aplikasi dapat di-install dan terintegrasi langsung dengan menu Share HP (Share Sheet).
  - **Carousel & Slideshow Exporter**: Pengunduhan slide foto TikTok/Instagram sebagai paket ZIP atau unduhan foto individual.
  - **Multi-Language (i18n)**: Dukungan Bahasa Indonesia & Bahasa Inggris otomatis/manual.
  - **Browser Bookmarklet**: Tombol pintas simpan media langsung dari browser PC.
- **Media Processing & Quality Selection**:
  - Pilihan resolusi video (360p, 480p, 720p, 1080p Full HD).
  - Pilihan ekstraksi audio MP3.
  - Penggabungan trek video & audio terpisah via FFmpeg / yt-dlp.
- **Stateless & Privacy First**:
  - Tanpa login / register.
  - Penyimpanan file sementara di server temp storage dengan auto-cleanup TTL (15 menit).

## 3. Technology Stack
- **Framework**: Next.js 16 (App Router, React 19, TypeScript)
- **Styling & UI Components**: Tailwind CSS v4, Lucide Icons
- **Backend & API**: Next.js Route Handlers (Node.js runtime)
- **Extraction Engine**: `yt-dlp` wrapper & Direct Fetch Parsers (TikWM, oEmbed, Instagram API)
- **Media & File Bundling**: `fluent-ffmpeg`, `jszip` / server zip streams
- **Testing & Quality Assurance**: Vitest, ESLint

## 4. Non-Functional Requirements
- **Response Time**: Metadata extraction < 2 detik.
- **Clean Cleanup**: File temporary dihapus otomatis setelah 15 menit.
- **Rate Limiting**: Throttling per IP address (10 req/min) untuk mencegah abuse.
