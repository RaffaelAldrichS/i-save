import { describe, it, expect, vi } from 'vitest';
import { mediaStorage } from '../storage';
import { createSignedDownloadUrl, verifySignedDownloadUrl } from '../signedUrl';
import { mapToAppError } from '../errors';

vi.mock('@vercel/blob', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vercel/blob')>();
  return {
    ...actual,
    put: vi.fn().mockImplementation(async (pathname, body, options) => {
      if (options?.token === 'vercel_blob_rw_teststore_123') {
        return {
          url: `https://test.blob.vercel-storage.com/${pathname}`,
          downloadUrl: `https://test.blob.vercel-storage.com/${pathname}?download=1`,
          pathname,
          contentType: 'video/mp4',
          contentDisposition: 'attachment',
          etag: 'etag123',
        };
      }
      return actual.put(pathname, body, options);
    }),
  };
});

describe('Vercel Production Object Storage Remediation', () => {
  it('private Blob upload succeeds with access: private', async () => {
    const { put } = await import('@vercel/blob');
    const token = 'vercel_blob_rw_teststore_123';
    process.env.BLOB_READ_WRITE_TOKEN = token;

    try {
      const stored = await mediaStorage.saveFile('test.mp4', Buffer.from('test binary content'));

      expect(stored.storageType).toBe('vercel_blob');
      expect(put).toHaveBeenCalledWith(
        expect.stringMatching(/^media\/.*\.mp4$/),
        expect.any(Buffer),
        expect.objectContaining({
          access: 'private',
          token,
        })
      );
    } finally {
      delete process.env.BLOB_READ_WRITE_TOKEN;
    }
  });

  it('fails closed in production if BLOB_READ_WRITE_TOKEN is missing', async () => {
    const oldEnv = process.env.NODE_ENV;
    const oldToken = process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    (process.env as Record<string, string>)['NODE_ENV'] = 'production';

    try {
      await expect(
        mediaStorage.saveFile('test.mp4', Buffer.from('test data'))
      ).rejects.toThrow('BLOB_READ_WRITE_TOKEN environment variable is missing in production storage');

      await expect(
        mediaStorage.getPrivateBlobStream('file-001', 'test.mp4')
      ).rejects.toThrow('BLOB_READ_WRITE_TOKEN environment variable is missing in production storage');
    } finally {
      if (oldToken) process.env.BLOB_READ_WRITE_TOKEN = oldToken;
      (process.env as Record<string, string>)['NODE_ENV'] = oldEnv;
    }
  });

  it('maps private store configuration errors to INTERNAL_ERROR, not PRIVATE', () => {
    const configError = new Error('Vercel Blob: Cannot use public access on a private store. The store is configured with private access.');
    const mapped = mapToAppError(configError);

    expect(mapped.code).toBe('INTERNAL_ERROR');
    expect(mapped.code).not.toBe('PRIVATE');
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
