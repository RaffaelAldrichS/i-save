import { jobStore, JobStage } from './jobStore';
import { mapToAppError } from './errors';

export interface DownloadProgress {
  jobId: string;
  percent: number;
  stage: 'preparing' | 'downloading' | 'merging' | 'completed' | 'error' | JobStage;
  stageText: string;
  error?: string;
  updatedAt: number;
}

export class ProgressTracker {
  createJob(jobId: string): DownloadProgress {
    jobStore.createJob(jobId);
    return this.getProgress(jobId)!;
  }

  updateProgress(jobId: string, percent: number, stage: DownloadProgress['stage'], stageText: string) {
    const mappedStage: JobStage = stage === 'preparing' ? 'extracting' : stage === 'merging' ? 'processing' : (stage as JobStage);
    const job = jobStore.updateJobProgress(jobId, percent, mappedStage, stageText);
    return job;
  }

  setError(jobId: string, errorMsg: string) {
    const appErr = mapToAppError(errorMsg);
    jobStore.setJobFailed(jobId, appErr);
  }

  setCompleted(jobId: string) {
    jobStore.setJobCompleted(jobId, `/api/download?jobId=${jobId}`, 'media');
  }

  getProgress(jobId: string): DownloadProgress | null {
    const job = jobStore.getJob(jobId);
    if (!job) return null;
    const stageMapped: DownloadProgress['stage'] = (job.stage === 'failed' || (job.stage as string) === 'error')
      ? 'error'
      : (job.stage === 'queued' || job.stage === 'extracting')
      ? 'preparing'
      : (job.stage === 'processing')
      ? 'merging'
      : job.stage;

    // Return proxy object allowing direct mutation of updatedAt for legacy tests
    const baseProgress: DownloadProgress = {
      jobId: job.id,
      percent: job.percent,
      stage: stageMapped,
      stageText: job.stageText,
      error: job.error?.message,
      updatedAt: job.updatedAt,
    };

    return new Proxy(baseProgress, {
      set(target, prop, value) {
        if (prop === 'updatedAt' && typeof value === 'number') {
          job.updatedAt = value;
        }
        if (prop === 'percent' && typeof value === 'number') {
          job.percent = value;
        }
        if (prop === 'stage') {
          job.stage = (value === 'error' ? 'failed' : value === 'preparing' ? 'queued' : value) as JobStage;
        }
        if (prop === 'error' && typeof value === 'string') {
          job.error = mapToAppError(value);
        }
        Reflect.set(target, prop, value);
        return true;
      },
    });
  }

  cleanupOldJobs() {
    jobStore.cleanupExpired();
  }

  reset() {
    jobStore.reset();
  }
}

export const progressTracker = new ProgressTracker();
