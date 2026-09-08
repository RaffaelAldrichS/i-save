export interface DownloadProgress {
  jobId: string;
  percent: number;
  stage: 'preparing' | 'downloading' | 'merging' | 'completed' | 'error';
  stageText: string;
  error?: string;
  updatedAt: number;
}

export class ProgressTracker {
  private jobs: Map<string, DownloadProgress> = new Map();

  createJob(jobId: string): DownloadProgress {
    const job: DownloadProgress = {
      jobId,
      percent: 0,
      stage: 'preparing',
      stageText: 'Menyiapkan unduhan...',
      updatedAt: Date.now(),
    };
    this.jobs.set(jobId, job);
    return job;
  }

  updateProgress(jobId: string, percent: number, stage: DownloadProgress['stage'], stageText: string) {
    const job = this.jobs.get(jobId) || {
      jobId,
      percent: 0,
      stage: 'preparing',
      stageText: '',
      updatedAt: Date.now(),
    };
    job.percent = Math.min(100, Math.max(0, Math.round(percent)));
    job.stage = stage;
    job.stageText = stageText;
    job.updatedAt = Date.now();
    this.jobs.set(jobId, job);
  }

  setError(jobId: string, errorMsg: string) {
    const job = this.jobs.get(jobId) || {
      jobId,
      percent: 0,
      stage: 'error',
      stageText: 'Gagal mengunduh',
      updatedAt: Date.now(),
    };
    job.stage = 'error';
    job.stageText = 'Gagal mengunduh';
    job.error = errorMsg;
    job.updatedAt = Date.now();
    this.jobs.set(jobId, job);
  }

  setCompleted(jobId: string) {
    const job = this.jobs.get(jobId) || {
      jobId,
      percent: 100,
      stage: 'completed',
      stageText: 'Selesai!',
      updatedAt: Date.now(),
    };
    job.percent = 100;
    job.stage = 'completed';
    job.stageText = 'Selesai!';
    job.updatedAt = Date.now();
    this.jobs.set(jobId, job);
  }

  getProgress(jobId: string): DownloadProgress | null {
    return this.jobs.get(jobId) || null;
  }

  cleanupOldJobs() {
    const now = Date.now();
    for (const [id, job] of this.jobs.entries()) {
      if (now - job.updatedAt > 15 * 60 * 1000) { // 15 mins TTL
        this.jobs.delete(id);
      }
    }
  }

  reset() {
    this.jobs.clear();
  }
}

export const progressTracker = new ProgressTracker();
