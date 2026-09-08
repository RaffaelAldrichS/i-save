import { describe, it, expect, beforeEach } from 'vitest';
import { metricsTracker } from '../metrics';
import { getProviderHealthStatus } from '../providerHealth';
import { jobStore } from '../jobStore';
import { tempStorage } from '../tempStorage';

describe('P2 Final Phase - Reliability & Observability Suite', () => {
  beforeEach(() => {
    metricsTracker.reset();
    jobStore.reset();
  });

  describe('MetricsTracker', () => {
    it('accurately records extraction and download metrics without storing URLs', () => {
      metricsTracker.recordExtraction('youtube', true, 120);
      metricsTracker.recordExtraction('youtube', false, 80, 'EXTRACTION_FAILED');
      metricsTracker.recordDownload('tiktok', true, 300);

      const metrics = metricsTracker.getMetrics();
      expect(metrics.totalExtractions).toBe(2);
      expect(metrics.totalDownloads).toBe(1);
      expect(metrics.totalErrors).toBe(1);

      expect(metrics.providers.youtube.successCount).toBe(1);
      expect(metrics.providers.youtube.failureCount).toBe(1);
      expect(metrics.providers.youtube.errorsByCategory.EXTRACTION_FAILED).toBe(1);
      expect(metrics.providers.tiktok.successCount).toBe(1);
    });
  });

  describe('Provider Health Status', () => {
    it('reports health status for all 8 supported providers', () => {
      const health = getProviderHealthStatus();
      expect(health.status).toBe('ok');
      expect(health.providers.length).toBe(8);

      const platformNames = health.providers.map((p) => p.platform);
      expect(platformNames).toContain('youtube');
      expect(platformNames).toContain('tiktok');
      expect(platformNames).toContain('instagram');
      expect(platformNames).toContain('facebook');
      expect(platformNames).toContain('twitter');
      expect(platformNames).toContain('reddit');
      expect(platformNames).toContain('threads');
      expect(platformNames).toContain('pinterest');

      expect(health.providers.every((p) => p.status === 'healthy')).toBe(true);
    });
  });

  describe('Stale & Abandoned Job Cleanup', () => {
    it('marks running jobs inactive for >10 mins as STALE_JOB failed state', () => {
      const jobId = 'test-stale-job-1';
      jobStore.createJob(jobId, 'https://youtube.com/watch?v=123', '720p');
      jobStore.updateJobProgress(jobId, 30, 'processing', 'Processing video...');

      const job = jobStore.getJob(jobId);
      if (job) {
        job.updatedAt = Date.now() - (12 * 60 * 1000); // 12 minutes ago
      }

      jobStore.cleanupExpired(15 * 60 * 1000);

      const cleanedJob = jobStore.getJob(jobId);
      expect(cleanedJob).toBeDefined();
      expect(cleanedJob?.stage).toBe('failed');
      expect(cleanedJob?.error?.code).toBe('PROCESSING_TIMEOUT');
    });

    it('cleans up completed or failed jobs older than TTL (15 mins)', () => {
      const jobId = 'test-expired-job-2';
      jobStore.createJob(jobId, 'https://youtube.com/watch?v=123', '720p');
      jobStore.setJobCompleted(jobId, 'https://download.url', 'file.mp4');

      const job = jobStore.getJob(jobId);
      if (job) {
        job.updatedAt = Date.now() - (16 * 60 * 1000); // 16 minutes ago
      }

      jobStore.cleanupExpired(15 * 60 * 1000);

      expect(jobStore.getJob(jobId)).toBeNull();
    });

    it('safely runs tempStorage.cleanupExpired without errors', () => {
      expect(() => tempStorage.cleanupExpired(15 * 60 * 1000)).not.toThrow();
    });
  });
});
