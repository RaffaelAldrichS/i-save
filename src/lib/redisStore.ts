import { Redis } from '@upstash/redis';
import { DownloadJob, JobStage } from './jobStore';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = (redisUrl && redisToken)
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null;

export const JOB_TTL_SECONDS = 900; // 15 minutes TTL

export class RedisJobStore {
  async getJob(jobId: string): Promise<DownloadJob | null> {
    if (!redis) return null;
    try {
      const data = await redis.get<DownloadJob>(`job:${jobId}`);
      return data || null;
    } catch {
      return null;
    }
  }

  async createJob(jobId: string, url: string = '', formatId: string = ''): Promise<DownloadJob> {
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

    if (redis) {
      try {
        await redis.set(`job:${jobId}`, job, { ex: JOB_TTL_SECONDS });
      } catch {
        // Fallback
      }
    }
    return job;
  }

  async updateJobProgress(jobId: string, percent: number, stage: JobStage, stageText: string): Promise<DownloadJob | null> {
    if (!redis) return null;
    try {
      const existing = await this.getJob(jobId);
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

      await redis.set(`job:${jobId}`, job, { ex: JOB_TTL_SECONDS });
      return job;
    } catch {
      return null;
    }
  }

  async setJobCompleted(jobId: string, downloadUrl: string, filename: string, fileId?: string): Promise<DownloadJob | null> {
    if (!redis) return null;
    try {
      const existing = await this.getJob(jobId);
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

      await redis.set(`job:${jobId}`, job, { ex: JOB_TTL_SECONDS });
      return job;
    } catch {
      return null;
    }
  }

  async setJobFailed(jobId: string, error: DownloadJob['error']): Promise<DownloadJob | null> {
    if (!redis) return null;
    try {
      const existing = await this.getJob(jobId);
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

      await redis.set(`job:${jobId}`, job, { ex: JOB_TTL_SECONDS });
      return job;
    } catch {
      return null;
    }
  }
}

export const redisJobStore = new RedisJobStore();
