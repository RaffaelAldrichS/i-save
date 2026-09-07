import type { Metadata } from "next";
import { Rethink_Sans } from "next/font/google";
import "./globals.css";

const rethinkSans = Rethink_Sans({
  variable: "--font-rethink-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "iSAVE — Unduh Media Tanpa Batas",
  description: "Simpan video, audio, dan konten dari YouTube, TikTok, Instagram, dan Facebook dengan cepat, gratis, dan tanpa watermark.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${rethinkSans.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-text font-sans selection:bg-accent selection:text-primary">
        {children}
      </body>
    </html>
  );
}
