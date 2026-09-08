import crypto from 'crypto';

function getSigningSecret(): string {
  const secret = process.env.DOWNLOAD_SIGNING_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL: DOWNLOAD_SIGNING_SECRET environment variable is missing in production');
    }
    return 'isave-dev-signing-secret-key-2026';
  }
  return secret;
}

export interface VerifySignedUrlResult {
  valid: boolean;
  error?: string;
}

/**
 * Generates an expiring HMAC-SHA256 signed download URL.
 */
export function createSignedDownloadUrl(
  fileId: string,
  filename: string,
  ttlSeconds: number = 900
): string {
  const secret = getSigningSecret();
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const cleanFilename = filename.replace(/["\\\r\n]/g, '_');
  const payload = `${fileId}:${expires}:${cleanFilename}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return `/api/download?fileId=${fileId}&expires=${expires}&signature=${signature}&filename=${encodeURIComponent(cleanFilename)}`;
}

/**
 * Verifies an HMAC-SHA256 signed download URL.
 */
export function verifySignedDownloadUrl(
  fileId: string,
  expiresStr: string | null,
  signature: string | null,
  filename: string | null
): VerifySignedUrlResult {
  if (!fileId) {
    return { valid: false, error: 'fileId wajib diisi' };
  }

  // Mandatory signature & expiration check (NO unsigned bypass!)
  if (!expiresStr || !signature) {
    return { valid: false, error: 'Tanda tangan unduhan dan masa berlaku wajib ada (Mandatory signed download)' };
  }

  const expires = parseInt(expiresStr, 10);
  if (isNaN(expires) || Math.floor(Date.now() / 1000) > expires) {
    return { valid: false, error: 'Tautan unduhan telah kadaluarsa' };
  }

  let secret: string;
  try {
    secret = getSigningSecret();
  } catch (err: unknown) {
    return { valid: false, error: err instanceof Error ? err.message : 'Missing secret' };
  }

  const cleanFilename = (filename || '').replace(/["\\\r\n]/g, '_');
  const payload = `${fileId}:${expires}:${cleanFilename}`;
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, error: 'Tanda tangan unduhan tidak valid' };
  }

  return { valid: true };
}
