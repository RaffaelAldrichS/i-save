import { execFile, spawn } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import ffmpegPath from 'ffmpeg-static';
import { buildCarouselZip, ImageFile } from './carouselZip';
import { progressTracker } from './progressTracker';
import { isSafeExternalUrl } from './security';

const execFilePromise = util.promisify(execFile);

export interface DownloadResult {
  filePath: string;
  buffer: Buffer;
  filename: string;
  ext: string;
}

export function parseTrimOption(formatId: string): { startTime: string; endTime: string } | null {
  const match = formatId.match(/trim_(\d{2}:\d{2}(?::\d{2})?)_(\d{2}:\d{2}(?::\d{2})?)/);
  if (!match) return null;
  return { startTime: match[1], endTime: match[2] };
}

export async function processMediaDownload(
  url: string,
  formatId: string,
  jobId?: string
): Promise<DownloadResult> {
  const isAudio = formatId.includes('audio') || formatId.includes('mp3');
  const isZip = formatId.includes('zip') || formatId.includes('carousel');
  const isImage = formatId.includes('img') || formatId.includes('slide') || formatId.includes('photo');
  const ext = isZip ? 'zip' : isAudio ? 'mp3' : isImage ? 'jpg' : 'mp4';
  const tempDir = os.tmpdir();
  const filePrefix = `isave_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const jobDir = path.join(tempDir, 'isave-jobs', filePrefix);
  if (!fs.existsSync(jobDir)) {
    fs.mkdirSync(jobDir, { recursive: true });
  }
  const tempFilePath = path.join(jobDir, `${filePrefix}.${ext}`);

  // 1. TikTok Handler via TikWM API (Supports Video, Audio, and Photo Carousel Slides)
  if (/tiktok\.com/i.test(url)) {
    try {
      const apiRes = await fetch(
        `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`
      );
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json.data) {
          // TikTok Photo Carousel Slideshow
          if (json.data.images && Array.isArray(json.data.images) && json.data.images.length > 0) {
            const images: string[] = json.data.images;
            if (isZip || formatId.includes('carousel-zip')) {
              const imageFiles: ImageFile[] = [];
              for (let i = 0; i < images.length; i++) {
                let imgUrl = images[i];
                if (!imgUrl.startsWith('http')) imgUrl = `https://www.tikwm.com${imgUrl}`;
                if (!(await isSafeExternalUrl(imgUrl))) continue;
                const imgRes = await fetch(imgUrl);
                if (imgRes.ok) {
                  const arrBuf = await imgRes.arrayBuffer();
                  imageFiles.push({
                    filename: `slide_${i + 1}.jpg`,
                    buffer: Buffer.from(arrBuf),
                  });
                }
              }

              if (imageFiles.length > 0) {
                const zipBuffer = await buildCarouselZip(imageFiles);
                await fs.promises.writeFile(tempFilePath, zipBuffer);
                const titleSlug = (json.data.title || 'tiktok-slideshow')
                  .slice(0, 30)
                  .replace(/[^a-zA-Z0-9]/g, '_');
                return {
                  filePath: tempFilePath,
                  get buffer() {
                    return fs.readFileSync(tempFilePath);
                  },
                  filename: `${titleSlug}_slides.zip`,
                  ext: 'zip',
                };
              }
            } else if (formatId.includes('slide-')) {
              const matchIndex = formatId.match(/slide-(\d+)/);
              const slideIdx = matchIndex ? parseInt(matchIndex[1], 10) - 1 : 0;
              const targetUrl = images[slideIdx] || images[0];
              const fullImgUrl = targetUrl.startsWith('http') ? targetUrl : `https://www.tikwm.com${targetUrl}`;
              if (await isSafeExternalUrl(fullImgUrl)) {
                const imgRes = await fetch(fullImgUrl);
                if (imgRes.ok) {
                  const arrBuf = await imgRes.arrayBuffer();
                  const buffer = Buffer.from(arrBuf);
                  await fs.promises.writeFile(tempFilePath, buffer);
                  return {
                    filePath: tempFilePath,
                    get buffer() {
                      return fs.readFileSync(tempFilePath);
                    },
                    filename: `tiktok_slide_${slideIdx + 1}.jpg`,
                    ext: 'jpg',
                  };
                }
              }
            }
          }

          // Single TikTok Video or Audio Track
          let mediaUrl: string | undefined = isAudio
            ? json.data.music || json.data.play
            : json.data.play;

          if (mediaUrl) {
            if (!mediaUrl.startsWith('http')) {
              mediaUrl = `https://www.tikwm.com${mediaUrl}`;
            }

            if (await isSafeExternalUrl(mediaUrl)) {
              const mediaRes = await fetch(mediaUrl, {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
              });

              if (mediaRes.ok && mediaRes.body) {
                const fileStream = fs.createWriteStream(tempFilePath);
                try {
                  await pipeline(Readable.fromWeb(mediaRes.body as unknown as import('stream/web').ReadableStream), fileStream);
                } catch {
                  fileStream.destroy();
                }

                const stat = fs.existsSync(tempFilePath) ? fs.statSync(tempFilePath) : null;
                if (stat && stat.size > 1000) {
                  const titleSlug = (json.data.title || 'tiktok-media')
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
      }
    } catch {
      // Fallback to yt-dlp if TikWM API fails
    }
  }

  // 1.b Instagram Photo / Carousel / Slide Handler
  if (/(?:instagram\.com|instagr\.am)/i.test(url) && (isImage || isZip || formatId.includes('slide-') || formatId.includes('zip'))) {
    try {
      const matchCode = url.match(/(?:p|reel|reels|tv|stories|share\/p|share\/reel)\/([a-zA-Z0-9_-]+)/i);
      const shortcode = matchCode ? matchCode[1] : null;

      if (shortcode) {
        if (isZip || formatId.includes('zip')) {
          const { stderr } = await execFilePromise('yt-dlp', ['--dump-single-json', '--no-playlist', url], { timeout: 15000 }).catch((e: unknown) => {
            const errObj = e as { stderr?: string };
            return { stderr: errObj.stderr || '' };
          });
          const slideCodes = [...stderr.matchAll(/\[Instagram\]\s+([a-zA-Z0-9_-]+):/g)].map((m) => m[1]);
          const targetCodes = slideCodes.length > 0 ? slideCodes : [shortcode];

          const imageFiles: ImageFile[] = [];
          for (let i = 0; i < targetCodes.length; i++) {
            const code = targetCodes[i];
            const imgRes = await fetch(`https://www.instagram.com/p/${code}/media/?size=l`, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
            });
            if (imgRes.ok) {
              const arrBuf = await imgRes.arrayBuffer();
              imageFiles.push({
                filename: `slide_${i + 1}.jpg`,
                buffer: Buffer.from(arrBuf),
              });
            }
          }

          if (imageFiles.length > 0) {
            const zipBuffer = await buildCarouselZip(imageFiles);
            await fs.promises.writeFile(tempFilePath, zipBuffer);
            return {
              filePath: tempFilePath,
              get buffer() {
                return fs.readFileSync(tempFilePath);
              },
              filename: `instagram_${shortcode}_slides.zip`,
              ext: 'zip',
            };
          }
        } else if (formatId.includes('slide-')) {
          const matchIndex = formatId.match(/slide-(\d+)/);
          const slideNum = matchIndex ? parseInt(matchIndex[1], 10) : 1;

          const { stderr } = await execFilePromise('yt-dlp', ['--dump-single-json', '--no-playlist', url], { timeout: 15000 }).catch((e: unknown) => {
            const errObj = e as { stderr?: string };
            return { stderr: errObj.stderr || '' };
          });
          const slideCodes = [...stderr.matchAll(/\[Instagram\]\s+([a-zA-Z0-9_-]+):/g)].map((m) => m[1]);
          const targetCode = slideCodes[slideNum - 1] || shortcode;

          const imgRes = await fetch(`https://www.instagram.com/p/${targetCode}/media/?size=l`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
          });
          if (imgRes.ok) {
            const arrBuf = await imgRes.arrayBuffer();
            const buffer = Buffer.from(arrBuf);
            await fs.promises.writeFile(tempFilePath, buffer);
            return {
              filePath: tempFilePath,
              get buffer() {
                return fs.readFileSync(tempFilePath);
              },
              filename: `instagram_${shortcode}_slide_${slideNum}.jpg`,
              ext: 'jpg',
            };
          }
        } else if (isImage || formatId.includes('img')) {
          const imgRes = await fetch(`https://www.instagram.com/p/${shortcode}/media/?size=l`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
          });
          if (imgRes.ok) {
            const arrBuf = await imgRes.arrayBuffer();
            const buffer = Buffer.from(arrBuf);
            await fs.promises.writeFile(tempFilePath, buffer);
            return {
              filePath: tempFilePath,
              get buffer() {
                return fs.readFileSync(tempFilePath);
              },
              filename: `instagram_${shortcode}.jpg`,
              ext: 'jpg',
            };
          }
        }
      }
    } catch {
      // Fallback to yt-dlp
    }
  }

  // 2. yt-dlp Handler for YouTube, Instagram, TikTok fallback
  if (!(await isSafeExternalUrl(url))) {
    throw new Error('URL tidak valid atau mengarah ke alamat internal yang dilarang');
  }
  try {
    const ytDlpArgs = [
      '--no-exec',
      '--no-playlist',
      '--no-part',
      '--js-runtimes',
      'node',
      '--max-filesize',
      '200m',
    ];

    const isSub = formatId.includes('sub');
    if (isSub) {
      ytDlpArgs.push(
        '--write-subs',
        '--write-auto-subs',
        '--sub-lang',
        'id,en,ind,auto',
        '--skip-download',
        '--convert-subs',
        'srt'
      );
    } else if (isAudio) {
      const bitrateMatch = formatId.match(/(320|192|128)kbps/);
      const quality = bitrateMatch ? `${bitrateMatch[1]}k` : '320k';
      ytDlpArgs.push('-x', '--audio-format', 'mp3', '--audio-quality', quality);
    } else {
      const heightMatch = formatId.match(/(\d{3,4})p/);
      if (heightMatch) {
        const height = heightMatch[1];
        ytDlpArgs.push('-f', `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/best`);
      } else if (formatId && formatId !== 'best' && formatId !== 'mp4') {
        ytDlpArgs.push('-f', `${formatId}/bestvideo+bestaudio/best`);
      } else {
        ytDlpArgs.push('-f', 'bestvideo[height<=720]+bestaudio/best');
      }

      ytDlpArgs.push('--merge-output-format', 'mp4', '--remux-video', 'mp4');
    }

    ytDlpArgs.push('-o', `${tempFilePath}_%(title)s.%(ext)s`, url);

    if (jobId) {
      progressTracker.updateProgress(jobId, 10, 'downloading', 'Mengunduh stream video...');
    }

    await new Promise<void>((resolve, reject) => {
      let isSettled = false;
      const child = spawn('yt-dlp', ytDlpArgs, { cwd: jobDir });

      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          child.kill('SIGTERM');
          setTimeout(() => {
            try { child.kill('SIGKILL'); } catch {}
          }, 2000);
          reject(new Error('Proses unduhan melebihi batas waktu (timeout 120s)'));
        }
      }, 120000); // 120 second timeout

      child.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        if (jobId) {
          const match = text.match(/\[download\]\s+(\d+\.\d+)%/);
          if (match) {
            const p = parseFloat(match[1]);
            progressTracker.updateProgress(jobId, Math.round(p * 0.8), 'downloading', `Mengunduh media (${Math.round(p)}%)...`);
          } else if (text.includes('[Merger]') || text.includes('[ffmpeg]')) {
            progressTracker.updateProgress(jobId, 85, 'merging', 'Penggabungan Video & Audio MP4...');
          }
        }
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        if (isSettled) return;
        isSettled = true;
        if (code === 0) resolve();
        else reject(new Error(`Proses yt-dlp selesai dengan kode ${code}`));
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        if (isSettled) return;
        isSettled = true;
        reject(err);
      });
    });

    if (jobId) {
      progressTracker.updateProgress(jobId, 95, 'merging', 'Menyiapkan file unduhan...');
    }

    // Look for exact file or any file created with prefix in jobDir
    let actualFilePath = tempFilePath;
    let originalTitle = `media_${formatId}`;
    
    if (!fs.existsSync(/*turbopackIgnore: true*/ actualFilePath)) {
      const files = fs.readdirSync(jobDir);
      const matched = files.find((f) => f.startsWith(filePrefix));
      if (matched) {
        actualFilePath = path.join(jobDir, matched);
        // Extract title from filename (remove prefix)
        const namePart = matched.substring(filePrefix.length + 1); // +1 for the dot/underscore
        if (namePart) {
           originalTitle = namePart.substring(namePart.indexOf('_') + 1).replace(/\.[^/.]+$/, "");
        }
      }
    }

    if (fs.existsSync(/*turbopackIgnore: true*/ actualFilePath)) {
      const stat = fs.statSync(/*turbopackIgnore: true*/ actualFilePath);

      if (stat.size > 1000) {
        let finalPath = actualFilePath;
        let actualExt = path.extname(actualFilePath).replace('.', '') || ext;

        // 1. Handle FFmpeg Video/Audio Trimming if formatId contains trim option
        const trimInfo = parseTrimOption(formatId);
        if (trimInfo) {
          const trimmedPath = path.join(jobDir, `${filePrefix}_trimmed.${actualExt}`);
          try {
            const bin = ffmpegPath || 'ffmpeg';
            await execFilePromise(bin, [
              '-ss', trimInfo.startTime,
              '-to', trimInfo.endTime,
              '-i', finalPath,
              '-c', 'copy',
              '-y',
              trimmedPath,
            ]).catch(async () => {
              await execFilePromise(bin, [
                '-ss', trimInfo.startTime,
                '-to', trimInfo.endTime,
                '-i', finalPath,
                '-y',
                trimmedPath,
              ]);
            });

            if (fs.existsSync(trimmedPath) && fs.statSync(trimmedPath).size > 500) {
              finalPath = trimmedPath;
            }
          } catch {
            // Fallback to untrimmed file
          }
        }

        // 2. Handle Audio Bitrate Transcoding
        if (isAudio) {
          const bitrateMatch = formatId.match(/(320|192|128)kbps/);
          if (bitrateMatch) {
            const targetBitrate = bitrateMatch[1];
            const transcodedPath = path.join(jobDir, `${filePrefix}_${targetBitrate}k.mp3`);
            try {
              const bin = ffmpegPath || 'ffmpeg';
              await execFilePromise(bin, [
                '-i', finalPath,
                '-b:a', `${targetBitrate}k`,
                '-y',
                transcodedPath,
              ]);
              if (fs.existsSync(transcodedPath) && fs.statSync(transcodedPath).size > 500) {
                finalPath = transcodedPath;
                actualExt = 'mp3';
              }
            } catch {
              // Fallback to original audio
            }
          }
        }

        // Clean title
        const cleanTitle = originalTitle.replace(/[^a-zA-Z0-9_\-\s]/g, '_').substring(0, 50);
        return {
          filePath: finalPath,
          get buffer() {
            return fs.readFileSync(/*turbopackIgnore: true*/ finalPath);
          },
          filename: `${cleanTitle}.${actualExt}`,
          ext: actualExt,
        };
      }
    }
  } catch (err: unknown) {
    // Cleanup lingering temp job directory
    try {
      if (fs.existsSync(jobDir)) {
        fs.rmSync(jobDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup error
    }
    const msg = err instanceof Error ? err.message : 'yt-dlp failed';
    throw new Error(`Gagal mengunduh media dari URL target: ${msg}`);
  }

  throw new Error('Media tidak dapat diunduh atau format tidak tersedia');
}
