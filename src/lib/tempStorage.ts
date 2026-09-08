import { mediaStorage, StoredMediaFile } from './storage';

export type TempFileInfo = StoredMediaFile;

export class TempStorage {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_dirName?: string) {}
  async saveFile(filename: string, buffer: Buffer): Promise<TempFileInfo> {
    return await mediaStorage.saveFile(filename, buffer);
  }

  async registerFileFromPath(originalPath: string, filename: string): Promise<TempFileInfo> {
    return await mediaStorage.registerFileFromPath(originalPath, filename);
  }

  getFile(id: string): TempFileInfo | null {
    return mediaStorage.getFile(id);
  }

  cleanupExpired(ttlMs: number = 15 * 60 * 1000): void {
    mediaStorage.cleanupExpired(ttlMs);
  }

  cleanupAll(): void {
    mediaStorage.cleanupAll();
  }
}

export const tempStorage = new TempStorage();
