export type ErrorCode =
  | 'UNSUPPORTED'
  | 'EXTRACTION_FAILED'
  | 'PRIVATE'
  | 'RATE_LIMITED'
  | 'PROCESSING_TIMEOUT'
  | 'INVALID_URL'
  | 'INTERNAL_ERROR';

export interface AppError {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  providerError?: string;
}

export class AppCustomError extends Error {
  public readonly code: ErrorCode;
  public readonly retryable: boolean;
  public readonly providerError?: string;

  constructor(code: ErrorCode, message: string, retryable: boolean = false, providerError?: string) {
    super(message);
    this.name = 'AppCustomError';
    this.code = code;
    this.retryable = retryable;
    this.providerError = providerError;
  }

  toJSON(): AppError {
    return {
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      ...(this.providerError ? { providerError: this.providerError } : {}),
    };
  }
}

export function mapToAppError(err: unknown): AppError {
  if (err instanceof AppCustomError) {
    return err.toJSON();
  }

  const rawMessage = err instanceof Error ? err.message : String(err || '');
  const lower = rawMessage.toLowerCase();

  if (lower.includes('rate limit') || lower.includes('terlalu banyak') || lower.includes('429')) {
    return {
      code: 'RATE_LIMITED',
      message: rawMessage || 'Terlalu banyak permintaan (Rate limit). Coba lagi dalam beberapa saat.',
      retryable: true,
      providerError: rawMessage,
    };
  }

  if (
    lower.includes('ssrf') ||
    lower.includes('internal yang dilarang') ||
    lower.includes('wajib diisi') ||
    lower.includes('url tidak valid')
  ) {
    return {
      code: 'INVALID_URL',
      message: rawMessage || 'URL tidak valid atau mengarah ke alamat yang dilarang.',
      retryable: false,
      providerError: rawMessage,
    };
  }

  if (
    lower.includes('private store') ||
    lower.includes('cannot use public access') ||
    lower.includes('blob_read_write_token') ||
    lower.includes('store is configured with private access')
  ) {
    return {
      code: 'INTERNAL_ERROR',
      message: rawMessage || 'Terjadi kesalahan internal pada penyimpanan Vercel Blob.',
      retryable: true,
      providerError: rawMessage,
    };
  }

  if (lower.includes('privat') || lower.includes('private') || lower.includes('diubah ke privat')) {
    return {
      code: 'PRIVATE',
      message: 'Media disetel privat atau membutuhkan otentikasi untuk diakses.',
      retryable: false,
      providerError: rawMessage,
    };
  }

  if (lower.includes('tidak didukung') || lower.includes('unsupported')) {
    return {
      code: 'UNSUPPORTED',
      message: 'Platform atau URL ini tidak didukung saat ini.',
      retryable: false,
      providerError: rawMessage,
    };
  }

  if (lower.includes('timeout') || lower.includes('melebihi batas waktu') || lower.includes('timed out')) {
    return {
      code: 'PROCESSING_TIMEOUT',
      message: 'Proses pengunduhan/ekstraksi melebihi batas waktu. Silakan coba lagi.',
      retryable: true,
      providerError: rawMessage,
    };
  }

  if (
    lower.includes('yt-dlp') ||
    lower.includes('gagal mengekstraksi') ||
    lower.includes('gagal mengunduh') ||
    lower.includes('ekstraksi')
  ) {
    return {
      code: 'EXTRACTION_FAILED',
      message: rawMessage || 'Gagal mengekstraksi media dari platform target.',
      retryable: true,
      providerError: rawMessage,
    };
  }

  return {
    code: 'INTERNAL_ERROR',
    message: rawMessage || 'Terjadi kesalahan internal pada server.',
    retryable: true,
    providerError: rawMessage,
  };
}
