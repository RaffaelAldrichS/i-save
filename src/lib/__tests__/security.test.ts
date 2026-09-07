import { describe, it, expect } from 'vitest';
import { isSafeExternalUrl } from '../security';

describe('isSafeExternalUrl - SSRF Protection', () => {
  it('allows valid public HTTPS and HTTP URLs', () => {
    expect(isSafeExternalUrl('https://youtube.com/watch?v=12345')).toBe(true);
    expect(isSafeExternalUrl('https://www.tiktok.com/@user/video/123')).toBe(true);
    expect(isSafeExternalUrl('https://instagram.com/p/C12345')).toBe(true);
    expect(isSafeExternalUrl('http://facebook.com/watch/?v=123')).toBe(true);
  });

  it('blocks non-HTTP protocols', () => {
    expect(isSafeExternalUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeExternalUrl('ftp://example.com/file')).toBe(false);
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
  });

  it('blocks localhost and internal domain names', () => {
    expect(isSafeExternalUrl('http://localhost:3000')).toBe(false);
    expect(isSafeExternalUrl('http://sub.localhost')).toBe(false);
    expect(isSafeExternalUrl('http://server.local')).toBe(false);
  });

  it('blocks IPv4 private and loopback IP ranges', () => {
    expect(isSafeExternalUrl('http://127.0.0.1')).toBe(false);
    expect(isSafeExternalUrl('http://127.0.0.2:8080')).toBe(false);
    expect(isSafeExternalUrl('http://10.0.0.1')).toBe(false);
    expect(isSafeExternalUrl('http://172.16.0.1')).toBe(false);
    expect(isSafeExternalUrl('http://192.168.1.1')).toBe(false);
    expect(isSafeExternalUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
    expect(isSafeExternalUrl('http://0.0.0.0')).toBe(false);
  });

  it('blocks IPv6 loopback, link-local, and mapped addresses', () => {
    expect(isSafeExternalUrl('http://[::1]')).toBe(false);
    expect(isSafeExternalUrl('http://[0:0:0:0:0:0:0:1]')).toBe(false);
    expect(isSafeExternalUrl('http://[::ffff:127.0.0.1]')).toBe(false);
    expect(isSafeExternalUrl('http://[fe80::1]')).toBe(false);
    expect(isSafeExternalUrl('http://[fc00::1]')).toBe(false);
  });

  it('blocks alternative encoded IP formats (decimal, octal, hex)', () => {
    expect(isSafeExternalUrl('http://2130706433')).toBe(false); // 127.0.0.1 as decimal integer
    expect(isSafeExternalUrl('http://0177.0.0.1')).toBe(false); // 127 in octal
    expect(isSafeExternalUrl('http://0x7f.0.0.1')).toBe(false); // 127 in hex
  });
});
