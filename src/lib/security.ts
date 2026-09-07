import { URL } from 'url';

/**
 * Validates if a URL is safe from SSRF attacks (blocks private, loopback, and internal IPs).
 */
export async function isSafeExternalUrl(urlStr: string): Promise<boolean> {
  try {
    const parsed = new URL(urlStr);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    let hostname = parsed.hostname.toLowerCase();

    // Remove brackets if IPv6
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
      hostname = hostname.slice(1, -1);
    }

    // Resolve DNS to get actual IP
    const lookup = await import('dns').then(dns => dns.promises.lookup(hostname)).catch(() => null);
    if (!lookup || !lookup.address) {
      return false; // Cannot resolve, deny
    }
    
    const ip = lookup.address.toLowerCase();

    // Block localhost & loopback names / IPs
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      ip === '0.0.0.0' ||
      ip === '::' ||
      ip === '::1' ||
      ip.startsWith('127.') ||
      ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('169.254.')
    ) {
      return false;
    }

    // 172.16.0.0/12 (Private)
    if (ip.startsWith('172.')) {
      const p2 = parseInt(ip.split('.')[1], 10);
      if (p2 >= 16 && p2 <= 31) return false;
    }

    // IPv6 local blocks
    if (
      ip.startsWith('fe80:') ||
      ip.startsWith('fc') ||
      ip.startsWith('fd') ||
      ip.includes('::ffff:127.') ||
      ip.includes('::ffff:10.') ||
      ip.includes('::ffff:192.168.') ||
      ip.includes('::ffff:169.254.')
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
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
