import { URL } from 'url';
import dns from 'dns';
import net from 'net';

/**
 * Helper to check if an IP string belongs to private/reserved CIDRs.
 */
function isPrivateOrReservedIp(ip: string): boolean {
  // Normalize IPv6-mapped IPv4 e.g. ::ffff:127.0.0.1 -> 127.0.0.1
  let cleanIp = ip.toLowerCase();
  if (cleanIp.startsWith('::ffff:')) {
    cleanIp = cleanIp.slice(7);
  }

  if (net.isIPv4(cleanIp)) {
    const parts = cleanIp.split('.').map((p) => parseInt(p, 10));
    const [p0, p1] = parts;

    // 0.0.0.0/8 (Broadcast/Current network)
    if (p0 === 0) return true;
    // 127.0.0.0/8 (Loopback)
    if (p0 === 127) return true;
    // 10.0.0.0/8 (Private)
    if (p0 === 10) return true;
    // 172.16.0.0/12 (Private)
    if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (p0 === 192 && p1 === 168) return true;
    // 169.254.0.0/16 (Link-local / Cloud metadata)
    if (p0 === 169 && p1 === 254) return true;
    // 100.64.0.0/10 (Shared transition / CGNAT)
    if (p0 === 100 && p1 >= 64 && p1 <= 127) return true;
    // 198.18.0.0/15 (Benchmarking)
    if (p0 === 198 && (p1 === 18 || p1 === 19)) return true;
    // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
    if (p0 >= 224) return true;

    return false;
  }

  if (net.isIPv6(cleanIp)) {
    if (cleanIp === '::' || cleanIp === '::1' || cleanIp === '0:0:0:0:0:0:0:1') return true;
    if (cleanIp.startsWith('fe80:') || cleanIp.startsWith('fe9') || cleanIp.startsWith('fea') || cleanIp.startsWith('feb')) return true; // Link-local
    if (cleanIp.startsWith('fc') || cleanIp.startsWith('fd')) return true; // Unique local
    if (cleanIp.startsWith('ff')) return true; // Multicast
    return false;
  }

  return true; // If net.isIP fails, treat as unsafe
}

/**
 * Validates if a URL is safe from SSRF attacks (blocks private, loopback, and internal IPs).
 */
export async function isSafeExternalUrl(urlStr: string): Promise<boolean> {
  try {
    if (!urlStr || typeof urlStr !== 'string') return false;
    const rawLower = urlStr.toLowerCase().trim();

    // Block non-HTTP protocols and raw string patterns for local/mapped IPs
    if (
      rawLower.includes('localhost') ||
      rawLower.includes('169.254.') ||
      rawLower.includes('::ffff:') ||
      rawLower.includes('0.0.0.0') ||
      rawLower.includes('::1')
    ) {
      if (
        rawLower.includes('127.0.0.1') ||
        rawLower.includes('localhost') ||
        rawLower.includes('169.254.') ||
        rawLower.includes('::ffff:127.') ||
        rawLower.includes('::ffff:10.') ||
        rawLower.includes('::ffff:192.168.') ||
        rawLower.includes('::ffff:169.254.')
      ) {
        return false;
      }
    }

    const parsed = new URL(urlStr);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    let hostname = parsed.hostname.toLowerCase();

    // Remove brackets if IPv6
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
      hostname = hostname.slice(1, -1);
    }

    // Block localhost & loopback/internal hostname patterns before DNS lookup
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname === '0.0.0.0' ||
      hostname === '::' ||
      hostname === '::1' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||
      hostname.includes('::ffff:127.') ||
      hostname.includes('::ffff:10.') ||
      hostname.includes('::ffff:192.168.') ||
      hostname.includes('::ffff:169.254.')
    ) {
      return false;
    }

    // Block decimal / octal / hex integer IP notations (e.g., http://2130706433 or http://0177.0.0.1)
    if (/^(0x[0-9a-f]+|[0-9]+)$/i.test(hostname)) {
      return false; // Direct integer IP format denied
    }

    // If hostname is directly an IP, validate it
    if (net.isIP(hostname)) {
      if (isPrivateOrReservedIp(hostname)) return false;
    }

    // Resolve DNS to get actual IP
    const lookup = await dns.promises.lookup(hostname).catch(() => null);
    if (!lookup || !lookup.address) {
      return false; // Cannot resolve, deny
    }

    const resolvedIp = lookup.address.toLowerCase();

    if (isPrivateOrReservedIp(resolvedIp)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a URL for fetch operations, throwing an error if unsafe.
 */
export async function validateUrlForFetch(urlStr: string): Promise<string> {
  const isSafe = await isSafeExternalUrl(urlStr);
  if (!isSafe) {
    throw new Error('URL target tidak aman atau mengarah ke jaringan internal');
  }
  return urlStr;
}

/**
 * Returns accurate MIME type for a given file extension or filename.
 */
export function getMimeType(extOrFilename: string): string {
  const cleanExt = extOrFilename.toLowerCase().replace(/^\./, '');
  const mimeMap: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    wav: 'audio/wav',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    zip: 'application/zip',
    srt: 'text/plain; charset=utf-8',
    vtt: 'text/vtt; charset=utf-8',
    txt: 'text/plain; charset=utf-8',
  };
  return mimeMap[cleanExt] || 'application/octet-stream';
}

/**
 * Extracts and deduplicates valid HTTP/HTTPS URLs from a multi-line input string.
 */
export async function parseMultiUrls(input: string): Promise<string[]> {
  if (!input) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = input.match(urlRegex) || [];
  
  const results: string[] = [];
  for (const u of matches) {
    const trimmed = u.trim();
    if (await isSafeExternalUrl(trimmed)) {
      results.push(trimmed);
    }
  }
  
  return Array.from(new Set(results));
}
