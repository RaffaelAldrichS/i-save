import React from 'react';
import { Download } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-850 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-100">
          <div className="p-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
            <Download className="w-4 h-4" />
          </div>
          <span>isave<span className="text-zinc-500 font-normal">.app</span></span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
            v1.0.0 • STATELESS
          </span>
        </div>
      </div>
    </header>
  );
};
