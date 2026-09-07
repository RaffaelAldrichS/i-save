# Specification Document — `isave`

## 1. Overview
`isave` adalah aplikasi web (Web App & Service) multi-platform media downloader yang memungkinkan pengguna mengunduh video dan audio dari berbagai platform media sosial seperti YouTube, TikTok, Instagram, Facebook, dan platform lainnya dengan cepat, tanpa watermark, dan stateless.

## 2. Core Features & Scope
- **Multi-Platform Extraction**:
  - **YouTube**: Video SD/HD/4K/8K, Audio MP3/M4A, Shorts.
  - **TikTok**: Video tanpa watermark (HD), Audio track, Slideshow foto.
  - **Instagram**: Reels, Feed Posts, Stories, Carousels.
  - **Facebook & Platform Lain**: Video public & media links.
- **Media Processing & Quality Selection**:
  - Pilihan resolusi video (360p, 480p, 720p, 1080p, 4K).
  - Pilihan ekstraksi audio (MP3, AAC).
  - Penggabungan trek video & audio terpisah (FFmpeg merger).
- **Stateless & Privacy First**:
  - Tidak ada sistem login/register.
  - Penyimpanan file sementara di server temp storage dengan auto-cleanup / TTL (Time to Live).
- **User Interface**:
  - UI modern, bersih, responsive, dan mobile-friendly dengan tema Dark/Light Mode.

## 3. Technology Stack
- **Framework**: Next.js (App Router, React 19 / 18, TypeScript)
- **Styling & UI Components**: Tailwind CSS, Shadcn UI / Lucide Icons
- **Backend & API**: Next.js API Routes / Server Actions (Node.js runtime)
- **Extraction Engine**:
  - `yt-dlp` executable wrapper (untuk platform umum & video 1080p+ merging)
  - Custom direct parsers / fetchers (untuk response cepat TikTok & Instagram)
- **Media Processing**: `fluent-ffmpeg` / `ffmpeg-static`
- **Testing & Quality Assurance**: Vitest, ESLint, Prettier

## 4. Non-Functional Requirements
- **Response Time**: Metadata extraction < 2 detik.
- **Clean Cleanup**: File temporary dihapus otomatis setelah 10-30 menit atau setelah ditransfer.
- **Rate Limiting**: Throttling per IP address untuk mencegah abuse.
