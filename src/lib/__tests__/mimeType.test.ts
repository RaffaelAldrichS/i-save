import { describe, it, expect } from 'vitest';
import { getMimeType } from '../security';

describe('getMimeType', () => {
  it('returns correct MIME type for video formats', () => {
    expect(getMimeType('mp4')).toBe('video/mp4');
    expect(getMimeType('.mp4')).toBe('video/mp4');
    expect(getMimeType('webm')).toBe('video/webm');
  });

  it('returns correct MIME type for audio formats', () => {
    expect(getMimeType('mp3')).toBe('audio/mpeg');
    expect(getMimeType('m4a')).toBe('audio/mp4');
    expect(getMimeType('wav')).toBe('audio/wav');
  });

  it('returns correct MIME type for image formats', () => {
    expect(getMimeType('jpg')).toBe('image/jpeg');
    expect(getMimeType('jpeg')).toBe('image/jpeg');
    expect(getMimeType('png')).toBe('image/png');
    expect(getMimeType('webp')).toBe('image/webp');
  });

  it('returns correct MIME type for archives and subtitles', () => {
    expect(getMimeType('zip')).toBe('application/zip');
    expect(getMimeType('srt')).toBe('text/plain; charset=utf-8');
    expect(getMimeType('vtt')).toBe('text/vtt; charset=utf-8');
    expect(getMimeType('txt')).toBe('text/plain; charset=utf-8');
  });

  it('defaults to application/octet-stream for unknown extensions', () => {
    expect(getMimeType('unknown')).toBe('application/octet-stream');
  });
});
