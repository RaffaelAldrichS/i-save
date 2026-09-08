import { Redis } from '@upstash/redis';
import { DownloadJob, JobStage } from './jobStore';
import { AppCustomError } from './errors';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = (redisUrl && redisToken)
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null;

export const JOB_TTL_SECONDS = 900; // 15 minutes TTL
export const LOCK_TTL_SECONDS = 120; // 2 minutes lock TTL
export const MAX_CONCURRENT_JOBS = 3;

export class RedisJobStore {
  async getJob(jobId: string): Promise<DownloadJob | null> {
    if (!redis) {
      if (process.env.NODE_ENV === 'production') {
        throw new AppCustomError('INTERNAL_ERROR', 'Upstash Redis environment variables are missing in production', false);
      }
      return null;
    }
    try {
      const data = await redis.get<DownloadJob>(`job:${jobId}`);
      return data || null;
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'production' || process.env.UPSTASH_REDIS_REST_URL) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new AppCustomError('INTERNAL_ERROR', `Redis read error: ${msg}`, true);
      }
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
      } catch (err: unknown) {
        if (process.env.NODE_ENV === 'production' || process.env.UPSTASH_REDIS_REST_URL) {
          const msg = err instanceof Error ? err.message : String(err);
          throw new AppCustomError('INTERNAL_ERROR', `Redis create error: ${msg}`, true);
        }
      }
    }
    return job;
  }

  async updateJobProgress(jobId: string, percent: number, stage: JobStage, stageText: string): Promise<DownloadJob> {
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

    if (redis) {
      try {
        await redis.set(`job:${jobId}`, job, { ex: JOB_TTL_SECONDS });
      } catch (err: unknown) {
        if (process.env.NODE_ENV === 'production' || process.env.UPSTASH_REDIS_REST_URL) {
          const msg = err instanceof Error ? err.message : String(err);
          throw new AppCustomError('INTERNAL_ERROR', `Redis update error: ${msg}`, true);
        }
      }
    }
    return job;
  }

  async setJobCompleted(jobId: string, downloadUrl: string, filename: string, fileId?: string): Promise<DownloadJob> {
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

    if (redis) {
      try {
        await redis.set(`job:${jobId}`, job, { ex: JOB_TTL_SECONDS });
      } catch (err: unknown) {
        if (process.env.NODE_ENV === 'production' || process.env.UPSTASH_REDIS_REST_URL) {
          const msg = err instanceof Error ? err.message : String(err);
          throw new AppCustomError('INTERNAL_ERROR', `Redis completion error: ${msg}`, true);
        }
      }
    }
    return job;
  }

  async setJobFailed(jobId: string, error: DownloadJob['error']): Promise<DownloadJob> {
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

    if (redis) {
      try {
        await redis.set(`job:${jobId}`, job, { ex: JOB_TTL_SECONDS });
      } catch (err: unknown) {
        if (process.env.NODE_ENV === 'production' || process.env.UPSTASH_REDIS_REST_URL) {
          const msg = err instanceof Error ? err.message : String(err);
          throw new AppCustomError('INTERNAL_ERROR', `Redis failure recording error: ${msg}`, true);
        }
      }
    }
    return job;
  }

  // Atomic Redis Distributed Locking for Worker Execution
  async acquireJobLock(jobId: string): Promise<boolean> {
    if (!redis) return true;
    try {
      const res = await redis.set(`lock:job:${jobId}`, '1', { nx: true, ex: LOCK_TTL_SECONDS });
      return res === 'OK' || Boolean(res);
    } catch {
      return false;
    }
  }

  async releaseJobLock(jobId: string): Promise<void> {
    if (!redis) return;
    try {
      await redis.del(`lock:job:${jobId}`);
    } catch {
      // Ignore release error
    }
  }

  // Atomic Distributed Concurrency Throttling via Redis Counter
  async acquireConcurrencySlot(): Promise<boolean> {
    if (!redis) return true;
    try {
      const count = await redis.incr('isave:active_workers');
      await redis.expire('isave:active_workers', LOCK_TTL_SECONDS);
      if (count > MAX_CONCURRENT_JOBS) {
        await redis.decr('isave:active_workers');
        return false;
      }
      return true;
    } catch {
      return true;
    }
  }

  async releaseConcurrencySlot(): Promise<void> {
    if (!redis) return;
    try {
      const count = await redis.decr('isave:active_workers');
      if (count < 0) {
        await redis.set('isave:active_workers', 0);
      }
    } catch {
      // Ignore error
    }
  }
}

export const redisJobStore = new RedisJobStore();
