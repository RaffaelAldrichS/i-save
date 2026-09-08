import { describe, it, expect } from 'vitest';
import { isSafeExternalUrl, validateUrlForFetch } from '../security';

describe('isSafeExternalUrl - SSRF Protection', () => {
  it('allows valid public HTTPS and HTTP URLs', async () => {
    expect(await isSafeExternalUrl('https://youtube.com/watch?v=12345')).toBe(true);
    expect(await isSafeExternalUrl('https://www.tiktok.com/@user/video/123')).toBe(true);
    expect(await isSafeExternalUrl('https://instagram.com/p/C12345')).toBe(true);
    expect(await isSafeExternalUrl('http://facebook.com/watch/?v=123')).toBe(true);
  });

  it('blocks non-HTTP protocols', async () => {
    expect(await isSafeExternalUrl('file:///etc/passwd')).toBe(false);
    expect(await isSafeExternalUrl('ftp://example.com/file')).toBe(false);
    expect(await isSafeExternalUrl('javascript:alert(1)')).toBe(false);
  });

  it('blocks localhost and internal domain names', async () => {
    expect(await isSafeExternalUrl('http://localhost:3000')).toBe(false);
    expect(await isSafeExternalUrl('http://sub.localhost')).toBe(false);
    expect(await isSafeExternalUrl('http://server.local')).toBe(false);
  });

  it('blocks IPv4 private, CGNAT, benchmarking and loopback IP ranges', async () => {
    expect(await isSafeExternalUrl('http://127.0.0.1')).toBe(false);
    expect(await isSafeExternalUrl('http://127.0.0.2:8080')).toBe(false);
    expect(await isSafeExternalUrl('http://10.0.0.1')).toBe(false);
    expect(await isSafeExternalUrl('http://172.16.0.1')).toBe(false);
    expect(await isSafeExternalUrl('http://192.168.1.1')).toBe(false);
    expect(await isSafeExternalUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
    expect(await isSafeExternalUrl('http://0.0.0.0')).toBe(false);
    expect(await isSafeExternalUrl('http://100.64.0.1')).toBe(false); // CGNAT
    expect(await isSafeExternalUrl('http://198.18.0.1')).toBe(false); // Benchmarking
  });

  it('blocks IPv6 loopback, link-local, and mapped addresses', async () => {
    expect(await isSafeExternalUrl('http://[::1]')).toBe(false);
    expect(await isSafeExternalUrl('http://[0:0:0:0:0:0:0:1]')).toBe(false);
    expect(await isSafeExternalUrl('http://[::ffff:127.0.0.1]')).toBe(false);
    expect(await isSafeExternalUrl('http://[fe80::1]')).toBe(false);
    expect(await isSafeExternalUrl('http://[fc00::1]')).toBe(false);
  });

  it('blocks alternative encoded IP formats (decimal, octal, hex)', async () => {
    expect(await isSafeExternalUrl('http://2130706433')).toBe(false); // 127.0.0.1 as decimal integer
    expect(await isSafeExternalUrl('http://0177.0.0.1')).toBe(false); // 127 in octal
    expect(await isSafeExternalUrl('http://0x7f.0.0.1')).toBe(false); // 127 in hex
  });

  it('validateUrlForFetch throws on unsafe URLs and returns url on safe ones', async () => {
    await expect(validateUrlForFetch('http://127.0.0.1/secret')).rejects.toThrow();
    const safeUrl = 'https://youtube.com/watch?v=123';
    expect(await validateUrlForFetch(safeUrl)).toBe(safeUrl);
  });
});
