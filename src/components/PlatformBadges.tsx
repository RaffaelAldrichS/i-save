import React from 'react';
import { YoutubeIcon, TiktokIcon, InstagramIcon, FacebookIcon } from './BrandIcons';

export const PlatformBadges: React.FC = () => {
  const platforms = [
    { name: 'YouTube', icon: YoutubeIcon, color: 'text-red-600' },
    { name: 'TikTok', icon: TiktokIcon, color: 'text-text' },
    { name: 'Instagram', icon: InstagramIcon, color: 'text-pink-600' },
    { name: 'Facebook', icon: FacebookIcon, color: 'text-blue-600' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <span className="text-xs font-semibold text-text-muted mr-1">Dukungan Platform:</span>
      {platforms.map((p) => {
        const Icon = p.icon;
        return (
          <span
            key={p.name}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border text-xs font-semibold text-text shadow-xs hover:border-border-hover transition-colors"
          >
            <Icon className={`w-3.5 h-3.5 ${p.color}`} />
            {p.name}
          </span>
        );
      })}
    </div>
  );
};
