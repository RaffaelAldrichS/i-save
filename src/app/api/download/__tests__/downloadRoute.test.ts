import { describe, it, expect } from 'vitest';
import { POST, GET } from '../route';
import { NextRequest } from 'next/server';

describe('POST & GET /api/download', () => {
  it('should return 400 if url or formatId is missing in POST', async () => {
    const req = new NextRequest('http://localhost/api/download', {
      method: 'POST',
      body: JSON.stringify({ url: '' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain('URL dan formatId wajib diisi');
  });

  it('should return 404 for non-existent file ID in GET', async () => {
    const req = new NextRequest('http://localhost/api/download?fileId=invalid-id', {
      method: 'GET',
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error).toContain('File tidak ditemukan atau telah kadaluarsa');
  });
});
