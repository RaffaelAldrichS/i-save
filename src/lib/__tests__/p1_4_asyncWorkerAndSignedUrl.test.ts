import { describe, it, expect, beforeEach } from 'vitest';
import { enqueueDownloadJob, processWorkerJob } from '../jobQueue';
import { jobStore, JobStore } from '../jobStore';
import { createSignedDownloadUrl, verifySignedDownloadUrl } from '../signedUrl';
import { POST as downloadPostHandler, GET as downloadGetHandler } from '../../app/api/download/route';
import { NextRequest } from 'next/server';

describe('P1.4 — Async Queue, Worker Isolation, Restart Persistence & Signed Delivery', () => {
  beforeEach(() => {
    jobStore.reset();
  });

  describe('Signed & Expiring Download URLs', () => {
    it('generates a valid signed download URL with expiration and signature', () => {
      const url = createSignedDownloadUrl('file-123', 'video.mp4', 300);
      expect(url).toContain('/api/download?fileId=file-123');
      expect(url).toContain('expires=');
      expect(url).toContain('signature=');
      expect(url).toContain('filename=video.mp4');
    });

    it('verifies valid signed download URLs', () => {
      const fileId = 'file-abc';
      const filename = 'sample.mp4';
      const expires = String(Math.floor(Date.now() / 1000) + 600);

      const signedUrl = createSignedDownloadUrl(fileId, filename, 600);
      const parsed = new URL(`http://localhost${signedUrl}`);
      const sig = parsed.searchParams.get('signature');

      const verification = verifySignedDownloadUrl(fileId, expires, sig, filename);
      expect(verification.valid).toBe(true);
    });

    it('rejects expired signed download URLs', () => {
      const fileId = 'file-expired';
      const filename = 'test.mp4';
      const expiredTime = String(Math.floor(Date.now() / 1000) - 10); // 10s in past

      const verification = verifySignedDownloadUrl(fileId, expiredTime, 'fakesig', filename);
      expect(verification.valid).toBe(false);
      expect(verification.error).toContain('kadaluarsa');
    });

    it('rejects tampered signatures', () => {
      const fileId = 'file-tampered';
      const filename = 'test.mp4';
      const expires = String(Math.floor(Date.now() / 1000) + 600);

      const verification = verifySignedDownloadUrl(fileId, expires, 'invalid_signature_hash', filename);
      expect(verification.valid).toBe(false);
      expect(verification.error).toContain('tidak valid');
    });
  });

  describe('Async Job Queue & Immediate Response (P1.4)', () => {
    it('creates job and pushes to persistent queue without blocking HTTP handler', async () => {
      const job = await enqueueDownloadJob('job-async-1', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '720p');

      expect(job.id).toBe('job-async-1');
      expect(job.stage).toBe('queued');

      const storedJob = jobStore.getJob('job-async-1');
      expect(storedJob).not.toBeNull();
      expect(storedJob?.stage).toBe('queued');
    });

    it('POST /api/download enqueues job and returns immediate 202/200 response', async () => {
      const oldEnv = process.env.NODE_ENV;
      // Simulate production async execution (no sync wait)
      (process.env as Record<string, string>)['NODE_ENV'] = 'production';
      try {
        const req = new NextRequest('http://localhost/api/download', {
          method: 'POST',
          body: JSON.stringify({
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            formatId: '720p',
            jobId: 'job-prod-123',
          }),
        });

        const res = await downloadPostHandler(req);
        const json = await res.json();

        expect(res.status).toBe(202);
        expect(json.success).toBe(true);
        expect(json.jobId).toBe('job-prod-123');
        expect(json.status).toBe('queued');
        expect(json.progressUrl).toContain('jobId=job-prod-123');
      } finally {
        (process.env as Record<string, string>)['NODE_ENV'] = oldEnv;
      }
    });
  });

  describe('Restart Persistence & Worker State Machine', () => {
    it('job state survives Store re-instantiation (simulating process restart / cold start)', () => {
      const store1 = new JobStore();
      store1.createJob('restart-job-1', 'https://www.youtube.com/watch?v=123', '1080p');
      store1.updateJobProgress('restart-job-1', 50, 'processing', 'FFmpeg transcoding...');

      // Re-instantiate Store instance
      const store2 = new JobStore();
      const jobAfterRestart = store2.getJob('restart-job-1');

      expect(jobAfterRestart).not.toBeNull();
      expect(jobAfterRestart?.id).toBe('restart-job-1');
      expect(jobAfterRestart?.stage).toBe('processing');
      expect(jobAfterRestart?.percent).toBe(50);
    });

    it('worker process transitions job state through failure on invalid URL', async () => {
      const store = new JobStore();
      store.createJob('fail-job-99', 'http://127.0.0.1/secret', 'best');

      await processWorkerJob('fail-job-99');

      const failedJob = store.getJob('fail-job-99');
      expect(failedJob?.stage).toBe('failed');
      expect(failedJob?.error).toBeDefined();
      expect(failedJob?.error?.code).toBe('INVALID_URL');
    });
  });

  describe('GET /api/download Signed URL Verification', () => {
    it('GET /api/download rejects requests with invalid/expired signature headers', async () => {
      const req = new NextRequest('http://localhost/api/download?fileId=abc&expires=100&signature=bad', {
        method: 'GET',
      });

      const res = await downloadGetHandler(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error).toContain('kadaluarsa');
    });
  });
});
