import { Client, Receiver } from '@upstash/qstash';
import { logger } from './logger';

const qstashToken = process.env.QSTASH_TOKEN;
const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

export const qstashClient = qstashToken ? new Client({ token: qstashToken }) : null;

export const qstashReceiver = (currentSigningKey && nextSigningKey)
  ? new Receiver({
      currentSigningKey,
      nextSigningKey,
    })
  : null;

export async function publishQStashWorkerJob(
  jobId: string,
  requestHost?: string
): Promise<{ published: boolean; messageId?: string }> {
  if (!qstashClient) {
    return { published: false };
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (requestHost ? `https://${requestHost}` : 'http://localhost:3000');
    const targetUrl = `${appUrl}/api/worker/download`;

    const res = await qstashClient.publishJSON({
      url: targetUrl,
      body: { jobId },
      retries: 2,
    });

    logger.log({
      requestId: jobId,
      action: 'queue_process',
      status: 'success',
      durationMs: 0,
    });

    return { published: true, messageId: res.messageId };
  } catch {
    logger.log({
      requestId: jobId,
      action: 'queue_process',
      status: 'failed',
      durationMs: 0,
      errorCode: 'QSTASH_PUBLISH_FAILED',
    });
    return { published: false };
  }
}
