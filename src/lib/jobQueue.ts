import { jobStore, DownloadJob } from './jobStore';
import { processMediaDownload } from './mediaDownloader';
import { tempStorage } from './tempStorage';
import { createSignedDownloadUrl } from './signedUrl';
import { mapToAppError } from './errors';
import fs from 'fs';

const MAX_CONCURRENT_JOBS = 3;
let activeWorkerCount = 0;

export async function processWorkerJob(jobId: string): Promise<void> {
  const job = jobStore.getJob(jobId);
  if (!job) return;

  try {
    jobStore.updateJobProgress(jobId, 10, 'extracting', 'Mengekstraksi informasi media...');

    const downloadRes = await processMediaDownload(job.url, job.formatId, jobId);

    jobStore.updateJobProgress(jobId, 85, 'processing', 'Menyiapkan file unduhan...');

    const fileInfo = downloadRes.filePath && fs.existsSync(downloadRes.filePath)
      ? await tempStorage.registerFileFromPath(downloadRes.filePath, downloadRes.filename)
      : await tempStorage.saveFile(downloadRes.filename, downloadRes.buffer);

    const signedDownloadUrl = createSignedDownloadUrl(fileInfo.id, fileInfo.filename, 900); // 15 mins expiry

    jobStore.setJobCompleted(jobId, signedDownloadUrl, fileInfo.filename, fileInfo.id);
  } catch (err: unknown) {
    const appErr = mapToAppError(err);
    jobStore.setJobFailed(jobId, appErr);
  }
}

export function triggerWorkerQueue(): void {
  if (activeWorkerCount >= MAX_CONCURRENT_JOBS) return;

  const nextJobId = jobStore.popQueue();
  if (!nextJobId) return;

  activeWorkerCount++;

  Promise.resolve()
    .then(() => processWorkerJob(nextJobId))
    .finally(() => {
      activeWorkerCount = Math.max(0, activeWorkerCount - 1);
      triggerWorkerQueue();
    });
}

export async function enqueueDownloadJob(
  jobId: string,
  url: string,
  formatId: string
): Promise<DownloadJob> {
  const job = jobStore.createJob(jobId, url, formatId);
  jobStore.pushQueue(jobId);

  // Trigger worker asynchronously off the HTTP event loop
  setImmediate(() => {
    triggerWorkerQueue();
  });

  return job;
}
