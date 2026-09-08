import { AppError } from './errors';
import { redisJobStore, redis } from './redisStore';
import fs from 'fs';
import path from 'path';
import os from 'os';

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

// Global persistent storage backing interface (Redis / File-backed KV store)
interface PersistentJobData {
  jobs: Record<string, DownloadJob>;
  queue: string[];
}

const DB_FILE_PATH = path.join(os.tmpdir(), 'isave-persistent-jobs-db.json');

declare global {
  var __isave_redis_job_db__: PersistentJobData | undefined;
}

function loadPersistentData(): PersistentJobData {
  if (globalThis.__isave_redis_job_db__) {
    return globalThis.__isave_redis_job_db__;
  }

  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      globalThis.__isave_redis_job_db__ = parsed;
      return parsed;
    }
  } catch {
    // Ignore read errors
  }

  const initial: PersistentJobData = { jobs: {}, queue: [] };
  globalThis.__isave_redis_job_db__ = initial;
  return initial;
}

function savePersistentData(): void {
  const data = globalThis.__isave_redis_job_db__;
  if (!data) return;
  try {
    const tmpPath = `${DB_FILE_PATH}.${Date.now()}.${Math.random().toString(36).substring(2, 7)}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data), 'utf-8');
    fs.renameSync(tmpPath, DB_FILE_PATH);
  } catch {
    // Ignore write errors
  }
}

export class JobStore {
  createJob(jobId: string, url: string = '', formatId: string = ''): DownloadJob {
    const data = loadPersistentData();
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

    data.jobs[jobId] = job;
    savePersistentData();
    if (redis) {
      redisJobStore.createJob(jobId, url, formatId).catch(() => {});
    }
    return job;
  }

  updateJobProgress(jobId: string, percent: number, stage: JobStage, stageText: string): DownloadJob {
    const data = loadPersistentData();
    const job = data.jobs[jobId] || {
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
    data.jobs[jobId] = job;
    savePersistentData();

    if (redis) {
      redisJobStore.updateJobProgress(jobId, percent, stage, stageText).catch(() => {});
    }
    return job;
  }

  setJobCompleted(jobId: string, downloadUrl: string, filename: string, fileId?: string): DownloadJob {
    const data = loadPersistentData();
    const job = data.jobs[jobId] || {
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
    data.jobs[jobId] = job;
    savePersistentData();

    if (redis) {
      redisJobStore.setJobCompleted(jobId, downloadUrl, filename, fileId).catch(() => {});
    }
    return job;
  }

  setJobFailed(jobId: string, error: AppError): DownloadJob {
    const data = loadPersistentData();
    const job = data.jobs[jobId] || {
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
    data.jobs[jobId] = job;
    savePersistentData();

    if (redis) {
      redisJobStore.setJobFailed(jobId, error).catch(() => {});
    }
    return job;
  }

  getJob(jobId: string): DownloadJob | null {
    const data = loadPersistentData();
    return data.jobs[jobId] || null;
  }

  pushQueue(jobId: string): void {
    const data = loadPersistentData();
    if (!data.queue.includes(jobId)) {
      data.queue.push(jobId);
      savePersistentData();
    }
  }

  popQueue(): string | null {
    const data = loadPersistentData();
    const jobId = data.queue.shift() || null;
    savePersistentData();
    return jobId;
  }

  cleanupExpired(ttlMs: number = 15 * 60 * 1000): void {
    const data = loadPersistentData();
    const now = Date.now();
    for (const [id, job] of Object.entries(data.jobs)) {
      // 1. Remove expired jobs (>=15 mins)
      if (now - job.updatedAt >= ttlMs) {
        delete data.jobs[id];
      } else if (['queued', 'extracting', 'processing'].includes(job.stage) && now - job.updatedAt > 10 * 60 * 1000) {
        // 2. Mark stale running jobs (>10 mins inactive) as failed
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
    savePersistentData();
  }

  reset(): void {
    globalThis.__isave_redis_job_db__ = { jobs: {}, queue: [] };
    savePersistentData();
  }
}

export const jobStore = new JobStore();
