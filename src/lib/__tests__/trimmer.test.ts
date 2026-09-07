import { describe, it, expect } from 'vitest';
import { parseTrimOption } from '../mediaDownloader';

describe('parseTrimOption', () => {
  it('parses start and end time parameters from formatId', () => {
    const res1 = parseTrimOption('1080p_trim_00:10_00:40');
    expect(res1).toEqual({ startTime: '00:10', endTime: '00:40' });

    const res2 = parseTrimOption('mp3_trim_01:15_02:30');
    expect(res2).toEqual({ startTime: '01:15', endTime: '02:30' });
  });

  it('returns null if formatId does not contain trim info', () => {
    const res = parseTrimOption('1080p');
    expect(res).toBeNull();
  });
});
