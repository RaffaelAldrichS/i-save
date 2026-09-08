export interface ProviderMetric {
  provider: string;
  successCount: number;
  failureCount: number;
  totalDurationMs: number;
  errorsByCategory: Record<string, number>;
}

export interface SystemMetrics {
  totalExtractions: number;
  totalDownloads: number;
  totalErrors: number;
  providers: Record<string, ProviderMetric>;
}

declare global {
  var __isave_metrics_store__: SystemMetrics | undefined;
}

function getMetricsStore(): SystemMetrics {
  if (!globalThis.__isave_metrics_store__) {
    globalThis.__isave_metrics_store__ = {
      totalExtractions: 0,
      totalDownloads: 0,
      totalErrors: 0,
      providers: {},
    };
  }
  return globalThis.__isave_metrics_store__;
}

export class MetricsTracker {
  recordExtraction(provider: string, isSuccess: boolean, durationMs: number, errorCode?: string): void {
    const store = getMetricsStore();
    store.totalExtractions++;
    if (!isSuccess) store.totalErrors++;

    const pKey = (provider || 'unknown').toLowerCase();
    if (!store.providers[pKey]) {
      store.providers[pKey] = {
        provider: pKey,
        successCount: 0,
        failureCount: 0,
        totalDurationMs: 0,
        errorsByCategory: {},
      };
    }

    const pMetric = store.providers[pKey];
    pMetric.totalDurationMs += durationMs;

    if (isSuccess) {
      pMetric.successCount++;
    } else {
      pMetric.failureCount++;
      const code = errorCode || 'UNKNOWN_ERROR';
      pMetric.errorsByCategory[code] = (pMetric.errorsByCategory[code] || 0) + 1;
    }
  }

  recordDownload(provider: string, isSuccess: boolean, durationMs: number, errorCode?: string): void {
    const store = getMetricsStore();
    store.totalDownloads++;
    if (!isSuccess) store.totalErrors++;

    const pKey = (provider || 'unknown').toLowerCase();
    if (!store.providers[pKey]) {
      store.providers[pKey] = {
        provider: pKey,
        successCount: 0,
        failureCount: 0,
        totalDurationMs: 0,
        errorsByCategory: {},
      };
    }

    const pMetric = store.providers[pKey];
    pMetric.totalDurationMs += durationMs;

    if (isSuccess) {
      pMetric.successCount++;
    } else {
      pMetric.failureCount++;
      const code = errorCode || 'UNKNOWN_ERROR';
      pMetric.errorsByCategory[code] = (pMetric.errorsByCategory[code] || 0) + 1;
    }
  }

  getMetrics(): SystemMetrics {
    return getMetricsStore();
  }

  reset(): void {
    globalThis.__isave_metrics_store__ = {
      totalExtractions: 0,
      totalDownloads: 0,
      totalErrors: 0,
      providers: {},
    };
  }
}

export const metricsTracker = new MetricsTracker();
