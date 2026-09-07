import { URL } from 'url';

/**
 * Validates if a URL is safe from SSRF attacks (blocks private, loopback, and internal IPs).
 */
export function isSafeExternalUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost & loopback names
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname === '0.0.0.0' ||
      hostname === '::1'
    ) {
      return false;
    }

    // IPv4 check
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);
    if (match) {
      const [, p1, p2] = match.map(Number);

      // 127.0.0.0/8 (Loopback)
      if (p1 === 127) return false;
      // 10.0.0.0/8 (Private)
      if (p1 === 10) return false;
      // 172.16.0.0/12 (Private)
      if (p1 === 172 && p2 >= 16 && p2 <= 31) return false;
      // 192.168.0.0/16 (Private)
      if (p1 === 192 && p2 === 168) return false;
      // 169.254.0.0/16 (Link-local / AWS Cloud metadata)
      if (p1 === 169 && p2 === 254) return false;
      // 0.0.0.0/8
      if (p1 === 0) return false;
    }

    return true;
  } catch {
    return false;
  }
}
