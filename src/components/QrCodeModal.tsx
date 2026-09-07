"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { X, Smartphone, QrCode, Copy, Check, ShieldCheck } from "lucide-react";

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  downloadUrl: string;
  filename: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  downloadUrl,
  filename,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://isave.app";
  const fullUrl = downloadUrl.startsWith("http") ? downloadUrl : `${origin}${downloadUrl}`;

  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(fullUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: "#0E2E1A",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(null));
  }, [isOpen, fullUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore copy error
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm bg-surface border border-border rounded-3xl p-6 shadow-2xl space-y-5 text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup modal QR"
          className="absolute top-4 right-4 p-2 rounded-xl text-text-muted hover:text-text hover:bg-surface-soft transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 pt-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-accent-soft text-primary flex items-center justify-center mb-3">
            <Smartphone className="w-6 h-6 text-secondary" />
          </div>
          <h2 id="qr-modal-title" className="font-extrabold text-xl text-primary">
            Scan & Unduh di HP
          </h2>
          <p className="text-xs text-text-muted">
            Arahkan kamera HP ke QR Code di bawah untuk menyimpan langsung ke Galeri HP
          </p>
        </div>

        {/* QR Code Canvas Container */}
        <div className="p-4 bg-surface-soft border border-border rounded-2xl flex flex-col items-center justify-center min-h-[220px]">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="QR Code Unduhan Mobile"
              className="w-52 h-52 rounded-xl shadow-xs border border-border bg-white p-2"
            />
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
              <QrCode className="w-5 h-5 animate-pulse" />
              <span>Menyiapkan Kode QR...</span>
            </div>
          )}

          <p className="text-[11px] font-mono text-text-muted mt-2 truncate max-w-[240px]">
            {filename}
          </p>
        </div>

        {/* Security & Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-surface-soft border border-border hover:border-secondary text-primary flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-secondary" />
                <span>Tautan Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-secondary" />
                <span>Salin Tautan Unduhan Direct</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
            <span>Stateless & Langsung Terhubung ke Perangkat Anda</span>
          </div>
        </div>
      </div>
    </div>
  );
};
