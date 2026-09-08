import { put, get } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { AppCustomError } from './errors';
import { getMimeType } from './security';

export interface StoredMediaFile {
  id: string;
  filename: string;
  filePath: string;
  size: number;
  createdAt: Date;
  storageType: 'vercel_blob' | 'local_disk';
  blobUrl?: string;
}

export class MediaStorageManager {
  private localDir: string;

  constructor() {
    this.localDir = path.join(os.tmpdir(), 'isave-temp-downloads');
    if (!fs.existsSync(this.localDir)) {
      fs.mkdirSync(this.localDir, { recursive: true });
    }
  }

  getBlobToken(): string | undefined {
    return process.env.BLOB_READ_WRITE_TOKEN;
  }

  isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  async saveFile(filename: string, buffer: Buffer): Promise<StoredMediaFile> {
    const token = this.getBlobToken();
    const isProd = this.isProduction();

    if (isProd && !token) {
      throw new AppCustomError(
        'INTERNAL_ERROR',
        'BLOB_READ_WRITE_TOKEN environment variable is missing in production storage',
        false
      );
    }

    if (token) {
      const id = uuidv4();
      const ext = path.extname(filename);
      const safeFilename = `${id}${ext}`;

      const blob = await put(`media/${safeFilename}`, buffer, {
        access: 'private',
        token,
      });

      return {
        id,
        filename,
        filePath: blob.url,
        blobUrl: blob.url,
        size: buffer.length,
        createdAt: new Date(),
        storageType: 'vercel_blob',
      };
    }

    // Local Disk Fallback (Development / Vitest offline testing only)
    if (!fs.existsSync(this.localDir)) {
      fs.mkdirSync(this.localDir, { recursive: true });
    }
    const id = uuidv4();
    const ext = path.extname(filename);
    const safeFilename = `${id}${ext}`;
    const targetPath = path.join(this.localDir, safeFilename);

    await fs.promises.writeFile(targetPath, buffer);

    return {
      id,
      filename,
      filePath: targetPath,
      size: buffer.length,
      createdAt: new Date(),
      storageType: 'local_disk',
    };
  }

  async registerFileFromPath(originalPath: string, filename: string): Promise<StoredMediaFile> {
    const token = this.getBlobToken();
    const isProd = this.isProduction();

    if (isProd && !token) {
      throw new AppCustomError(
        'INTERNAL_ERROR',
        'BLOB_READ_WRITE_TOKEN environment variable is missing in production storage',
        false
      );
    }

    if (token) {
      const buffer = await fs.promises.readFile(originalPath);
      const fileInfo = await this.saveFile(filename, buffer);

      try {
        await fs.promises.unlink(originalPath);
      } catch {
        // Ignore local temp cleanup error
      }

      return fileInfo;
    }

    // Local Disk Fallback (Development / Vitest offline testing only)
    const id = uuidv4();
    const ext = path.extname(filename) || path.extname(originalPath);
    const safeFilename = `${id}${ext}`;
    const targetPath = path.join(this.localDir, safeFilename);

    try {
      await fs.promises.rename(originalPath, targetPath);
    } catch {
      await fs.promises.copyFile(originalPath, targetPath);
      try { await fs.promises.unlink(originalPath); } catch {}
    }

    const stat = await fs.promises.stat(targetPath);

    return {
      id,
      filename,
      filePath: targetPath,
      size: stat.size,
      createdAt: stat.birthtime || new Date(),
      storageType: 'local_disk',
    };
  }

  getFile(id: string): StoredMediaFile | null {
    try {
      if (!id || typeof id !== 'string') return null;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) return null;

      const files = fs.readdirSync(this.localDir);
      const match = files.find((file) => file === id || file.startsWith(`${id}.`));
      if (!match) return null;

      const filePath = path.join(this.localDir, match);
      const stat = fs.statSync(filePath);

      return {
        id,
        filename: match,
        filePath,
        size: stat.size,
        createdAt: stat.birthtime,
        storageType: 'local_disk',
      };
    } catch {
      return null;
    }
  }

  async getPrivateBlobStream(
    fileIdOrPath: string,
    filename?: string
  ): Promise<{ stream: ReadableStream; contentType: string; size?: number } | null> {
    const token = this.getBlobToken();
    const isProd = this.isProduction();

    if (isProd && !token) {
      throw new AppCustomError(
        'INTERNAL_ERROR',
        'BLOB_READ_WRITE_TOKEN environment variable is missing in production storage',
        false
      );
    }

    if (!token) return null;

    const ext = filename ? path.extname(filename) : '';
    const candidates: string[] = [];

    if (fileIdOrPath.startsWith('https://') || fileIdOrPath.includes('/')) {
      candidates.push(fileIdOrPath);
    } else {
      if (ext) {
        candidates.push(`media/${fileIdOrPath}${ext}`);
      }
      candidates.push(`media/${fileIdOrPath}`);
      for (const e of ['.mp4', '.mp3', '.jpg', '.zip']) {
        if (e !== ext) candidates.push(`media/${fileIdOrPath}${e}`);
      }
    }

    for (const candidate of candidates) {
      try {
        const res = await get(candidate, { access: 'private', token });
        if (res && res.stream) {
          return {
            stream: res.stream as unknown as ReadableStream,
            contentType: res.blob.contentType || getMimeType(ext || 'bin'),
            size: res.blob.size || undefined,
          };
        }
      } catch (err: unknown) {
        if (isProd && err instanceof Error && err.message.includes('BLOB_READ_WRITE_TOKEN')) {
          throw err;
        }
      }
    }

    return null;
  }

  cleanupExpired(ttlMs: number = 15 * 60 * 1000): void {
    try {
      const now = Date.now();
      if (fs.existsSync(this.localDir)) {
        const files = fs.readdirSync(this.localDir);
        for (const file of files) {
          const filePath = path.join(this.localDir, file);
          const stat = fs.statSync(filePath);
          if (now - stat.mtimeMs > ttlMs) {
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  cleanupAll(): void {
    try {
      if (fs.existsSync(this.localDir)) {
        fs.rmSync(this.localDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore
    }
  }
}

export const mediaStorage = new MediaStorageManager();
