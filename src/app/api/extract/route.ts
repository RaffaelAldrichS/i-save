import { NextRequest, NextResponse } from 'next/server';
import { extractorManager } from '@/lib/extractors';
import { apiRateLimiter, getClientIp } from '@/lib/rateLimit';
import { isSafeExternalUrl } from '@/lib/security';
import { tempStorage } from '@/lib/tempStorage';
import { progressTracker } from '@/lib/progressTracker';
import { mapToAppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { metricsTracker } from '@/lib/metrics';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const reqId = `req-ext-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  let providerName = 'unknown';

  try {
    tempStorage.cleanupExpired();
    progressTracker.cleanupOldJobs();

    const ip = getClientIp(req);
    const rateCheck = apiRateLimiter.check(ip);

    if (!rateCheck.allowed) {
      const appErr = mapToAppError(`Terlalu banyak permintaan (Rate limit). Coba lagi dalam ${rateCheck.retryAfterSeconds} detik.`);
      logger.log({
        requestId: reqId,
        action: 'extract',
        status: 'rejected',
        durationMs: Date.now() - startTime,
        errorCode: appErr.code,
      });
      metricsTracker.recordExtraction(providerName, false, Date.now() - startTime, appErr.code);
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
            'X-RateLimit-Limit': rateCheck.limit.toString(),
            'X-RateLimit-Remaining': rateCheck.remaining.toString(),
          },
        }
      );
    }

    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      const appErr = mapToAppError('Parameter URL wajib diisi');
      logger.log({
        requestId: reqId,
        action: 'extract',
        status: 'rejected',
        durationMs: Date.now() - startTime,
        errorCode: appErr.code,
      });
      metricsTracker.recordExtraction(providerName, false, Date.now() - startTime, appErr.code);
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

    const trimmedUrl = url.trim();
    const matchedProvider = typeof extractorManager?.getProvider === 'function' ? extractorManager.getProvider(trimmedUrl) : undefined;
    if (matchedProvider) {
      providerName = matchedProvider.name.replace(' Extractor', '').toLowerCase();
    }

    if (trimmedUrl.length > 2000) {
      const appErr = mapToAppError('Panjang URL melebihi batas (Maksimal 2000 karakter)');
      logger.log({
        requestId: reqId,
        provider: providerName,
        action: 'extract',
        status: 'rejected',
        durationMs: Date.now() - startTime,
        errorCode: appErr.code,
      });
      metricsTracker.recordExtraction(providerName, false, Date.now() - startTime, appErr.code);
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

    if (!(await isSafeExternalUrl(trimmedUrl))) {
      const appErr = mapToAppError('URL tidak valid atau mengarah ke alamat internal yang dilarang (SSRF protection)');
      logger.log({
        requestId: reqId,
        provider: providerName,
        action: 'extract',
        status: 'rejected',
        durationMs: Date.now() - startTime,
        errorCode: appErr.code,
      });
      metricsTracker.recordExtraction(providerName, false, Date.now() - startTime, appErr.code);
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

    const metadata = await extractorManager.extract(trimmedUrl);
    providerName = metadata.platform;
    const duration = Date.now() - startTime;

    logger.log({
      requestId: reqId,
      provider: providerName,
      action: 'extract',
      status: 'success',
      durationMs: duration,
    });
    metricsTracker.recordExtraction(providerName, true, duration);

    return NextResponse.json(
      { success: true, data: metadata },
      {
        headers: {
          'X-RateLimit-Limit': rateCheck.limit.toString(),
          'X-RateLimit-Remaining': rateCheck.remaining.toString(),
        },
      }
    );
  } catch (err: unknown) {
    const appErr = mapToAppError(err);
    const duration = Date.now() - startTime;

    logger.log({
      requestId: reqId,
      provider: providerName,
      action: 'extract',
      status: 'failed',
      durationMs: duration,
      errorCode: appErr.code,
    });
    metricsTracker.recordExtraction(providerName, false, duration, appErr.code);

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
}
