import { describe, it, expect } from 'vitest';
import { POST, GET } from '../route';
import { NextRequest } from 'next/server';
import { createSignedDownloadUrl } from '@/lib/signedUrl';
import { processWorkerJob } from '@/lib/jobQueue';
import { jobStore } from '@/lib/jobStore';

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
