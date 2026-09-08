import fs from 'fs';
import path from 'path';
import os from 'os';
import { YT_DLP_BIN_PATH, YT_DLP_ASSET_NAME } from '@choewy/yt-dlp';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

let cachedPath: string | null = null;

function ensureExecutable(filePath: string) {
  if (os.platform() !== 'win32') {
    try {
      fs.chmodSync(filePath, 0o755);
    } catch {
      // Ignore if chmod fails (e.g. read-only filesystem)
    }
  }
}

async function downloadYtDlpTo(targetPath: string): Promise<boolean> {
  try {
    const assetName = YT_DLP_ASSET_NAME || (os.platform() === 'win32' ? 'yt-dlp.exe' : os.platform() === 'darwin' ? 'yt-dlp_macos' : 'yt-dlp_linux');
    const url = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${assetName}`;
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok || !res.body) return false;

    const fileStream = fs.createWriteStream(targetPath);
    const nodeStream = Readable.fromWeb(res.body as any);
    await pipeline(nodeStream, fileStream);
    ensureExecutable(targetPath);
    return fs.existsSync(targetPath);
  } catch {
    return false;
  }
}

export async function getYtDlpExecutablePath(): Promise<string> {
  if (cachedPath && fs.existsSync(/*turbopackIgnore: true*/ cachedPath)) {
    ensureExecutable(cachedPath);
    return cachedPath;
  }

  // 1. Check bundled @choewy/yt-dlp binary path
  if (YT_DLP_BIN_PATH && fs.existsSync(/*turbopackIgnore: true*/ YT_DLP_BIN_PATH)) {
    ensureExecutable(YT_DLP_BIN_PATH);
    cachedPath = YT_DLP_BIN_PATH;
    return YT_DLP_BIN_PATH;
  }

  // 2. Check node_modules relative path directly
  const isWin = os.platform() === 'win32';
  const binName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
  const nodeModulesBin = path.resolve(process.cwd(), 'node_modules', '@choewy', 'yt-dlp', 'dist', 'bin', binName);
  if (fs.existsSync(/*turbopackIgnore: true*/ nodeModulesBin)) {
    ensureExecutable(nodeModulesBin);
    cachedPath = nodeModulesBin;
    return nodeModulesBin;
  }

  // 3. Check temp directory fallback
  const tmpBin = path.join(os.tmpdir(), binName);
  if (fs.existsSync(/*turbopackIgnore: true*/ tmpBin)) {
    ensureExecutable(tmpBin);
    cachedPath = tmpBin;
    return tmpBin;
  }

  // 4. Check common Linux/macOS system locations
  const commonLocations = isWin
    ? ['C:\\yt-dlp\\yt-dlp.exe', 'C:\\Program Files\\yt-dlp\\yt-dlp.exe']
    : ['/usr/local/bin/yt-dlp', '/usr/bin/yt-dlp', '/opt/homebrew/bin/yt-dlp'];

  for (const loc of commonLocations) {
    if (fs.existsSync(/*turbopackIgnore: true*/ loc)) {
      ensureExecutable(loc);
      cachedPath = loc;
      return loc;
    }
  }

  // 5. Try downloading directly to os.tmpdir() if missing in serverless runtime
  const downloaded = await downloadYtDlpTo(tmpBin);
  if (downloaded) {
    cachedPath = tmpBin;
    return tmpBin;
  }

  // 6. Default fallback to system PATH string 'yt-dlp'
  cachedPath = binName;
  return binName;
}
