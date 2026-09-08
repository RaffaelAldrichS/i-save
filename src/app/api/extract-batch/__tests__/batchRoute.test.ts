import { describe, it, expect } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

describe('POST /api/extract-batch', () => {
  it('returns 400 if no valid input is provided', async () => {
    const req = new NextRequest('http://localhost/api/extract-batch', {
      method: 'POST',
      body: JSON.stringify({ input: '' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain('Tidak ada URL valid');
  });

  it('extracts batch from multiline input text', async () => {
    const req = new NextRequest('http://localhost/api/extract-batch', {
      method: 'POST',
      body: JSON.stringify({
        input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ\nhttps://www.tiktok.com/@user/video/1234567890123456789',
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
  }, 15000);
});
