import { NextRequest, NextResponse } from 'next/server';
import { progressTracker } from '@/lib/progressTracker';
import { jobStore } from '@/lib/jobStore';
import { mapToAppError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  jobStore.cleanupExpired();

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    const appErr = mapToAppError('jobId wajib diisi');
    return NextResponse.json(
      {
        success: false,
        error: appErr.message,
        code: appErr.code,
        retryable: appErr.retryable,
        errorDetails: appErr,
      },
      { status: 400 }
    );
  }

  const job = jobStore.getJob(jobId);
  if (!job) {
    const legacyProgress = progressTracker.getProgress(jobId);
    if (legacyProgress) {
      return NextResponse.json({ success: true, data: legacyProgress });
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        percent: 0,
        stage: 'preparing',
        stageText: 'Menyiapkan proses...',
      },
    });
  }

  const stageMapped = job.stage === 'failed' ? 'error' : (job.stage === 'queued' || job.stage === 'extracting') ? 'preparing' : job.stage;

  return NextResponse.json({
    success: true,
    data: {
      jobId: job.id,
      percent: job.percent,
      stage: stageMapped,
      jobStage: job.stage,
      stageText: job.stageText,
      downloadUrl: job.downloadUrl,
      filename: job.filename,
      error: job.error?.message,
      errorDetails: job.error,
      updatedAt: job.updatedAt,
    },
  });
}
