import { describe, it, expect } from 'vitest';
import { generateAudioFormats } from '../audioOptions';

describe('Audio Bitrate Generator', () => {
  it('generates 320kbps, 192kbps, and 128kbps audio formats for a given media', () => {
    const formats = generateAudioFormats('media-123');
    
    expect(formats.length).toBe(3);
    expect(formats[0].quality).toBe('Audio MP3 (320kbps High Quality)');
    expect(formats[0].ext).toBe('mp3');
    expect(formats[1].quality).toBe('Audio MP3 (192kbps Standard)');
    expect(formats[2].quality).toBe('Audio MP3 (128kbps Ringtone/Compact)');
  });

  it('correctly formats formatId with selected bitrate', () => {
    const formats = generateAudioFormats('track-456');
    expect(formats[0].formatId).toBe('audio-320kbps');
    expect(formats[1].formatId).toBe('audio-192kbps');
    expect(formats[2].formatId).toBe('audio-128kbps');
  });
});
