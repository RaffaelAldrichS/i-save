# Architecture Document — `isave`

## 1. System Architecture

```
                    ┌─────────────────────────┐
                    │      Client Browser     │
                    │   (Next.js App Router)  │
                    └────────────┬────────────┘
                                 │
                   HTTP POST /api/extract & /api/download
                                 │
                    ┌────────────▼────────────┐
                    │    Next.js API Routes   │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         │                                               │
┌────────▼────────────────┐                    ┌─────────▼───────────────┐
│ Custom Direct Parsers   │                    │ yt-dlp Core Wrapper     │
│ (TikTok, IG, FB, etc.)  │                    │ (YouTube & General)     │
└────────┬────────────────┘                    └─────────┬───────────────┘
         │                                               │
         └───────────────────────┬───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Temp Storage & FFmpeg  │
                    │    Processing Module    │
                    └────────────┬────────────┘
                                 │
                     File Download Stream / TTL
```

## 2. Directory Structure Blueprint
```
isave/
├── public/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── extract/route.ts
│   │   │   ├── download/route.ts
│   │   │   └── cleanup/route.ts
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/               # Shadcn UI components
│   │   ├── UrlForm.tsx       # Input URL form
│   │   ├── MediaPreview.tsx  # Result preview & format selector
│   │   └── ProgressModal.tsx # Processing & download indicator
│   ├── lib/
│   │   ├── extractors/
│   │   │   ├── index.ts      # Extractor Manager/Router
│   │   │   ├── youtube.ts    # YouTube extractor
│   │   │   ├── tiktok.ts     # TikTok extractor
│   │   │   ├── instagram.ts  # Instagram extractor
│   │   │   └── types.ts      # Shared interfaces
│   │   ├── ffmpeg.ts         # FFmpeg merger & converter wrapper
│   │   ├── tempStorage.ts    # File management & TTL cleanup
│   │   └── utils.ts
│   └── types/
│       └── media.ts
├── ARCHITECTURE.md
├── SPEC.md
└── package.json
```

## 3. Extractor Interface Contract
Setiap platform extractor mengimplementasikan interface `MediaExtractor`:

```typescript
export interface MediaFormat {
  id: string;
  quality: string;       // e.g., '1080p', '720p', 'audio-only'
  ext: string;           // e.g., 'mp4', 'mp3', 'm4a'
  url?: string;          // Direct URL if available
  formatId?: string;     // yt-dlp format code if applicable
  requiresMerge: boolean;// True jika video & audio terpisah (e.g. YouTube 1080p+)
  filesize?: number;
}

export interface MediaMetadata {
  id: string;
  platform: 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'generic';
  title: string;
  thumbnail: string;
  duration?: number; // seconds
  author?: string;
  formats: MediaFormat[];
}

export interface MediaExtractor {
  name: string;
  supports(url: string): boolean;
  extract(url: string): Promise<MediaMetadata>;
}
```

## 4. Temporary File Lifecycle & Cleanup
1. File hasil download/merge disimpan di folder OS temp (`os.tmpdir()/isave-downloads/`).
2. Setiap job diberikan `jobId` acak (UUID).
3. Cron job / interval otomatis menghapus file yang berumur > 15 menit.
