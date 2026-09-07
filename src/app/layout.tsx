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
  title: "iSAVE — Unduh Video & Audio YouTube, TikTok, Instagram Gratis",
  description: "Simpan video MP4, MP3, dan konten media dari YouTube, TikTok, Instagram, dan Facebook dengan cepat, 100% gratis, tanpa watermark.",
  keywords: ["unduh video tiktok", "download youtube mp4", "instagram reel downloader", "tiktok no watermark", "isave", "media downloader"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "iSAVE — Unduh Video & Audio YouTube, TikTok, Instagram Gratis",
    description: "Simpan video MP4, MP3, dan konten media dari YouTube, TikTok, Instagram, dan Facebook tanpa watermark.",
    url: "https://isave.app",
    siteName: "iSAVE",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "iSAVE — Unduh Video & Audio Tanpa Watermark",
    description: "Simpan video MP4 & MP3 gratis dari YouTube, TikTok, Instagram, dan Facebook.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "iSAVE",
  "url": "https://isave.app",
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "All",
  "description": "Pengunduh media gratis tanpa watermark untuk YouTube, TikTok, Instagram, dan Facebook.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
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
