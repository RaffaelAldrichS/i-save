import { NextRequest, NextResponse } from 'next/server';
import { qstashReceiver } from '@/lib/qstash';
import { jobStore } from '@/lib/jobStore';
import { processWorkerJob } from '@/lib/jobQueue';
import { mapToAppError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let jobId = '';

  try {
    const bodyText = await req.text();
    let body: { jobId?: string } = {};
    try {
      body = JSON.parse(bodyText);
    } catch {
      // Body parse error
    }

    jobId = body.jobId || '';

    // 1. Signature Verification if QStash signing keys are configured
    if (qstashReceiver) {
      const signature = req.headers.get('upstash-signature');
      if (!signature) {
        return NextResponse.json({ success: false, error: 'Signature header missing' }, { status: 401 });
      }

      const isValid = await qstashReceiver.verify({
        signature,
        body: bodyText,
        url: req.url,
      }).catch(() => false);

      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Invalid QStash signature' }, { status: 401 });
      }
    }

    if (!jobId) {
      return NextResponse.json({ success: false, error: 'jobId parameter missing' }, { status: 400 });
    }

    // 2. Idempotency Check: if job is already completed or failed, return 200 OK without re-processing
    const existingJob = jobStore.getJob(jobId);
    if (existingJob && ['completed', 'failed'].includes(existingJob.stage)) {
      logger.log({
        requestId: jobId,
        action: 'queue_process',
        status: 'success',
        durationMs: Date.now() - startTime,
      });
      return NextResponse.json({
        success: true,
        jobId,
        status: existingJob.stage,
        message: 'Job already settled (idempotent skip)',
      });
    }

    // 3. Process worker job asynchronously
    await processWorkerJob(jobId);

    const finalJob = jobStore.getJob(jobId);

    logger.log({
      requestId: jobId,
      action: 'queue_process',
      status: finalJob?.stage === 'failed' ? 'failed' : 'success',
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      jobId,
      status: finalJob?.stage || 'completed',
    });
  } catch (err: unknown) {
    const appErr = mapToAppError(err);
    if (jobId) {
      jobStore.setJobFailed(jobId, appErr);
    }
    return NextResponse.json(
      {
        success: false,
        error: appErr.message,
        code: appErr.code,
      },
      { status: 500 }
    );
  }
}
