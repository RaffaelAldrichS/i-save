# ⚡ iSAVE — Unduh Media HD Tanpa Watermark, Cepat & Bebas Ribet

![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss)
![Vitest](https://img.shields.io/badge/Tested_with-Vitest-6E9F18?style=flat-square&logo=vitest)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

> **Mau simpan video TikTok tanpa logo watermark atau convert lagu YouTube ke MP3 secara instan?**
> **iSAVE** hadir untuk mempermudah hidupmu. Cukup paste link media, pilih format yang kamu mau, dan unduh langsung — 100% gratis, tanpa perlu daftar akun, dan tanpa melacak data pribadimu.

---

## ✨ Kenapa Memilih iSAVE?

- 📱 **Mobile Seamless QR Code Handoff**: Pindahkan unduhan dari desktop ke HP secara instan dengan mengarahkan kamera HP ke QR Code dinamis.
- 📲 **PWA & Native Web Share Target**: Install iSAVE sebagai PWA dan simpan video langsung dari tombol *Share Sheet* native di Android & iOS!
- 🎬 **Pratinjau Media Inline**: Tonton video atau dengarkan audio langsung di dalam workspace sebelum mengunduh.
- 📸 **TikTok Slide Carousel & Bundel ZIP**: Unduh seluruh foto slide TikTok/Instagram dalam 1 file ZIP paket atau unduh foto eceran per slide.
- 🎵 **Pilihan Bitrate Audio MP3**: Ekstraksi audio murni dengan pilihan kualitas 320kbps (High Quality), 192kbps (Standard), atau 128kbps (Compact/Ringtone).
- 🌐 **Dukungan Multi-Bahasa (i18n)**: Mendukung Bahasa Indonesia, English, dan Español otomatis sesuai preferensi peramban.
- 🌓 **Tema Interaktif (Dark / Light / System)**: Ganti tema visual sesuai kenyamanan mata dengan mempertahankan identitas warna *Deep Forest Green (#0E2E1A)* dan *Electric Lime (#84E039)*.
- ⚡ **Pintasan Bookmarklet Browser PC**: Unduh video saat menonton di YouTube/TikTok/Instagram cukup 1-klik dari Bookmark Bar browser PC.
- 🛡️ **Privasi Aman & Terjaga**: Tanpa pendaftaran akun, tanpa database, dan tanpa riwayat unduhan. File sementara langsung terhapus otomatis dalam 15 menit.
- 🔒 **Sistem Keamanan Andal**: Dilengkapi proteksi SSRF, `--no-exec` yt-dlp isolation, pencegahan Path Traversal, serta pembatas laju akses (*Rate Limiting*).

---

## 📊 Platform yang Didukung

| Platform | Format Video | Format Audio | Tanpa Watermark | Resolusi Maksimal |
| :--- | :---: | :---: | :---: | :---: |
| **YouTube** | MP4 | MP3 / M4A | ✅ | 1080p Full HD / 4K |
| **TikTok** | MP4 | MP3 | ✅ | Kualitas Asli (HD) |
| **Instagram** (Reels & Feed) | MP4 | MP3 | ✅ | 1080p HD |
| **Facebook** | MP4 | MP3 | ✅ | Kualitas HD |

---

## 🛠️ Stack Teknologi

Didevelop menggunakan teknologi modern berbasis web yang cepat dan andal:

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Desain UI**: [Tailwind CSS v4](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)
- **Mesin Ekstraksi**: Extractor Pipeline (Parser API Langsung + Fallback `yt-dlp`)
- **Pengolahan Media**: [FFmpeg](https://ffmpeg.org/) (Menggabungkan Video + Audio HD)
- **Pengujian**: [Vitest](https://vitest.dev/) (Unit & Integration Testing)
- **Tipografi**: Rethink Sans (`next/font`)

---

## 🚀 Panduan Memulai di Lokal

Ingin mencoba atau mengembangkan project ini di komputer lokalmu? Ikuti langkah mudah berikut:

### Prasyarat

Pastikan perangkatmu sudah memiliki:
1. **Node.js**: Versi v18.0.0 atau yang lebih baru.
2. **Package Manager**: `npm`, `pnpm`, `yarn`, atau `bun`.
3. **FFmpeg**: Terpasang di sistem (`ffmpeg` dan `ffprobe` sudah masuk dalam `PATH`).
4. **Python 3 & yt-dlp** *(Opsional, digunakan sebagai fallback pengunduhan YouTube)*.

### Langkah Instalasi

1. **Clone Repositori**
   ```bash
   git clone https://github.com/username/isave.git
   cd isave
   ```

2. **Pasang Dependensi**
   ```bash
   npm install
   ```

3. **Jalankan Mode Pengembangan**
   ```bash
   npm run dev
   ```
   Buka browser dan kunjungi [http://localhost:3000](http://localhost:3000).

---

## 🧪 Pengujian & Build

```bash
# Jalankan seluruh pengujian (Unit & Integration Tests)
npm test

# Cek tipe data TypeScript dan potensi error code
npm run lint

# Buat build siap produksi
npm run build

# Jalankan server dari hasil build produksi
npm run start
```

---

## 🔌 Dokumentasi API Routes

Kamu juga bisa memanfaatkan API bawaan iSAVE untuk integrasi:

### 1. Ambil Informasi Media
`POST /api/extract`

Mengekstraksi detail video seperti judul, thumbnail, durasi, dan daftar format yang bisa diunduh.

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

### 2. Proses & Siapkan Unduhan
`POST /api/download`

Mengunduh atau menggabungkan format pilihan ke server sementara dan memberikan link file siap unduh.

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

### 3. Unduh Stream File
`GET /api/download?fileId={fileId}`

Mengirimkan file fisik langsung ke peramban pengguna sebagai lampiran unduhan (*download attachment*).

---

## 🛡️ Keamanan & Perlindungan Data

- **Filter SSRF (`isSafeExternalUrl`)**: Mencegah URL mencurigakan yang mengarah ke jaringan privat internal (`127.0.0.1`, `10.x.x.x`, `192.168.x.x`, metadata AWS `169.254.169.254`).
- **Pembatas Akses (`RateLimiter`)**: Maksimal 10 permintaan per menit per alamat IP untuk mencegah bot/spamming.
- **Proteksi Path Traversal**: Membersihkan karakter berbahaya pada parameter `formatId` dan `fileId` menggunakan fungsi aman `path.basename`.
- **Pembersihan Otomatis (TTL File Cleanup)**: File media disimpan sementara di sistem dan otomatis dibersihkan oleh `tempStorage.cleanupExpired()` setelah durasi habis.

---

## 📁 Struktur Direktori Project

```text
isave/
├── public/                  # Asset gambar publik, favicon, & PWA manifest.json
├── src/
│   ├── app/                 # Next.js App Router (Halaman, Layout, API Routes)
│   │   ├── api/
│   │   │   ├── extract/     # Endpoint POST /api/extract
│   │   │   └── download/    # Endpoint POST & GET /api/download
│   │   ├── layout.tsx       # Root layout, Metadata SEO & JSON-LD
│   │   └── page.tsx         # Halaman utama aplikasi
│   ├── components/          # Komponen UI React
│   │   ├── DownloaderWorkspace.tsx  # Area input URL, inline preview, & opsi unduh
│   │   ├── QrCodeModal.tsx          # Modal QR Code untuk mobile handoff
│   │   ├── BookmarkletModal.tsx     # Modal panduan bookmarklet PC
│   │   ├── ThemeSwitcher.tsx        # Toggle tema Dark / Light / System
│   │   ├── Navbar.tsx               # Navigasi utama & menu mobile
│   │   ├── Features.tsx             # Kartu fitur unggulan
│   │   ├── HowItWorks.tsx           # Panduan 3 langkah penggunaan
│   │   ├── FAQSection.tsx           # Pertanyaan umum (FAQ)
│   │   └── Footer.tsx               # Footer & tautan navigasi
│   ├── lib/                 # Logika bisnis & modul pendukung
│   │   ├── extractors/      # Extractor Manager & parser platform
│   │   ├── audioOptions.ts  # Generator pilihan bitrate audio (320k/192k/128k)
│   │   ├── carouselZip.ts   # Modul bundling slide foto ke ZIP via JSZip
│   │   ├── i18n.ts          # Kamus multi-bahasa (ID / EN / ES) & language detector
│   │   ├── mediaDownloader.ts # Engine pengunduhan & merger FFmpeg
│   │   ├── rateLimit.ts     # In-memory IP rate limiter
│   │   ├── security.ts      # Validator keamanan & penangkal SSRF
│   │   └── tempStorage.ts   # Manajer penyimpanan sementara & auto-cleanup
│   └── types/               # Definisi tipe TypeScript
├── ARCHITECTURE.md          # Dokumentasi teknis arsitektur
├── SPEC.md                  # Spesifikasi fitur & persyaratan
└── README.md                # Dokumentasi utama project
```

---

## 📄 Lisensi

Project ini dirilis di bawah lisensi **[MIT License](LICENSE)**. Bebas kamu gunakan, modifikasi, dan kembangkan lebih lanjut!
