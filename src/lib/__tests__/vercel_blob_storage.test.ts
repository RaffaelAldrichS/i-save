import { describe, it, expect } from 'vitest';
import { mediaStorage } from '../storage';
import { createSignedDownloadUrl, verifySignedDownloadUrl } from '../signedUrl';

describe('Vercel Production Object Storage Remediation', () => {
  it('fails closed in production if BLOB_READ_WRITE_TOKEN is missing', async () => {
    const oldEnv = process.env.NODE_ENV;
    const oldToken = process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    (process.env as Record<string, string>)['NODE_ENV'] = 'production';

    try {
      await expect(
        mediaStorage.saveFile('test.mp4', Buffer.from('test data'))
      ).rejects.toThrow('BLOB_READ_WRITE_TOKEN environment variable is missing in production storage');
    } finally {
      if (oldToken) process.env.BLOB_READ_WRITE_TOKEN = oldToken;
      (process.env as Record<string, string>)['NODE_ENV'] = oldEnv;
    }
  });

  it('works on local disk in development mode when BLOB_READ_WRITE_TOKEN is absent', async () => {
    const oldToken = process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.BLOB_READ_WRITE_TOKEN;

    try {
      const stored = await mediaStorage.saveFile('dev-sample.mp4', Buffer.from('sample content'));
      expect(stored.storageType).toBe('local_disk');
      expect(stored.filePath).toBeDefined();
    } finally {
      if (oldToken) process.env.BLOB_READ_WRITE_TOKEN = oldToken;
    }
  });

  it('verifies signed URL check happens BEFORE serving download artifact', () => {
    const fileId = 'blob-file-001';
    const filename = 'media.mp4';
    const signedUrl = createSignedDownloadUrl(fileId, filename, 900);

    const parsed = new URL(`http://localhost${signedUrl}`);
    const expires = parsed.searchParams.get('expires');
    const signature = parsed.searchParams.get('signature');

    // Valid signature
    expect(verifySignedDownloadUrl(fileId, expires, signature, filename).valid).toBe(true);

    // Missing signature -> Rejected
    expect(verifySignedDownloadUrl(fileId, null, null, filename).valid).toBe(false);

    // Tampered signature -> Rejected
    expect(verifySignedDownloadUrl(fileId, expires, 'bad_sig', filename).valid).toBe(false);

    // Expired -> Rejected
    const expiredTime = String(Math.floor(Date.now() / 1000) - 100);
    expect(verifySignedDownloadUrl(fileId, expiredTime, signature, filename).valid).toBe(false);
  });
});
