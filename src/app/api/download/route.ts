import { NextRequest, NextResponse } from 'next/server';
import { tempStorage } from '@/lib/tempStorage';
import { apiRateLimiter, getClientIp } from '@/lib/rateLimit';
import { isSafeExternalUrl, getMimeType } from '@/lib/security';
import { progressTracker } from '@/lib/progressTracker';
import { mapToAppError } from '@/lib/errors';
import { jobStore } from '@/lib/jobStore';
import { enqueueDownloadJob, processWorkerJob } from '@/lib/jobQueue';
import { verifySignedDownloadUrl } from '@/lib/signedUrl';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

import { logger } from '@/lib/logger';
import { metricsTracker } from '@/lib/metrics';
import { extractorManager } from '@/lib/extractors';

export async function POST(req: NextRequest) {
  let activeJobId: string | undefined;
  const startTime = Date.now();
  let providerName = 'unknown';

  try {
    tempStorage.cleanupExpired();
    progressTracker.cleanupOldJobs();

    const ip = getClientIp(req);
    const rateCheck = apiRateLimiter.check(ip);

    if (!rateCheck.allowed) {
      const appErr = mapToAppError(`Terlalu banyak permintaan (Rate limit). Coba lagi dalam ${rateCheck.retryAfterSeconds} detik.`);
      logger.log({
        requestId: `req-dl-${Date.now()}`,
        action: 'download',
        status: 'rejected',
        durationMs: Date.now() - startTime,
        errorCode: appErr.code,
      });
      metricsTracker.recordDownload(providerName, false, Date.now() - startTime, appErr.code);
      return NextResponse.json(
        {
          success: false,
          error: appErr.message,
          code: appErr.code,
          retryable: appErr.retryable,
          errorDetails: appErr,
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateCheck.retryAfterSeconds.toString(),
          },
        }
      );
    }

    const body = await req.json();
    const { url, formatId, jobId } = body;
    activeJobId = typeof jobId === 'string' && jobId ? jobId : `job_${Date.now()}_${uuidv4().substring(0, 6)}`;

    if (!url || !formatId || typeof formatId !== 'string') {
      const appErr = mapToAppError('URL dan formatId wajib diisi');
      logger.log({
        requestId: activeJobId,
        action: 'download',
        status: 'rejected',
        durationMs: Date.now() - startTime,
        errorCode: appErr.code,
      });
      metricsTracker.recordDownload(providerName, false, Date.now() - startTime, appErr.code);
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

    const matchedProvider = typeof extractorManager?.getProvider === 'function' ? extractorManager.getProvider(url) : undefined;
    if (matchedProvider) {
      providerName = matchedProvider.name.replace(' Extractor', '').toLowerCase();
    }

    if (!(await isSafeExternalUrl(url))) {
      const appErr = mapToAppError('URL tidak valid atau mengarah ke alamat internal yang dilarang');
      logger.log({
        requestId: activeJobId,
        provider: providerName,
        action: 'download',
        status: 'rejected',
        durationMs: Date.now() - startTime,
        errorCode: appErr.code,
      });
      metricsTracker.recordDownload(providerName, false, Date.now() - startTime, appErr.code);
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

    // Sanitize formatId (alphanumeric, dash, underscore, plus only) to prevent Path Traversal
    const safeFormatId = formatId.replace(/[^a-zA-Z0-9_\-+]/g, '');
    if (!safeFormatId) {
      const appErr = mapToAppError('Format ID tidak valid');
      logger.log({
        requestId: activeJobId,
        provider: providerName,
        action: 'download',
        status: 'rejected',
        durationMs: Date.now() - startTime,
        errorCode: appErr.code,
      });
      metricsTracker.recordDownload(providerName, false, Date.now() - startTime, appErr.code);
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

    // Enqueue job to persistent store and independent worker queue
    await enqueueDownloadJob(activeJobId, url, safeFormatId);

    // Run worker process in background asynchronously
    const workerPromise = processWorkerJob(activeJobId);

    // If client requested sync waiting or for legacy test suites, await short worker resolution
    if (body.sync === true || process.env.NODE_ENV === 'test') {
      await workerPromise;
      const job = jobStore.getJob(activeJobId);
      if (job && job.stage === 'failed' && job.error) {
        logger.log({
          requestId: activeJobId,
          provider: providerName,
          action: 'download',
          status: 'failed',
          durationMs: Date.now() - startTime,
          errorCode: job.error.code,
        });
        metricsTracker.recordDownload(providerName, false, Date.now() - startTime, job.error.code);
        return NextResponse.json(
          {
            success: false,
            error: job.error.message,
            code: job.error.code,
            retryable: job.error.retryable,
            errorDetails: job.error,
          },
          { status: 500 }
        );
      }
      if (job && job.stage === 'completed' && job.downloadUrl) {
        logger.log({
          requestId: activeJobId,
          provider: providerName,
          action: 'download',
          status: 'success',
          durationMs: Date.now() - startTime,
        });
        metricsTracker.recordDownload(providerName, true, Date.now() - startTime);
        return NextResponse.json({
          success: true,
          jobId: activeJobId,
          status: 'completed',
          downloadUrl: job.downloadUrl,
          filename: job.filename,
        });
      }
    }

    // Immediate Async Response (202 Accepted semantics)
    logger.log({
      requestId: activeJobId,
      provider: providerName,
      action: 'download',
      status: 'success',
      durationMs: Date.now() - startTime,
    });
    metricsTracker.recordDownload(providerName, true, Date.now() - startTime);

    return NextResponse.json(
      {
        success: true,
        jobId: activeJobId,
        status: 'queued',
        progressUrl: `/api/download/progress?jobId=${activeJobId}`,
      },
      { status: 202 }
    );
  } catch (err: unknown) {
    const appErr = mapToAppError(err);
    if (activeJobId) {
      jobStore.setJobFailed(activeJobId, appErr);
    }
    logger.log({
      requestId: activeJobId || `req-dl-${Date.now()}`,
      provider: providerName,
      action: 'download',
      status: 'failed',
      durationMs: Date.now() - startTime,
      errorCode: appErr.code,
    });
    metricsTracker.recordDownload(providerName, false, Date.now() - startTime, appErr.code);
    return NextResponse.json(
      {
        success: false,
        error: appErr.message,
        code: appErr.code,
        retryable: appErr.retryable,
        errorDetails: appErr,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get('fileId');
  const expires = searchParams.get('expires');
  const signature = searchParams.get('signature');
  const filename = searchParams.get('filename');

  if (!fileId || typeof fileId !== 'string') {
    const appErr = mapToAppError('fileId wajib diisi');
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

  // Sanitize fileId to prevent Path Traversal
  const safeFileId = path.basename(fileId);

  // Verify expiring/signed URL
  const verifyResult = verifySignedDownloadUrl(safeFileId, expires, signature, filename);
  if (!verifyResult.valid) {
    const appErr = mapToAppError(verifyResult.error || 'Tanda tangan unduhan tidak valid');
    return NextResponse.json(
      {
        success: false,
        error: appErr.message,
        code: appErr.code,
        retryable: appErr.retryable,
        errorDetails: appErr,
      },
      { status: 403 }
    );
  }

  const fileInfo = tempStorage.getFile(safeFileId);
  if (!fileInfo || !fs.existsSync(fileInfo.filePath)) {
    const appErr = mapToAppError('File tidak ditemukan atau telah kadaluarsa');
    return NextResponse.json(
      {
        success: false,
        error: appErr.message,
        code: appErr.code,
        retryable: appErr.retryable,
        errorDetails: appErr,
      },
      { status: 404 }
    );
  }

  const ext = path.extname(fileInfo.filePath).replace('.', '') || 'bin';
  const nodeStream = fs.createReadStream(fileInfo.filePath);

  const webStream = new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk) => controller.enqueue(chunk));
      nodeStream.on('end', () => controller.close());
      nodeStream.on('error', (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });

  return new NextResponse(webStream as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': getMimeType(ext),
      'Content-Disposition': `attachment; filename="${fileInfo.filename.replace(/["\\\r\n]/g, '_')}"`,
      'Content-Length': fileInfo.size.toString(),
    },
  });
}
