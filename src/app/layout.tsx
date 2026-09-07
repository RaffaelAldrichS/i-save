import type { Metadata } from "next";
import { Rethink_Sans } from "next/font/google";
import "./globals.css";

const rethinkSans = Rethink_Sans({
  variable: "--font-rethink-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://isave.app"),
  title: "iSave Downloader — Unduh Video & Audio HD Tanpa Watermark Gratis",
  description: "Pengunduh media tercepat tanpa watermark. Simpan video MP4 HD & audio MP3 jernih dari YouTube, TikTok, Instagram, dan Facebook secara gratis tanpa pendaftaran.",
  keywords: [
    "iSave Downloader",
    "unduh video tiktok tanpa watermark",
    "download youtube mp4 hd",
    "instagram reel downloader online",
    "convert youtube to mp3",
    "facebook video downloader",
    "isave media downloader",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "iSave Downloader — Unduh Video & Audio HD Tanpa Watermark",
    description: "Simpan video MP4 & audio MP3 kualitas terbaik dari YouTube, TikTok, Instagram, dan Facebook secara gratis dan instan.",
    url: "https://isave.app",
    siteName: "iSave Downloader",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "iSave Downloader — Pengunduh Media HD Tanpa Watermark",
    description: "Simpan video MP4 & audio MP3 gratis dari YouTube, TikTok, Instagram, dan Facebook dalam hitungan detik.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "iSave Downloader",
  "url": "https://isave.app",
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "All",
  "description": "Pengunduh media online gratis tanpa watermark untuk YouTube, TikTok, Instagram, dan Facebook.",
  "softwareVersion": "1.0.0",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "featureList": [
    "Unduh video TikTok tanpa watermark",
    "Konversi video YouTube ke MP4 HD dan MP3",
    "Simpan Instagram Reels & Posts HD",
    "Unduh video Facebook kualitas tinggi",
    "100% Stateless & Bebas Pendaftaran"
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${rethinkSans.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-text font-sans selection:bg-accent selection:text-primary">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-surface focus:text-primary focus:border focus:border-primary font-bold shadow-lg"
        >
          Lompati ke konten utama
        </a>
        {children}
      </body>
    </html>
  );
}
