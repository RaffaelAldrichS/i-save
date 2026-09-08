import { describe, it, expect } from 'vitest';
import { progressTracker } from '../progressTracker';

describe('Progress Tracker & Resolution Mapping', () => {
  it('creates, updates and completes download jobs accurately', () => {
    const jobId = 'test_job_123';
    progressTracker.createJob(jobId);

    let progress = progressTracker.getProgress(jobId);
    expect(progress).not.toBeNull();
    expect(progress?.stage).toBe('preparing');
    expect(progress?.percent).toBe(0);

    progressTracker.updateProgress(jobId, 45, 'downloading', 'Mengunduh stream (45%)...');
    progress = progressTracker.getProgress(jobId);
    expect(progress?.percent).toBe(45);
    expect(progress?.stageText).toBe('Mengunduh stream (45%)...');

    progressTracker.setCompleted(jobId);
    progress = progressTracker.getProgress(jobId);
    expect(progress?.percent).toBe(100);
    expect(progress?.stage).toBe('completed');
  });

  it('records error state accurately', () => {
    const jobId = 'test_job_err';
    progressTracker.createJob(jobId);
    progressTracker.setError(jobId, 'Gagal mengunduh media dari server target');

    const progress = progressTracker.getProgress(jobId);
    expect(progress?.stage).toBe('error');
    expect(progress?.error).toBe('Gagal mengunduh media dari server target');
  });
});
