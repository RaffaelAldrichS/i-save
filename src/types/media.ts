export type PlatformType = 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'generic';

export interface MediaFormat {
  id: string;
  quality: string;        // e.g. '1080p', '720p', 'audio-only'
  ext: string;            // e.g. 'mp4', 'mp3', 'm4a'
  url?: string;           // Direct URL if available
  formatId?: string;      // Engine-specific format ID
  requiresMerge: boolean; // True if audio and video need FFmpeg merging
  filesize?: number;
  type: 'video' | 'audio' | 'image';
}

export interface MediaMetadata {
  id: string;
  url: string;
  platform: PlatformType;
  title: string;
  thumbnail: string;
  duration?: number;      // Seconds
  author?: string;
  formats: MediaFormat[];
}

export interface ExtractResponse {
  success: boolean;
  data?: MediaMetadata;
  error?: string;
}
