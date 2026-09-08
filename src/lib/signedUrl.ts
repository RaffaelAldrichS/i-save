import crypto from 'crypto';

const SIGNING_SECRET = process.env.DOWNLOAD_SIGNING_SECRET || 'isave-secret-signing-key-default-2026';

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
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const cleanFilename = filename.replace(/["\\\r\n]/g, '_');
  const payload = `${fileId}:${expires}:${cleanFilename}`;
  const signature = crypto.createHmac('sha256', SIGNING_SECRET).update(payload).digest('hex');

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

  // If no signature/expires parameters are present, allow basic fileId access for backwards compatibility
  if (!expiresStr || !signature) {
    return { valid: true };
  }

  const expires = parseInt(expiresStr, 10);
  if (isNaN(expires) || Math.floor(Date.now() / 1000) > expires) {
    return { valid: false, error: 'Tautan unduhan telah kadaluarsa' };
  }

  const cleanFilename = (filename || '').replace(/["\\\r\n]/g, '_');
  const payload = `${fileId}:${expires}:${cleanFilename}`;
  const expectedSignature = crypto.createHmac('sha256', SIGNING_SECRET).update(payload).digest('hex');

  if (signature !== expectedSignature) {
    return { valid: false, error: 'Tanda tangan unduhan tidak valid' };
  }

  return { valid: true };
}
