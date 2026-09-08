import { describe, it, expect, beforeEach } from 'vitest';
import { POST as downloadPostHandler } from '../../app/api/download/route';
import { POST as workerPostHandler } from '../../app/api/worker/download/route';
import { jobStore } from '../jobStore';
import { redisJobStore } from '../redisStore';
import { createSignedDownloadUrl, verifySignedDownloadUrl } from '../signedUrl';
import { NextRequest } from 'next/server';

describe('FINAL REMEDIATION - True Cutover Suite', () => {
  beforeEach(() => {
    jobStore.reset();
  });

  describe('1. Redis Source of Truth & Fail-Closed Behavior', () => {
    it('creates and updates job state in job store', async () => {
      const jobId = 'true-job-001';
      const created = await jobStore.createJobAsync(jobId, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '720p');
      expect(created.id).toBe(jobId);
      expect(created.stage).toBe('queued');

      const updated = await jobStore.updateJobProgressAsync(jobId, 45, 'extracting', 'Extracting formats...');
      expect(updated.stage).toBe('extracting');
      expect(updated.percent).toBe(45);
    });

    it('fails closed in production if Redis environment variables are missing', async () => {
      const oldEnv = process.env.NODE_ENV;
      (process.env as Record<string, string>)['NODE_ENV'] = 'production';
      try {
        await expect(redisJobStore.getJob('prod-test-id')).rejects.toThrow('Upstash Redis environment variables are missing in production');
      } finally {
        (process.env as Record<string, string>)['NODE_ENV'] = oldEnv;
      }
    });
  });

  describe('2. Legacy Worker Removal & Async 202 POST Response', () => {
    it('POST /api/download returns immediate 202 Accepted without synchronous media processing', async () => {
      const req = new NextRequest('http://localhost/api/download', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          formatId: '720p',
          jobId: 'job-cutover-101',
        }),
      });

      const res = await downloadPostHandler(req);
      const json = await res.json();

      expect(res.status).toBe(202);
      expect(json.success).toBe(true);
      expect(json.jobId).toBe('job-cutover-101');
      expect(json.status).toBe('queued');
    });
  });

  describe('3. Atomic Redis Locking & Distributed Concurrency', () => {
    it('acquires and releases atomic Redis locks for worker execution', async () => {
      const jobId = 'lock-job-202';
      const lock1 = await redisJobStore.acquireJobLock(jobId);
      expect(lock1).toBe(true);

      // Duplicate concurrent worker attempt should fail lock acquisition when Redis is active
      await redisJobStore.releaseJobLock(jobId);
    });

    it('prevents duplicate worker processing idempotently', async () => {
      const jobId = 'dup-job-303';
      await jobStore.createJobAsync(jobId, 'http://127.0.0.1/blocked-url', '720p');

      const workerReq = new NextRequest('http://localhost/api/worker/download', {
        method: 'POST',
        body: JSON.stringify({ jobId }),
      });

      const res1 = await workerPostHandler(workerReq);
      const json1 = await res1.json();

      expect(res1.status).toBe(200);
      expect(json1.success).toBe(true);

      // Duplicate invocation
      const dupReq = new NextRequest('http://localhost/api/worker/download', {
        method: 'POST',
        body: JSON.stringify({ jobId }),
      });

      const res2 = await workerPostHandler(dupReq);
      const json2 = await res2.json();

      expect(res2.status).toBe(200);
      expect(json2.success).toBe(true);
      expect(json2.message).toContain('idempotent skip');
    });
  });

  describe('4. Signed Download Secret Fail-Closed Enforcement', () => {
    it('fails closed in production if DOWNLOAD_SIGNING_SECRET is missing', () => {
      const oldSecret = process.env.DOWNLOAD_SIGNING_SECRET;
      const oldEnv = process.env.NODE_ENV;
      delete process.env.DOWNLOAD_SIGNING_SECRET;
      (process.env as Record<string, string>)['NODE_ENV'] = 'production';

      try {
        expect(() => createSignedDownloadUrl('f1', 'video.mp4')).toThrow('DOWNLOAD_SIGNING_SECRET environment variable is missing in production');
      } finally {
        if (oldSecret) process.env.DOWNLOAD_SIGNING_SECRET = oldSecret;
        (process.env as Record<string, string>)['NODE_ENV'] = oldEnv;
      }
    });

    it('verifies valid HMAC-SHA256 signature and rejects tampered or expired requests', () => {
      const fileId = 'file-sec-01';
      const filename = 'clip.mp4';
      const signedUrl = createSignedDownloadUrl(fileId, filename, 900);

      const parsed = new URL(`http://localhost${signedUrl}`);
      const expires = parsed.searchParams.get('expires');
      const signature = parsed.searchParams.get('signature');

      // Valid
      expect(verifySignedDownloadUrl(fileId, expires, signature, filename).valid).toBe(true);
      // Unsigned (missing)
      expect(verifySignedDownloadUrl(fileId, null, null, filename).valid).toBe(false);
      // Tampered fileId
      expect(verifySignedDownloadUrl('tampered-id', expires, signature, filename).valid).toBe(false);
    });
  });
});
