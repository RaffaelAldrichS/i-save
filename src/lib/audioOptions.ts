import { MediaItem } from '@/types/media';

export type AudioBitrate = '320kbps' | '192kbps' | '128kbps';

export function generateAudioFormats(mediaId: string): MediaItem[] {
  return [
    {
      id: `${mediaId}-audio-m4a`,
      type: 'audio',
      mimeType: 'audio/mp4',
      quality: 'Audio M4A / AAC (Kualitas Asli)',
      ext: 'm4a',
      formatId: 'audio-m4a',
      requiresMerge: false,
    },
    {
      id: `${mediaId}-audio-320kbps`,
      type: 'audio',
      mimeType: 'audio/mpeg',
      quality: 'Audio MP3 (320kbps High Quality)',
      ext: 'mp3',
      formatId: 'audio-320kbps',
      requiresMerge: false,
    },
    {
      id: `${mediaId}-audio-192kbps`,
      type: 'audio',
      mimeType: 'audio/mpeg',
      quality: 'Audio MP3 (192kbps Standard)',
      ext: 'mp3',
      formatId: 'audio-192kbps',
      requiresMerge: false,
    },
    {
      id: `${mediaId}-audio-128kbps`,
      type: 'audio',
      mimeType: 'audio/mpeg',
      quality: 'Audio MP3 (128kbps Ringtone/Compact)',
      ext: 'mp3',
      formatId: 'audio-128kbps',
      requiresMerge: false,
    },
  ];
}
