import { NextResponse } from 'next/server';
import { getProviderHealthStatus } from '@/lib/providerHealth';
import { logger } from '@/lib/logger';
import { getYtDlpExecutablePath } from '@/lib/ytDlpPath';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execFileAsync = promisify(execFile);

export async function GET() {
  const startTime = Date.now();
  const health = getProviderHealthStatus();

  let ytdlpInfo: { path: string; exists: boolean; version?: string; error?: string } = {
    path: '',
    exists: false,
  };

  try {
    const ytdlpPath = await getYtDlpExecutablePath();
    const exists = ytdlpPath === 'yt-dlp' || ytdlpPath === 'yt-dlp.exe' ? true : fs.existsSync(ytdlpPath);
    ytdlpInfo.path = ytdlpPath;
    ytdlpInfo.exists = exists;

    try {
      const { stdout } = await execFileAsync(ytdlpPath, ['--version'], { timeout: 5000 });
      ytdlpInfo.version = stdout.trim();
    } catch (e: any) {
      ytdlpInfo.error = e.message;
    }
  } catch (err: any) {
    ytdlpInfo.error = err.message;
  }

  logger.log({
    requestId: `req-health-${Date.now()}`,
    action: 'health_check',
    status: health.status === 'ok' ? 'success' : 'failed',
    durationMs: Date.now() - startTime,
  });

  return NextResponse.json({
    success: true,
    data: {
      ...health,
      ytdlp: ytdlpInfo,
    },
  });
}
