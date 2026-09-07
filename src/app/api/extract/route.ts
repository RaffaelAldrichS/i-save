import { NextRequest, NextResponse } from 'next/server';
import { extractorManager } from '@/lib/extractors';
import { apiRateLimiter } from '@/lib/rateLimit';
import { isSafeExternalUrl } from '@/lib/security';
import { tempStorage } from '@/lib/tempStorage';

export async function POST(req: NextRequest) {
  try {
    tempStorage.cleanupExpired();

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const rateCheck = apiRateLimiter.check(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak permintaan (Rate limit). Coba lagi dalam ${rateCheck.retryAfterSeconds} detik.`,
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
      return NextResponse.json(
        { success: false, error: 'Parameter URL wajib diisi' },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();

    if (trimmedUrl.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Panjang URL melebihi batas (Maksimal 2000 karakter)' },
        { status: 400 }
      );
    }

    if (!isSafeExternalUrl(trimmedUrl)) {
      return NextResponse.json(
        { success: false, error: 'URL tidak valid atau mengarah ke alamat internal yang dilarang (SSRF protection)' },
        { status: 400 }
      );
    }

    const metadata = await extractorManager.extract(trimmedUrl);
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
    const message = err instanceof Error ? err.message : 'Gagal mengekstraksi media';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
