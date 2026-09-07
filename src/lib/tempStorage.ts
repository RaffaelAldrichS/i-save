import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

export interface TempFileInfo {
  id: string;
  filename: string;
  filePath: string;
  size: number;
  createdAt: Date;
}

export class TempStorage {
  private storageDir: string;

  constructor(dirName: string = 'isave-temp-downloads') {
    this.storageDir = path.join(os.tmpdir(), dirName);
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  async saveFile(filename: string, buffer: Buffer): Promise<TempFileInfo> {
    const id = uuidv4();
    const ext = path.extname(filename);
    const safeFilename = `${id}${ext}`;
    const filePath = path.join(this.storageDir, safeFilename);

    await fs.promises.writeFile(filePath, buffer);

    return {
      id,
      filename,
      filePath,
      size: buffer.length,
      createdAt: new Date(),
    };
  }

  getFile(id: string): TempFileInfo | null {
    try {
      const files = fs.readdirSync(this.storageDir);
      const match = files.find((file) => file.startsWith(id));
      if (!match) return null;

      const filePath = path.join(this.storageDir, match);
      const stat = fs.statSync(filePath);

      return {
        id,
        filename: match,
        filePath,
        size: stat.size,
        createdAt: stat.birthtime,
      };
    } catch {
      return null;
    }
  }

  cleanupExpired(ttlMs: number = 15 * 60 * 1000): void {
    try {
      const now = Date.now();
      const files = fs.readdirSync(this.storageDir);

      for (const file of files) {
        const filePath = path.join(this.storageDir, file);
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > ttlMs) {
          fs.unlinkSync(filePath);
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  }

  cleanupAll(): void {
    try {
      if (fs.existsSync(this.storageDir)) {
        fs.rmSync(this.storageDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

export const tempStorage = new TempStorage();
