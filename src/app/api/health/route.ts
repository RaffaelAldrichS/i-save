import { NextResponse } from 'next/server';
import { getProviderHealthStatus } from '@/lib/providerHealth';
import { logger } from '@/lib/logger';

export async function GET() {
  const startTime = Date.now();
  const health = getProviderHealthStatus();

  logger.log({
    requestId: `req-health-${Date.now()}`,
    action: 'health_check',
    status: health.status === 'ok' ? 'success' : 'failed',
    durationMs: Date.now() - startTime,
  });

  return NextResponse.json({
    success: true,
    data: health,
  });
}
