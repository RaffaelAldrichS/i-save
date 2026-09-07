import { NextRequest, NextResponse } from 'next/server';
import { tempStorage } from '@/lib/tempStorage';
import { apiRateLimiter } from '@/lib/rateLimit';
import { processMediaDownload } from '@/lib/mediaDownloader';
import { isSafeExternalUrl } from '@/lib/security';
import fs from 'fs';
import path from 'path';

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
          },
        }
      );
    }

    const body = await req.json();
    const { url, formatId } = body;

    if (!url || !formatId || typeof formatId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL dan formatId wajib diisi' },
        { status: 400 }
      );
    }

    if (!isSafeExternalUrl(url)) {
      return NextResponse.json(
        { success: false, error: 'URL tidak valid atau mengarah ke alamat internal yang dilarang' },
        { status: 400 }
      );
    }

    // Sanitize formatId (alphanumeric, dash, underscore only) to prevent Path Traversal
    const safeFormatId = formatId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeFormatId) {
      return NextResponse.json(
        { success: false, error: 'Format ID tidak valid' },
        { status: 400 }
      );
    }

    const downloadRes = await processMediaDownload(url, safeFormatId);
    const fileInfo = downloadRes.filePath && fs.existsSync(downloadRes.filePath)
      ? await tempStorage.registerFileFromPath(downloadRes.filePath, downloadRes.filename)
      : await tempStorage.saveFile(downloadRes.filename, downloadRes.buffer);

    return NextResponse.json({
      success: true,
      downloadUrl: `/api/download?fileId=${fileInfo.id}`,
      filename: fileInfo.filename,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memproses unduhan';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get('fileId');

  if (!fileId || typeof fileId !== 'string') {
    return NextResponse.json(
      { success: false, error: 'fileId wajib diisi' },
      { status: 400 }
    );
  }

  // Sanitize fileId to prevent Path Traversal
  const safeFileId = path.basename(fileId);

  const fileInfo = tempStorage.getFile(safeFileId);
  if (!fileInfo || !fs.existsSync(fileInfo.filePath)) {
    return NextResponse.json(
      { success: false, error: 'File tidak ditemukan atau telah kadaluarsa' },
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
      'Content-Type': `application/${ext}`,
      'Content-Disposition': `attachment; filename="${fileInfo.filename.replace(/["\\\r\n]/g, '_')}"`,
      'Content-Length': fileInfo.size.toString(),
    },
  });
}
