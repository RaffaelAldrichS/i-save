import { MediaFormat } from '@/types/media';

export type AudioBitrate = '320kbps' | '192kbps' | '128kbps';

export function generateAudioFormats(mediaId: string): MediaFormat[] {
  return [
    {
      id: `${mediaId}-audio-320kbps`,
      quality: 'Audio MP3 (320kbps High Quality)',
      ext: 'mp3',
      formatId: 'audio-320kbps',
      requiresMerge: false,
      type: 'audio',
    },
    {
      id: `${mediaId}-audio-192kbps`,
      quality: 'Audio MP3 (192kbps Standard)',
      ext: 'mp3',
      formatId: 'audio-192kbps',
      requiresMerge: false,
      type: 'audio',
    },
    {
      id: `${mediaId}-audio-128kbps`,
      quality: 'Audio MP3 (128kbps Ringtone/Compact)',
      ext: 'mp3',
      formatId: 'audio-128kbps',
      requiresMerge: false,
      type: 'audio',
    },
  ];
}
