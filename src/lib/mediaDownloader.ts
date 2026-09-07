import { execFile } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execFilePromise = util.promisify(execFile);

export interface DownloadResult {
  filePath: string;
  buffer: Buffer;
  filename: string;
  ext: string;
}

export async function processMediaDownload(
  url: string,
  formatId: string
): Promise<DownloadResult> {
  const isAudio = formatId.includes('audio') || formatId.includes('mp3');
  const ext = isAudio ? 'mp3' : 'mp4';
  const tempDir = os.tmpdir();
  const filePrefix = `isave_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const tempFilePath = path.join(tempDir, `${filePrefix}.${ext}`);

  // 1. TikTok Handler via TikWM API
  if (/tiktok\.com/i.test(url)) {
    try {
      const apiRes = await fetch(
        `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`
      );
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json.data) {
          let mediaUrl: string | undefined = isAudio
            ? json.data.music || json.data.play
            : json.data.play;

          if (mediaUrl) {
            if (!mediaUrl.startsWith('http')) {
              mediaUrl = `https://www.tikwm.com${mediaUrl}`;
            }

            const mediaRes = await fetch(mediaUrl, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
            });

            if (mediaRes.ok && mediaRes.body) {
              const arrayBuf = await mediaRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuf);
              if (buffer.length > 1000) {
                await fs.promises.writeFile(tempFilePath, buffer);
                const titleSlug = (json.data.title || 'tiktok-video')
                  .slice(0, 30)
                  .replace(/[^a-zA-Z0-9]/g, '_');
                return {
                  filePath: tempFilePath,
                  get buffer() {
                    return fs.readFileSync(tempFilePath);
                  },
                  filename: `${titleSlug}.${ext}`,
                  ext,
                };
              }
            }
          }
        }
      }
    } catch {
      // Fallback to yt-dlp if TikWM API fails
    }
  }

  // 2. yt-dlp Handler for YouTube, Instagram, TikTok fallback
  try {
    const ytDlpFormat = isAudio
      ? 'ba/best'
      : '18/22/b[height<=720]/b/bestvideo+bestaudio/best';

    await execFilePromise('yt-dlp', [
      '--no-playlist',
      '--no-part',
      '--js-runtimes',
      'node',
      '--remote-components',
      'ejs:github',
      '--max-filesize',
      '200m',
      '-f',
      ytDlpFormat,
      '-o',
      tempFilePath,
      url,
    ]);

    // Look for exact file or any file created with prefix
    let actualFilePath = tempFilePath;
    if (!fs.existsSync(/*turbopackIgnore: true*/ actualFilePath)) {
      const files = fs.readdirSync(tempDir);
      const matched = files.find((f) => f.startsWith(filePrefix));
      if (matched) {
        actualFilePath = path.join(tempDir, matched);
      }
    }

    if (fs.existsSync(/*turbopackIgnore: true*/ actualFilePath)) {
      const stat = fs.statSync(/*turbopackIgnore: true*/ actualFilePath);
      const actualExt = path.extname(actualFilePath).replace('.', '') || ext;

      if (stat.size > 1000) {
        const finalPath = actualFilePath;
        return {
          filePath: finalPath,
          get buffer() {
            return fs.readFileSync(/*turbopackIgnore: true*/ finalPath);
          },
          filename: `media_${formatId}.${actualExt}`,
          ext: actualExt,
        };
      }
    }
  } catch (err: unknown) {
    // Cleanup any lingering temp file
    try {
      const files = fs.readdirSync(tempDir);
      files
        .filter((f) => f.startsWith(filePrefix))
        .forEach((f) => fs.unlinkSync(path.join(tempDir, f)));
    } catch {
      // Ignore cleanup error
    }
    const msg = err instanceof Error ? err.message : 'yt-dlp failed';
    throw new Error(`Gagal mengunduh media dari URL target: ${msg}`);
  }

  throw new Error('Media tidak dapat diunduh atau format tidak tersedia');
}
