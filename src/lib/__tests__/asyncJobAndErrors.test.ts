import { describe, it, expect } from 'vitest';
import { JobStore } from '../jobStore';
import { mapToAppError, AppCustomError } from '../errors';

describe('P1.4 & P1.5 — Async Download Architecture & Structured Errors', () => {
  describe('Structured Error Taxonomy (P1.5)', () => {
    it('maps rate limit messages to RATE_LIMITED code (retryable)', () => {
      const err = mapToAppError('Terlalu banyak permintaan (Rate limit). Coba lagi');
      expect(err.code).toBe('RATE_LIMITED');
      expect(err.retryable).toBe(true);
    });

    it('maps SSRF and forbidden internal URLs to INVALID_URL (not retryable)', () => {
      const err = mapToAppError('URL tidak valid atau mengarah ke alamat internal yang dilarang');
      expect(err.code).toBe('INVALID_URL');
      expect(err.retryable).toBe(false);
    });

    it('maps private content errors to PRIVATE (not retryable)', () => {
      const err = mapToAppError('Video YouTube disetel privat');
      expect(err.code).toBe('PRIVATE');
      expect(err.retryable).toBe(false);
    });

    it('maps unsupported URL errors to UNSUPPORTED (not retryable)', () => {
      const err = mapToAppError('Platform URL tidak didukung saat ini');
      expect(err.code).toBe('UNSUPPORTED');
      expect(err.retryable).toBe(false);
    });

    it('maps timeout errors to PROCESSING_TIMEOUT (retryable)', () => {
      const err = mapToAppError('Proses unduhan melebihi batas waktu (timeout 120s)');
      expect(err.code).toBe('PROCESSING_TIMEOUT');
      expect(err.retryable).toBe(true);
    });

    it('maps yt-dlp extraction failures to EXTRACTION_FAILED (retryable)', () => {
      const err = mapToAppError('Proses yt-dlp selesai dengan kode 1');
      expect(err.code).toBe('EXTRACTION_FAILED');
      expect(err.retryable).toBe(true);
    });

    it('maps missing executable ENOENT errors to INTERNAL_ERROR, never PRIVATE', () => {
      const err1 = mapToAppError('spawn yt-dlp ENOENT');
      expect(err1.code).toBe('INTERNAL_ERROR');
      expect(err1.code).not.toBe('PRIVATE');

      const err2 = mapToAppError('yt-dlp tidak ditemukan pada server (ENOENT)');
      expect(err2.code).toBe('INTERNAL_ERROR');
      expect(err2.code).not.toBe('PRIVATE');
    });

    it('preserves AppCustomError instances without re-mapping', () => {
      const custom = new AppCustomError('PRIVATE', 'Custom private message', false, 'provider_403');
      const mapped = mapToAppError(custom);
      expect(mapped.code).toBe('PRIVATE');
      expect(mapped.message).toBe('Custom private message');
      expect(mapped.providerError).toBe('provider_403');
    });
  });

  describe('Job State Machine & Persistence (P1.4)', () => {
    it('creates jobs in queued state and advances state machine', () => {
      const store = new JobStore();
      const job = store.createJob('job-123', 'https://youtube.com/watch?v=abc', '720p');

      expect(job.id).toBe('job-123');
      expect(job.stage).toBe('queued');
      expect(job.percent).toBe(0);

      const updated = store.updateJobProgress('job-123', 45, 'processing', 'Mengunduh stream video...');
      expect(updated.stage).toBe('processing');
      expect(updated.percent).toBe(45);

      const completed = store.setJobCompleted('job-123', '/api/download?fileId=file-999', 'video.mp4', 'file-999');
      expect(completed.stage).toBe('completed');
      expect(completed.percent).toBe(100);
      expect(completed.downloadUrl).toBe('/api/download?fileId=file-999');
      expect(completed.filename).toBe('video.mp4');
    });

    it('records failed jobs with structured AppError details', () => {
      const store = new JobStore();
      store.createJob('job-fail-1');

      const appErr = mapToAppError('Proses unduhan melebihi batas waktu (timeout 120s)');
      const failed = store.setJobFailed('job-fail-1', appErr);

      expect(failed.stage).toBe('failed');
      expect(failed.error).toBeDefined();
      expect(failed.error?.code).toBe('PROCESSING_TIMEOUT');
      expect(failed.error?.retryable).toBe(true);
    });

    it('retrieves persistent job state across store lookups', () => {
      const store = new JobStore();
      store.createJob('job-persist');
      store.updateJobProgress('job-persist', 75, 'processing', 'FFmpeg merge');

      const retrieved = store.getJob('job-persist');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.percent).toBe(75);
      expect(retrieved?.stage).toBe('processing');
    });
  });
});
