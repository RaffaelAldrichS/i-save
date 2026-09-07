import { describe, it, expect } from 'vitest';
import { handleClipboardPaste } from '../DownloaderWorkspace';

describe('DownloaderWorkspace clipboard & error logic', () => {
  it('handles clipboard read success', async () => {
    const mockClipboard = {
      readText: async () => 'https://tiktok.com/@user/video/123456789',
    };
    const res = await handleClipboardPaste(mockClipboard as unknown as Clipboard);
    expect(res.url).toBe('https://tiktok.com/@user/video/123456789');
    expect(res.error).toBeNull();
  });

  it('handles clipboard permission error', async () => {
    const mockClipboard = {
      readText: async () => {
        throw new Error('Permission denied');
      },
    };
    const res = await handleClipboardPaste(mockClipboard as unknown as Clipboard);
    expect(res.url).toBeNull();
    expect(res.error).toBe('Izin clipboard ditolak. Silakan tempel manual (Ctrl+V)');
  });

  it('handles empty clipboard', async () => {
    const mockClipboard = {
      readText: async () => '',
    };
    const res = await handleClipboardPaste(mockClipboard as unknown as Clipboard);
    expect(res.url).toBeNull();
    expect(res.error).toBe('Papan klip (clipboard) kosong');
  });
});
