import { describe, it, expect } from 'vitest';
import { YouTubeExtractor } from '../youtube';

describe('YouTube Subtitle & Transcript formats', () => {
  it('includes SRT and TXT subtitle options in YouTube formats', async () => {
    const extractor = new YouTubeExtractor();
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const metadata = await extractor.extract(url);

    const subSrt = metadata.formats.find((f) => f.id.includes('sub-srt'));
    const subTxt = metadata.formats.find((f) => f.id.includes('sub-txt'));

    expect(subSrt).toBeDefined();
    expect(subSrt?.ext).toBe('srt');
    expect(subTxt).toBeDefined();
    expect(subTxt?.ext).toBe('txt');
  });
});
