import { describe, it, expect, vi, beforeEach } from 'vitest';

const { execFileMock } = vi.hoisted(() => ({
  execFileMock: vi.fn(),
}));

vi.mock('child_process', () => ({
  execFile: execFileMock,
  exec: vi.fn(),
}));

import { InstagramExtractor } from '../extractors/instagram';

beforeEach(() => {
  execFileMock.mockReset();
  execFileMock.mockImplementation((_bin: string, _args: string[], _options: unknown, cb: (err: Error | null, res: { stdout: string; stderr: string }) => void) => {
    cb(null, { stdout: '', stderr: '' });
    return {} as unknown;
  });
});

describe('Command injection safety (LOGIC-01 regression)', () => {
  it('passes the user URL as a single argv element to execFile (never shell-interpolated)', async () => {
    const maliciousUrl =
      'https://www.instagram.com/reel/abc123/"; echo PWNED > /tmp/isave_probe; echo "';

    const extractor = new InstagramExtractor();
    await extractor.extract(maliciousUrl);

    expect(execFileMock).toHaveBeenCalledTimes(1);
    const [bin, args] = execFileMock.mock.calls[0];
    expect(bin).toContain('yt-dlp');
    expect(Array.isArray(args)).toBe(true);
    expect(args[args.length - 1]).toBe(maliciousUrl);
    expect(args.filter((a: string) => a === maliciousUrl).length).toBe(1);
  });

  it('extract() does not fail when execFile output is empty (graceful fallback)', async () => {
    const extractor = new InstagramExtractor();
    const metadata = await extractor.extract('https://www.instagram.com/reel/C123456789/');
    expect(metadata.platform).toBe('instagram');
    expect(metadata.formats.length).toBeGreaterThan(0);
  });
});