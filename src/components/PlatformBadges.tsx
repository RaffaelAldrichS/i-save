import React from 'react';
import {
  YoutubeIcon,
  TiktokIcon,
  InstagramIcon,
  FacebookIcon,
  TwitterIcon,
  RedditIcon,
  ThreadsIcon,
  PinterestIcon,
} from './BrandIcons';

export const PlatformBadges: React.FC = () => {
  const platforms = [
    { name: 'YouTube', icon: YoutubeIcon, color: 'text-rose-500' },
    { name: 'TikTok', icon: TiktokIcon, color: 'text-cyan-400' },
    { name: 'Instagram', icon: InstagramIcon, color: 'text-pink-500' },
    { name: 'Facebook', icon: FacebookIcon, color: 'text-blue-500' },
    { name: 'Twitter/X', icon: TwitterIcon, color: 'text-slate-200' },
    { name: 'Reddit', icon: RedditIcon, color: 'text-orange-500' },
    { name: 'Threads', icon: ThreadsIcon, color: 'text-emerald-400' },
    { name: 'Pinterest', icon: PinterestIcon, color: 'text-red-500' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
      <span className="text-xs font-semibold text-text-muted mr-1">Dukungan Platform:</span>
      {platforms.map((p) => {
        const Icon = p.icon;
        return (
          <span
            key={p.name}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border text-xs font-semibold text-text shadow-xs hover:border-border-hover transition-colors"
          >
            <Icon className={`w-3.5 h-3.5 ${p.color}`} aria-hidden="true" />
            {p.name}
          </span>
        );
      })}
    </div>
  );
};
