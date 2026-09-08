import { jobStore, DownloadJob } from './jobStore';
import { redisJobStore } from './redisStore';
import { processMediaDownload } from './mediaDownloader';
import { tempStorage } from './tempStorage';
import { createSignedDownloadUrl } from './signedUrl';
import { mapToAppError } from './errors';
import fs from 'fs';

export async function processWorkerJob(jobId: string): Promise<boolean> {
  const job = await jobStore.getJobAsync(jobId);
  if (!job) return false;

  // Idempotency: skip if job already completed or failed
  if (['completed', 'failed'].includes(job.stage)) {
    return true;
  }

  // 1. Acquire Atomic Redis Lock for Worker Execution
  const lockAcquired = await redisJobStore.acquireJobLock(jobId);
  if (!lockAcquired) {
    return false; // Concurrent execution locked by another worker
  }

  // 2. Acquire Distributed Concurrency Slot
  const slotAcquired = await redisJobStore.acquireConcurrencySlot();
  if (!slotAcquired) {
    await redisJobStore.releaseJobLock(jobId);
    return false; // Concurrency limit (3 active workers) reached
  }

  try {
    await jobStore.updateJobProgressAsync(jobId, 10, 'extracting', 'Mengekstraksi informasi media...');

    const downloadRes = await processMediaDownload(job.url, job.formatId, jobId);

    await jobStore.updateJobProgressAsync(jobId, 85, 'processing', 'Menyiapkan file unduhan...');

    const fileInfo = downloadRes.filePath && fs.existsSync(downloadRes.filePath)
      ? await tempStorage.registerFileFromPath(downloadRes.filePath, downloadRes.filename)
      : await tempStorage.saveFile(downloadRes.filename, downloadRes.buffer);

    const signedDownloadUrl = createSignedDownloadUrl(fileInfo.id, fileInfo.filename, 900); // 15 mins expiry

    await jobStore.setJobCompletedAsync(jobId, signedDownloadUrl, fileInfo.filename, fileInfo.id);
    return true;
  } catch (err: unknown) {
    const appErr = mapToAppError(err);
    await jobStore.setJobFailedAsync(jobId, appErr);
    return false;
  } finally {
    await redisJobStore.releaseConcurrencySlot();
    await redisJobStore.releaseJobLock(jobId);
  }
}

export async function enqueueDownloadJob(
  jobId: string,
  url: string,
  formatId: string
): Promise<DownloadJob> {
  return await jobStore.createJobAsync(jobId, url, formatId);
}
