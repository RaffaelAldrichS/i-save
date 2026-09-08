export interface OperationalLog {
  requestId: string;
  provider?: string;
  action: 'extract' | 'extract_batch' | 'download' | 'health_check' | 'queue_process';
  status: 'success' | 'failed' | 'timeout' | 'rejected';
  durationMs: number;
  errorCode?: string;
  timestamp?: string;
}

export class Logger {
  log(event: OperationalLog): void {
    const entry: OperationalLog = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    };
    // Standard structured JSON logging (privacy minimal, no URLs or PII)
    if (process.env.NODE_ENV !== 'test') {
      console.log(JSON.stringify(entry));
    }
  }
}

export const logger = new Logger();
