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

    let hostname = parsed.hostname.toLowerCase();

    // Remove brackets if IPv6
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
      hostname = hostname.slice(1, -1);
    }

    // Block localhost & loopback names
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname === '0.0.0.0' ||
      hostname === '::' ||
      hostname === '::1' ||
      hostname === '0:0:0:0:0:0:0:1' ||
      hostname === '0:0:0:0:0:0:0:0'
    ) {
      return false;
    }

    // Block IPv6 link-local (fe80::/10), unique local (fc00::/7), and IPv4-mapped (::ffff:127.0.0.1)
    if (
      hostname.startsWith('fe80:') ||
      hostname.startsWith('fe90:') ||
      hostname.startsWith('fea0:') ||
      hostname.startsWith('feb0:') ||
      hostname.startsWith('fc') ||
      hostname.startsWith('fd') ||
      hostname.includes('::ffff:')
    ) {
      return false;
    }

    // If pure number (decimal integer IP like 2130706433)
    if (/^\d+$/.test(hostname)) {
      return false;
    }

    // IPv4 check (including octal/hex components)
    const parts = hostname.split('.');
    if (parts.length === 4) {
      const parsedParts = parts.map((part) => {
        if (/^0x[0-9a-f]+$/i.test(part)) return parseInt(part, 16);
        if (/^0\d+$/.test(part)) return parseInt(part, 8);
        if (/^\d+$/.test(part)) return parseInt(part, 10);
        return NaN;
      });

      if (parsedParts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
        const [p1, p2] = parsedParts;

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
export function parseMultiUrls(input: string): string[] {
  if (!input) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = input.match(urlRegex) || [];
  const valid = matches.filter((u) => isSafeExternalUrl(u.trim()));
  return Array.from(new Set(valid.map((u) => u.trim())));
}
