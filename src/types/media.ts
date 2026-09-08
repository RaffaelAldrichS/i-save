export type PlatformType =
  | 'youtube'
  | 'tiktok'
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'reddit'
  | 'threads'
  | 'pinterest'
  | 'generic';

export type ContentType =
  | 'video'
  | 'audio'
  | 'image'
  | 'carousel'
  | 'reel'
  | 'post'
  | 'story'
  | 'short'
  | 'unknown';

export type MediaType = 'video' | 'audio' | 'image' | 'gallery' | 'text';

export interface MediaItem {
  id: string;
  type: MediaType;
  mimeType: string;
  quality: string;        // e.g. '1080p', '720p', 'audio-only', 'All Photos (ZIP)'
  ext: string;            // e.g. 'mp4', 'mp3', 'm4a', 'jpg', 'zip'
  width?: number;
  height?: number;
  filesize?: number | null;
  url?: string;           // Direct URL if available
  formatId?: string;      // Engine-specific format ID
  requiresMerge?: boolean;// True if audio and video need FFmpeg merging
  images?: string[];      // For carousel / photo slides
}

export interface MediaSource {
  url: string;
  domain: string;
}

export interface MediaAuthor {
  username?: string;
  displayName?: string;
}

export interface MediaResult {
  id: string;
  url: string;
  platform: PlatformType;
  contentType: ContentType;
  source: MediaSource;
  author?: string | MediaAuthor;
  title: string;
  thumbnail: string;
  duration?: number;      // Seconds
  previewUrl?: string;    // Direct preview video/audio stream URL if available
  images?: string[];      // Array of photo slide URLs
  media: MediaItem[];
  formats: MediaItem[];   // Alias for media[]
}

// Backward compatibility type aliases
export type MediaMetadata = MediaResult;
export type MediaFormat = MediaItem;

export interface ExtractResponse {
  success: boolean;
  data?: MediaResult;
  error?: string;
}
