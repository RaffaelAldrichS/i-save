import { describe, it, expect, vi } from 'vitest';
import { POST, GET } from '../route';
import { NextRequest } from 'next/server';
import { createSignedDownloadUrl } from '@/lib/signedUrl';
import { processWorkerJob } from '@/lib/jobQueue';
import { jobStore } from '@/lib/jobStore';
import { mediaStorage } from '@/lib/storage';

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

  it('should return 403 for unsigned download in GET', async () => {
    const req = new NextRequest('http://localhost/api/download?fileId=some-file-id', {
      method: 'GET',
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error).toContain('Tanda tangan unduhan dan masa berlaku wajib ada');
  });

  it('should return 403 for invalid signature in GET', async () => {
    const req = new NextRequest('http://localhost/api/download?fileId=some-file-id&expires=9999999999&signature=invalid_sig', {
      method: 'GET',
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error).toContain('Tanda tangan unduhan tidak valid');
  });

  it('should return 403 for expired signature in GET', async () => {
    const expiredPath = createSignedDownloadUrl('some-file-id', 'media.mp4', -100);
    const req = new NextRequest(`http://localhost${expiredPath}`, {
      method: 'GET',
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error).toContain('Tautan unduhan telah kadaluarsa');
  });

  it('should return 200 and private Blob stream for valid signature', async () => {
    const fileId = 'valid-private-blob-id';
    const filename = 'sample.mp4';
    const signedPath = createSignedDownloadUrl(fileId, filename, 900);

    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(Buffer.from('mock video stream content'));
        controller.close();
      },
    });

    const getBlobSpy = vi.spyOn(mediaStorage, 'getPrivateBlobStream').mockResolvedValueOnce({
      stream: mockStream,
      contentType: 'video/mp4',
      size: 25,
    });

    const req = new NextRequest(`http://localhost${signedPath}`, {
      method: 'GET',
    });

    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('video/mp4');
    expect(res.headers.get('content-disposition')).toContain('attachment; filename="sample.mp4"');
    getBlobSpy.mockRestore();
  });

  it('fails closed in production if Blob credentials missing on GET', async () => {
    const oldEnv = process.env.NODE_ENV;
    const oldToken = process.env.BLOB_READ_WRITE_TOKEN;
    const oldSecret = process.env.DOWNLOAD_SIGNING_SECRET;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    (process.env as Record<string, string>)['NODE_ENV'] = 'production';
    process.env.DOWNLOAD_SIGNING_SECRET = 'test-secret-123';

    const fileId = 'valid-file-id';
    const filename = 'sample.mp4';
    const signedPath = createSignedDownloadUrl(fileId, filename, 900);

    try {
      const req = new NextRequest(`http://localhost${signedPath}`, {
        method: 'GET',
      });

      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error).toContain('BLOB_READ_WRITE_TOKEN environment variable is missing');
    } finally {
      if (oldToken) process.env.BLOB_READ_WRITE_TOKEN = oldToken;
      else delete process.env.BLOB_READ_WRITE_TOKEN;
      if (oldSecret) process.env.DOWNLOAD_SIGNING_SECRET = oldSecret;
      else delete process.env.DOWNLOAD_SIGNING_SECRET;
      (process.env as Record<string, string>)['NODE_ENV'] = oldEnv;
    }
  });

  it('should return 404 for non-existent file ID in signed GET request', async () => {
    const signedPath = createSignedDownloadUrl('non-existent-id', 'media.mp4');
    const req = new NextRequest(`http://localhost${signedPath}`, {
      method: 'GET',
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error).toContain('File tidak ditemukan atau telah kadaluarsa');
  });

  it('should return 202 Accepted for enqueued download job and process error in worker', async () => {
    const req = new NextRequest('http://localhost/api/download', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=invalid_id_test_500', formatId: 'invalid-fmt' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(202);
    expect(json.success).toBe(true);
    expect(json.jobId).toBeDefined();
    expect(json.status).toBe('queued');

    // Run worker process asynchronously
    await processWorkerJob(json.jobId);
    const job = jobStore.getJob(json.jobId);
    expect(job?.stage).toBe('failed');
    expect(job?.error).toBeDefined();
  });
});
