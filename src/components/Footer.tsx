import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-zinc-200/80 dark:border-zinc-800/80 py-8 mt-auto bg-zinc-50/50 dark:bg-zinc-950/50 text-xs text-center text-zinc-500">
      <div className="max-w-6xl mx-auto px-4 space-y-2">
        <p>© {new Date().getFullYear()} isave.app — Multi-Platform Media Downloader</p>
        <p className="text-[11px] text-zinc-400">
          Stateless & Privacy-First. Tidak menyimpan riwayat unduhan atau data pengguna.
        </p>
      </div>
    </footer>
  );
};
