import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ProgressTracker } from '../progressTracker';

describe('ProgressTracker', () => {
  let tracker: ProgressTracker;

  beforeEach(() => {
    tracker = new ProgressTracker();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a job and returns its progress', () => {
    const job = tracker.createJob('job-1');
    expect(job.percent).toBe(0);
    expect(job.stage).toBe('preparing');
    expect(tracker.getProgress('job-1')).not.toBeNull();
  });

  it('updates progress and clamps to 0..100', () => {
    tracker.createJob('job-1');
    tracker.updateProgress('job-1', 250, 'downloading', 'Mengunduh...');
    expect(tracker.getProgress('job-1')?.percent).toBe(100);
    tracker.updateProgress('job-1', -5, 'downloading', 'Mengunduh...');
    expect(tracker.getProgress('job-1')?.percent).toBe(0);
  });

  it('marks jobs as error and completed', () => {
    tracker.createJob('job-1');
    tracker.setError('job-1', 'gagal');
    expect(tracker.getProgress('job-1')?.stage).toBe('error');
    expect(tracker.getProgress('job-1')?.error).toBe('gagal');

    tracker.createJob('job-2');
    tracker.setCompleted('job-2');
    expect(tracker.getProgress('job-2')?.stage).toBe('completed');
    expect(tracker.getProgress('job-2')?.percent).toBe(100);
  });

  it('cleanupOldJobs removes jobs older than 15 minutes (LOGIC-05 regression)', () => {
    tracker.createJob('old-job');
    const oldJob = tracker.getProgress('old-job')!;
    oldJob.updatedAt = Date.now() - 16 * 60 * 1000;
    tracker.getProgress('old-job')!.updatedAt = oldJob.updatedAt;

    tracker.createJob('fresh-job');

    tracker.cleanupOldJobs();

    expect(tracker.getProgress('old-job')).toBeNull();
    expect(tracker.getProgress('fresh-job')).not.toBeNull();
  });

  it('cleanupOldJobs keeps recently updated jobs', () => {
    tracker.createJob('recent');
    tracker.cleanupOldJobs();
    expect(tracker.getProgress('recent')).not.toBeNull();
  });
});