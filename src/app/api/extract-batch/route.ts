import { NextRequest, NextResponse } from 'next/server';
import { extractorManager } from '@/lib/extractors';
import { apiRateLimiter, getClientIp } from '@/lib/rateLimit';
import { isSafeExternalUrl, parseMultiUrls } from '@/lib/security';
import { tempStorage } from '@/lib/tempStorage';
import { progressTracker } from '@/lib/progressTracker';
import { mapToAppError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    tempStorage.cleanupExpired();
    progressTracker.cleanupOldJobs();

    const ip = getClientIp(req);
    const rateCheck = apiRateLimiter.check(ip);

    if (!rateCheck.allowed) {
      const appErr = mapToAppError(`Terlalu banyak permintaan (Rate limit). Coba lagi dalam ${rateCheck.retryAfterSeconds} detik.`);
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
    let urls: string[] = [];

    if (typeof body.input === 'string') {
      urls = await parseMultiUrls(body.input);
    } else if (Array.isArray(body.urls)) {
      for (const u of body.urls) {
        if (typeof u === 'string' && (await isSafeExternalUrl(u))) {
          urls.push(u.trim());
        }
      }
    }

    if (urls.length === 0) {
      const appErr = mapToAppError('Tidak ada URL valid yang ditemukan');
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

    // Limit batch to max 10 URLs
    const safeUrls = urls.slice(0, 10);
    const metadataList = await extractorManager.extractBatch(safeUrls);

    return NextResponse.json(
      { success: true, data: metadataList },
      {
        headers: {
          'X-RateLimit-Limit': rateCheck.limit.toString(),
          'X-RateLimit-Remaining': rateCheck.remaining.toString(),
        },
      }
    );
  } catch (err: unknown) {
    const appErr = mapToAppError(err);
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
