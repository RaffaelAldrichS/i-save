# ⚡ iSAVE — Pengunduh Media HD Tanpa Watermark

![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss)
![Vitest](https://img.shields.io/badge/Tested_with-Vitest-6E9F18?style=flat-square&logo=vitest)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

> **iSAVE** adalah aplikasi web pengunduh media online yang super cepat, 100% gratis, dan tanpa pendaftaran. Dirancang dengan pendekatan *privacy-first* dan *stateless* untuk menyimpan video MP4 HD dan audio MP3 dari YouTube, TikTok, Instagram, serta Facebook tanpa watermark.

---

## 🌟 Fitur Utama

- 🎬 **Bebas Watermark**: Ekstraksi stream media murni dari TikTok & Instagram tanpa logo/watermark overlay.
- 🎵 **Ekstraksi Audio MP3**: Ubah video favorit dari YouTube & TikTok menjadi file audio MP3 berkualitas tinggi secara instan.
- 📺 **Multi-Resolusi Full HD**: Dukungan pilihan format MP4 mulai dari 360p, 480p, 720p HD, hingga 1080p Full HD (dengan penggabungan video + audio otomatis via FFmpeg).
- 🛡️ **Stateless & Privacy-First**: Tanpa basis data, tanpa akun, tanpa pelacakan riwayat unduhan. File sementara dihapus otomatis setelah 15 menit.
- 🔒 **Keamanan Tingkat Tinggi**: Proteksi bawaan dari serangan **SSRF** (Server-Side Request Forgery), **Path Traversal**, serta pembatasan laju (*In-memory Rate Limiting*).
- ⚡ **UI/UX Modern & Responsif**: Dibangun dengan komponen responsif, dukungan paste cepat dari clipboard, indikator loading interaktif, dan standar aksesibilitas WCAG 2.2.

---

## 📊 Matriks Dukungan Platform

| Platform | Format Video | Format Audio | Tanpa Watermark | Resolusi Maksimum |
| :--- | :---: | :---: | :---: | :---: |
| **YouTube** | MP4 | MP3 / M4A | ✅ | 1080p Full HD / 4K |
| **TikTok** | MP4 | MP3 | ✅ | HD Originals |
| **Instagram** (Reels / Post) | MP4 | MP3 | ✅ | 1080p HD |
| **Facebook** | MP4 | MP3 | ✅ | HD Quality |

---

## 🛠️ Teknologi & Arsitektur

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)
- **Ekstraksi Media**: Extractor Pipeline (Direct API Parsers + `yt-dlp` Wrapper Fallback)
- **Pemrosesan Media**: [FFmpeg](https://ffmpeg.org/) Fluent-FFmpeg Merger & Converter
- **Testing**: [Vitest](https://vitest.dev/) untuk Unit & Integration Testing
- **Font**: Rethink Sans (Google Fonts via `next/font`)

---

## 🚀 Panduan Memulai (Local Setup)

### Prasyarat Sistem

Sebelum menjalankan aplikasi di lingkungan lokal, pastikan perangkat Anda telah terpasang:
- **Node.js**: v18.0.0 atau versi lebih baru
- **npm** / **pnpm** / **yarn** / **bun**
- **FFmpeg**: Terpasang di sistem (`ffmpeg` dan `ffprobe` terdaftar di sistem PATH)
- **Python 3** & **yt-dlp** *(Opsional, untuk fallback ekstraksi YouTube lanjutan)*

### Langkah Instalasi

1. **Cloning Repositori**
   ```bash
   git clone https://github.com/username/isave.git
   cd isave
   ```

2. **Instal Dependensi**
   ```bash
   npm install
   ```

3. **Jalankan Server Pengembang (Development)**
   ```bash
   npm run dev
   ```
   Buka browser dan akses [http://localhost:3000](http://localhost:3000).

---

## 🧪 Pengujian & Build

```bash
# Jalankan seluruh unit & integration tests
npm test

# Periksa tipe TypeScript & linter
npm run lint

# Buat build produksi
npm run build

# Jalankan server hasil build produksi
npm run start
```

---

## 🔌 Dokumentasi API Routes

### 1. Ekstraksi Informasi Media
`POST /api/extract`

*Mengekstraksi judul, thumbnail, durasi, dan daftar format yang tersedia dari URL media.*

- **Request Body**:
  ```json
  {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }
  ```
- **Response Success (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "dQw4w9WgXcQ",
      "platform": "youtube",
      "title": "Rick Astley - Never Gonna Give You Up",
      "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      "duration": 213,
      "author": "Rick Astley",
      "formats": [
        { "id": "1080p", "quality": "1080p Full HD", "ext": "mp4", "requiresMerge": true, "type": "video" },
        { "id": "mp3", "quality": "320kbps MP3", "ext": "mp3", "requiresMerge": false, "type": "audio" }
      ]
    }
  }
  ```

### 2. Memproses & Menyiapkan Unduhan
`POST /api/download`

*Mengunduh/menggabungkan format yang dipilih ke direktori temporer server dan mengembalikan URL sesi unduhan.*

- **Request Body**:
  ```json
  {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "formatId": "1080p"
  }
  ```
- **Response Success (200 OK)**:
  ```json
  {
    "success": true,
    "downloadUrl": "/api/download?fileId=a1b2c3d4-e5f6-7890",
    "filename": "Rick_Astley_Never_Gonna_Give_You_Up_1080p.mp4"
  }
  ```

### 3. Mengambil Stream File
`GET /api/download?fileId={fileId}`

*Mengalirkan file fisik sebagai attachment unduhan ke browser peramban.*

---

## 🛡️ Keamanan & Privasi

1. **SSRF Filtering (`isSafeExternalUrl`)**: Mencegah URL target mengarah ke IP internal (loopback `127.0.0.1`, subnet privat `10.x.x.x`, `192.168.x.x`, AWS metadata `169.254.169.254`).
2. **Rate Limiting (`RateLimiter`)**: Membatasi maksimum 10 permintaan per menit per alamat IP pengirim untuk mencegah penyalahgunaan resource server.
3. **Path Traversal Protection**: Pembersihan karakter ilegal pada `formatId` dan `fileId` menggunakan penataan aman `path.basename`.
4. **Automatic TTL File Cleanup**: File media hasil pengolahan disimpan dalam folder temporer OS dan secara otomatis dibersihkan oleh `tempStorage.cleanupExpired()` setelah masa berlaku berakhir.

---

## 📁 Struktur Proyek

```text
isave/
├── public/                  # Asset publik & favicon
├── src/
│   ├── app/                 # Next.js App Router (Pages, Layouts, API Routes)
│   │   ├── api/
│   │   │   ├── extract/     # Endpoint POST /api/extract
│   │   │   └── download/    # Endpoint POST & GET /api/download
│   │   ├── layout.tsx       # Root layout, metadata SEO & JSON-LD
│   │   └── page.tsx         # Halaman utama aplikasi
│   ├── components/          # Komponen UI React
│   │   ├── DownloaderWorkspace.tsx  # Workspace utama (Form + Preview + Formats)
│   │   ├── Navbar.tsx               # Navigasi atas & mobile menu
│   │   ├── Features.tsx             # Kartu keunggulan layanan
│   │   ├── HowItWorks.tsx           # Panduan 3 langkah mudah
│   │   ├── FAQSection.tsx           # Accordion FAQ & bantuan
│   │   ├── PlatformBadges.tsx       # Badge platform terdukung
│   │   └── Footer.tsx               # Footer brand & tautan
│   ├── lib/                 # Core utilities & bisnis logika
│   │   ├── extractors/      # Extractor Manager & platform parsers
│   │   ├── mediaDownloader.ts # Engine pengunduhan & FFmpeg merger
│   │   ├── rateLimit.ts     # In-memory IP rate limiter
│   │   ├── security.ts      # Validator keamanan & SSRF guard
│   │   └── tempStorage.ts   # Manajemen file temporer & TTL cleanup
│   └── types/               # TypeScript interface & types
├── ARCHITECTURE.md          # Dokumen arsitektur teknis
└── README.md                # Dokumentasi proyek
```

---

## 📄 Lisensi

Diterbitkan di bawah lisensi **[MIT License](LICENSE)**. Bebas digunakan, dimodifikasi, dan didistribusikan.
