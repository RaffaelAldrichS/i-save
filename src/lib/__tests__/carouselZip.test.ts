import { describe, it, expect } from 'vitest';
import { createCarouselFormats, buildCarouselZip } from '../carouselZip';

describe('Carousel Slideshow Extractor & ZIP Builder', () => {
  it('creates individual photo formats and a ZIP bundle format', () => {
    const imageUrls = [
      'https://example.com/slide1.jpg',
      'https://example.com/slide2.jpg',
      'https://example.com/slide3.jpg',
    ];

    const formats = createCarouselFormats('tiktok-slide-123', imageUrls);

    expect(formats.length).toBe(4); // 3 individual + 1 ZIP bundle
    expect(formats[0].quality).toBe('Unduh Semua Foto (ZIP Paket)');
    expect(formats[0].ext).toBe('zip');
    expect(formats[0].type).toBe('gallery');
    expect(formats[0].images?.length).toBe(3);

    expect(formats[1].quality).toBe('Foto Slide 1 (JPG)');
    expect(formats[1].ext).toBe('jpg');
    expect(formats[1].type).toBe('image');
  });

  it('builds a ZIP buffer from image buffers', async () => {
    const images = [
      { filename: 'slide_1.jpg', buffer: Buffer.from('fake-image-1') },
      { filename: 'slide_2.jpg', buffer: Buffer.from('fake-image-2') },
    ];

    const zipBuffer = await buildCarouselZip(images);
    expect(zipBuffer).toBeInstanceOf(Buffer);
    expect(zipBuffer.length).toBeGreaterThan(0);
  });
});
