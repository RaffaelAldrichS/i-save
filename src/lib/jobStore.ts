import { AppError } from './errors';
import { redisJobStore, redis } from './redisStore';

export type JobStage = 'queued' | 'extracting' | 'processing' | 'ready' | 'completed' | 'failed';

export interface DownloadJob {
  id: string;
  url: string;
  formatId: string;
  stage: JobStage;
  percent: number;
  stageText: string;
  downloadUrl?: string;
  fileId?: string;
  filename?: string;
  error?: AppError;
  createdAt: number;
  updatedAt: number;
}

// In-memory fallback map for offline unit testing when Redis environment variables are absent
const testMemoryStore = new Map<string, DownloadJob>();

export class JobStore {
  createJob(jobId: string, url: string = '', formatId: string = ''): DownloadJob {
    const job: DownloadJob = {
      id: jobId,
      url,
      formatId,
      stage: 'queued',
      percent: 0,
      stageText: 'Menyiapkan antrean proses...',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    testMemoryStore.set(jobId, job);
    if (redis) {
      redisJobStore.createJob(jobId, url, formatId).catch(() => {});
    }
    return job;
  }

  async createJobAsync(jobId: string, url: string = '', formatId: string = ''): Promise<DownloadJob> {
    const job = this.createJob(jobId, url, formatId);
    if (redis) {
      return await redisJobStore.createJob(jobId, url, formatId);
    }
    return job;
  }

  updateJobProgress(jobId: string, percent: number, stage: JobStage, stageText: string): DownloadJob {
    const existing = testMemoryStore.get(jobId);
    const job: DownloadJob = existing || {
      id: jobId,
      url: '',
      formatId: '',
      stage,
      percent: 0,
      stageText: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    job.percent = Math.min(100, Math.max(0, Math.round(percent)));
    job.stage = stage;
    job.stageText = stageText;
    job.updatedAt = Date.now();
    testMemoryStore.set(jobId, job);

    if (redis) {
      redisJobStore.updateJobProgress(jobId, percent, stage, stageText).catch(() => {});
    }
    return job;
  }

  async updateJobProgressAsync(jobId: string, percent: number, stage: JobStage, stageText: string): Promise<DownloadJob> {
    const job = this.updateJobProgress(jobId, percent, stage, stageText);
    if (redis) {
      return await redisJobStore.updateJobProgress(jobId, percent, stage, stageText);
    }
    return job;
  }

  setJobCompleted(jobId: string, downloadUrl: string, filename: string, fileId?: string): DownloadJob {
    const existing = testMemoryStore.get(jobId);
    const job: DownloadJob = existing || {
      id: jobId,
      url: '',
      formatId: '',
      stage: 'completed',
      percent: 100,
      stageText: 'Selesai!',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    job.stage = 'completed';
    job.percent = 100;
    job.stageText = 'Selesai!';
    job.downloadUrl = downloadUrl;
    job.filename = filename;
    if (fileId) job.fileId = fileId;
    job.updatedAt = Date.now();
    testMemoryStore.set(jobId, job);

    if (redis) {
      redisJobStore.setJobCompleted(jobId, downloadUrl, filename, fileId).catch(() => {});
    }
    return job;
  }

  async setJobCompletedAsync(jobId: string, downloadUrl: string, filename: string, fileId?: string): Promise<DownloadJob> {
    const job = this.setJobCompleted(jobId, downloadUrl, filename, fileId);
    if (redis) {
      return await redisJobStore.setJobCompleted(jobId, downloadUrl, filename, fileId);
    }
    return job;
  }

  setJobFailed(jobId: string, error: AppError): DownloadJob {
    const existing = testMemoryStore.get(jobId);
    const job: DownloadJob = existing || {
      id: jobId,
      url: '',
      formatId: '',
      stage: 'failed',
      percent: 0,
      stageText: 'Gagal mengunduh',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    job.stage = 'failed';
    job.stageText = 'Gagal mengunduh';
    job.error = error;
    job.updatedAt = Date.now();
    testMemoryStore.set(jobId, job);

    if (redis) {
      redisJobStore.setJobFailed(jobId, error).catch(() => {});
    }
    return job;
  }

  async setJobFailedAsync(jobId: string, error: AppError): Promise<DownloadJob> {
    const job = this.setJobFailed(jobId, error);
    if (redis) {
      return await redisJobStore.setJobFailed(jobId, error);
    }
    return job;
  }

  getJob(jobId: string): DownloadJob | null {
    return testMemoryStore.get(jobId) || null;
  }

  async getJobAsync(jobId: string): Promise<DownloadJob | null> {
    if (redis) {
      const redisData = await redisJobStore.getJob(jobId);
      if (redisData) return redisData;
    }
    return this.getJob(jobId);
  }

  cleanupExpired(ttlMs: number = 15 * 60 * 1000): void {
    const now = Date.now();
    for (const [id, job] of testMemoryStore.entries()) {
      if (now - job.updatedAt >= ttlMs) {
        testMemoryStore.delete(id);
      } else if (['queued', 'extracting', 'processing'].includes(job.stage) && now - job.updatedAt > 10 * 60 * 1000) {
        job.stage = 'failed';
        job.stageText = 'Proses unduhan kedaluwarsa atau terhenti';
        job.error = {
          code: 'PROCESSING_TIMEOUT',
          message: 'Pekerjaan unduhan melebahi batas waktu keaktifan (stale job)',
          retryable: true,
        };
        job.updatedAt = now;
      }
    }
  }

  reset(): void {
    testMemoryStore.clear();
  }
}

export const jobStore = new JobStore();
