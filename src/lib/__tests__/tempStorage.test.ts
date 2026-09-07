import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TempStorage } from '../tempStorage';
import fs from 'fs';

describe('TempStorage Service', () => {
  let tempStorage: TempStorage;

  beforeEach(() => {
    tempStorage = new TempStorage('test-isave-downloads');
  });

  afterEach(() => {
    tempStorage.cleanupAll();
  });

  it('should create a temp file and return valid metadata', async () => {
    const content = Buffer.from('test video stream content');
    const filename = 'test-video.mp4';

    const fileInfo = await tempStorage.saveFile(filename, content);

    expect(fileInfo.id).toBeDefined();
    expect(fileInfo.filename).toBe(filename);
    expect(fs.existsSync(fileInfo.filePath)).toBe(true);
  });

  it('should retrieve existing temp file by ID', async () => {
    const content = Buffer.from('sample media data');
    const fileInfo = await tempStorage.saveFile('sample.mp3', content);

    const retrieved = tempStorage.getFile(fileInfo.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.filePath).toBe(fileInfo.filePath);
    expect(fs.readFileSync(retrieved!.filePath).toString()).toBe('sample media data');
  });

  it('should return null for non-existent file ID', () => {
    const retrieved = tempStorage.getFile('non-existent-id');
    expect(retrieved).toBeNull();
  });

  it('should clean up files older than TTL', async () => {
    const fileInfo = await tempStorage.saveFile('expired.mp4', Buffer.from('data'));

    // Manually set mtime to past TTL (e.g. 20 mins ago)
    const pastTime = new Date(Date.now() - 20 * 60 * 1000);
    fs.utimesSync(fileInfo.filePath, pastTime, pastTime);

    tempStorage.cleanupExpired(15 * 60 * 1000); // 15 mins TTL

    expect(fs.existsSync(fileInfo.filePath)).toBe(false);
  });
});
