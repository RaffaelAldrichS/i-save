import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExtract = vi.fn();

vi.mock('@/lib/extractors', () => ({
  extractorManager: {
    extract: (...args: unknown[]) => mockExtract(...args),
  },
}));

vi.mock('@/lib/rateLimit', () => ({
  apiRateLimiter: {
    check: vi.fn(() => ({ allowed: true, limit: 10, remaining: 9, retryAfterSeconds: 0 })),
  },
  getClientIp: vi.fn(() => '203.0.113.1'),
}));

import { POST } from '../route';
import { NextRequest } from 'next/server';

beforeEach(() => {
  mockExtract.mockReset();
});

describe('POST /api/extract (happy path)', () => {
  it('returns extracted metadata for a valid YouTube URL', async () => {
    mockExtract.mockResolvedValue({
      id: 'dQw4w9WgXcQ',
      platform: 'youtube',
      title: 'Rick Astley - Never Gonna Give You Up',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg',
      formats: [
        { id: 'yt-dQw4w9WgXcQ-hd', quality: 'Video HD', ext: 'mp4', requiresMerge: false, type: 'video' },
        { id: 'yt-dQw4w9WgXcQ-mp3', quality: '320kbps MP3', ext: 'mp3', requiresMerge: false, type: 'audio' },
      ],
    });

    const req = new NextRequest('http://localhost/api/extract', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.platform).toBe('youtube');
    expect(json.data.formats.length).toBe(2);
    expect(mockExtract).toHaveBeenCalledWith('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  it('returns 400 when URL is missing', async () => {
    const req = new NextRequest('http://localhost/api/extract', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain('URL wajib diisi');
  });

  it('returns 400 when URL is too long', async () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2000);
    const req = new NextRequest('http://localhost/api/extract', {
      method: 'POST',
      body: JSON.stringify({ url: longUrl }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('returns 400 for an SSRF-blocked internal URL', async () => {
    const req = new NextRequest('http://localhost/api/extract', {
      method: 'POST',
      body: JSON.stringify({ url: 'http://127.0.0.1:3000/secret' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain('SSRF');
  });

  it('returns 400 when extractor throws', async () => {
    mockExtract.mockRejectedValue(new Error('Platform tidak didukung'));

    const req = new NextRequest('http://localhost/api/extract', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://www.example.com/video/123' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });
});
