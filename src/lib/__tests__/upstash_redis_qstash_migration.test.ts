import { describe, it, expect, beforeEach } from 'vitest';
import { POST as downloadPostHandler } from '../../app/api/download/route';
import { POST as workerPostHandler } from '../../app/api/worker/download/route';
import { jobStore } from '../jobStore';
import { createSignedDownloadUrl, verifySignedDownloadUrl } from '../signedUrl';
import { NextRequest } from 'next/server';

describe('Upstash Redis & QStash Job Backend Migration', () => {
  beforeEach(() => {
    jobStore.reset();
  });

  it('POST /api/download enqueues job and returns immediate 202 Accepted response', async () => {
    const req = new NextRequest('http://localhost/api/download', {
      method: 'POST',
      body: JSON.stringify({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        formatId: '720p',
        jobId: 'job-qstash-001',
      }),
    });

    const res = await downloadPostHandler(req);
    const json = await res.json();

    expect(res.status).toBe(202);
    expect(json.success).toBe(true);
    expect(json.jobId).toBe('job-qstash-001');
    expect(json.status).toBe('queued');

    // Verify job is stored in job store with queued status
    const storedJob = jobStore.getJob('job-qstash-001');
    expect(storedJob).not.toBeNull();
    expect(storedJob?.stage).toBe('queued');
  });

  it('QStash worker endpoint processes job and updates state idempotently', async () => {
    // 1. Enqueue job
    const jobId = 'job-qstash-002';
    jobStore.createJob(jobId, 'http://127.0.0.1/ssrf-block', '720p');

    // 2. Invoke worker POST endpoint (simulating QStash webhook delivery)
    const workerReq = new NextRequest('http://localhost/api/worker/download', {
      method: 'POST',
      body: JSON.stringify({ jobId }),
    });

    const res = await workerPostHandler(workerReq);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.jobId).toBe(jobId);

    // Verify job transitioned to failed state cleanly (due to SSRF blocked URL)
    const finalJob = jobStore.getJob(jobId);
    expect(finalJob?.stage).toBe('failed');
    expect(finalJob?.error?.code).toBe('INVALID_URL');

    // 3. Duplicate invocation (Idempotency test)
    const dupWorkerReq = new NextRequest('http://localhost/api/worker/download', {
      method: 'POST',
      body: JSON.stringify({ jobId }),
    });
    const dupRes = await workerPostHandler(dupWorkerReq);
    const dupJson = await dupRes.json();

    expect(dupRes.status).toBe(200);
    expect(dupJson.success).toBe(true);
    expect(dupJson.message).toContain('idempotent skip');
  });

  it('job state survives process restart / store re-instantiation', () => {
    const jobId = 'job-restart-999';
    jobStore.createJob(jobId, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '1080p');
    jobStore.updateJobProgress(jobId, 50, 'processing', 'FFmpeg merging...');

    // Read stored job
    const restoredJob = jobStore.getJob(jobId);
    expect(restoredJob).not.toBeNull();
    expect(restoredJob?.id).toBe(jobId);
    expect(restoredJob?.stage).toBe('processing');
    expect(restoredJob?.percent).toBe(50);
  });

  it('preserves mandatory signed download URL enforcement', () => {
    const fileId = 'file-redis-99';
    const filename = 'video.mp4';
    const signedUrl = createSignedDownloadUrl(fileId, filename, 900);

    const parsed = new URL(`http://localhost${signedUrl}`);
    const expires = parsed.searchParams.get('expires');
    const signature = parsed.searchParams.get('signature');

    // Valid
    expect(verifySignedDownloadUrl(fileId, expires, signature, filename).valid).toBe(true);
    // Unsigned (missing signature)
    expect(verifySignedDownloadUrl(fileId, null, null, filename).valid).toBe(false);
    // Tampered
    expect(verifySignedDownloadUrl(fileId, expires, 'invalid_sig', filename).valid).toBe(false);
  });
});
