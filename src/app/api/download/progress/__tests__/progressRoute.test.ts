import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';
import { progressTracker } from '@/lib/progressTracker';

beforeEach(() => {
  progressTracker.reset();
});

describe('GET /api/download/progress', () => {
  it('returns 400 if jobId is missing', async () => {
    const req = new NextRequest('http://localhost/api/download/progress', { method: 'GET' });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('jobId wajib diisi');
  });

  it('returns preparing stage for unknown jobId', async () => {
    const req = new NextRequest('http://localhost/api/download/progress?jobId=unknown-id', { method: 'GET' });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.stage).toBe('preparing');
  });

  it('returns current progress for an active job', async () => {
    progressTracker.createJob('test-job-1');
    progressTracker.updateProgress('test-job-1', 45, 'downloading', 'Mengunduh media...');

    const req = new NextRequest('http://localhost/api/download/progress?jobId=test-job-1', { method: 'GET' });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.percent).toBe(45);
    expect(json.data.stage).toBe('downloading');
    expect(json.data.stageText).toBe('Mengunduh media...');
  });

  it('returns error stage when job failed', async () => {
    progressTracker.createJob('test-job-2');
    progressTracker.setError('test-job-2', 'yt-dlp failed');

    const req = new NextRequest('http://localhost/api/download/progress?jobId=test-job-2', { method: 'GET' });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.stage).toBe('error');
    expect(json.data.error).toBe('yt-dlp failed');
  });

  it('returns completed stage', async () => {
    progressTracker.createJob('test-job-3');
    progressTracker.setCompleted('test-job-3');

    const req = new NextRequest('http://localhost/api/download/progress?jobId=test-job-3', { method: 'GET' });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.stage).toBe('completed');
    expect(json.data.percent).toBe(100);
  });
});
