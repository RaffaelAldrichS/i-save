import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YouTubeProvider } from '../extractors/youtube';

const { execFileMock } = vi.hoisted(() => ({
  execFileMock: vi.fn(),
}));

vi.mock('child_process', () => ({
  execFile: execFileMock,
  exec: vi.fn(),
}));

describe('P1.3 — Real Format Discovery (No Fake Qualities)', () => {
  beforeEach(() => {
    execFileMock.mockReset();
  });

  it('eliminates 4K (2160p), 2K (1440p), and 1080p when source video max resolution is 720p', async () => {
    // Mock yt-dlp dump-single-json output for a 720p max video
    const mockYtDlpJson = JSON.stringify({
      title: '720p Max Video',
      uploader: 'Test Channel',
      duration: 120,
      formats: [
        { format_id: '18', ext: 'mp4', height: 360, vcodec: 'avc1.42001E', acodec: 'mp4a.40.2' },
        { format_id: '135', ext: 'mp4', height: 480, vcodec: 'avc1.4d401e', acodec: 'none' },
        { format_id: '136', ext: 'mp4', height: 720, vcodec: 'avc1.4d401f', acodec: 'none' },
        { format_id: '140', ext: 'm4a', height: null, vcodec: 'none', acodec: 'mp4a.40.2' },
      ],
    });

    execFileMock.mockImplementation((_bin: string, _args: string[], _opts: unknown, cb: (err: Error | null, res: { stdout: string; stderr: string }) => void) => {
      cb(null, { stdout: mockYtDlpJson, stderr: '' });
      return {} as unknown;
    });

    const provider = new YouTubeProvider();
    const result = await provider.extract('https://www.youtube.com/watch?v=720pVideoId');

    const qualities = result.media.map((m) => m.quality);

    // Verify 720p, 480p, 360p exist
    expect(qualities).toContain('720p HD');
    expect(qualities).toContain('480p SD');
    expect(qualities).toContain('360p Low');

    // VERIFY FAKE QUALITIES ARE NOT GENERATED:
    expect(qualities).not.toContain('4K Ultra HD (2160p)');
    expect(qualities).not.toContain('2K QHD (1440p)');
    expect(qualities).not.toContain('1080p Full HD');
  });

  it('includes 1080p and 4K when yt-dlp reports 2160p max resolution', async () => {
    const mockYtDlpJson = JSON.stringify({
      title: '4K Nature Video',
      uploader: 'Nature Channel',
      duration: 300,
      formats: [
        { format_id: '18', ext: 'mp4', height: 360, vcodec: 'avc1.42001E', acodec: 'mp4a.40.2' },
        { format_id: '137', ext: 'mp4', height: 1080, vcodec: 'avc1.640028', acodec: 'none' },
        { format_id: '313', ext: 'webm', height: 2160, vcodec: 'vp9', acodec: 'none' },
      ],
    });

    execFileMock.mockImplementation((_bin: string, _args: string[], _opts: unknown, cb: (err: Error | null, res: { stdout: string; stderr: string }) => void) => {
      cb(null, { stdout: mockYtDlpJson, stderr: '' });
      return {} as unknown;
    });

    const provider = new YouTubeProvider();
    const result = await provider.extract('https://www.youtube.com/watch?v=4kVideoId12');

    const qualities = result.media.map((m) => m.quality);

    expect(qualities).toContain('4K Ultra HD (2160p)');
    expect(qualities).toContain('1080p Full HD');
    expect(qualities).toContain('360p Low');
    expect(qualities).not.toContain('2K QHD (1440p)'); // 1440p not in source formats
  });
});
