import { NextRequest, NextResponse } from 'next/server';
import { progressTracker } from '@/lib/progressTracker';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ success: false, error: 'jobId wajib diisi' }, { status: 400 });
  }

  const progress = progressTracker.getProgress(jobId);
  if (!progress) {
    return NextResponse.json({
      success: true,
      data: { jobId, percent: 0, stage: 'preparing', stageText: 'Menyiapkan proses...' },
    });
  }

  return NextResponse.json({ success: true, data: progress });
}
