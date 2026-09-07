import JSZip from 'jszip';
import { MediaFormat } from '@/types/media';

export interface ImageFile {
  filename: string;
  buffer: Buffer;
}

export function createCarouselFormats(mediaId: string, imageUrls: string[]): MediaFormat[] {
  const formats: MediaFormat[] = [
    {
      id: `${mediaId}-zip-bundle`,
      quality: 'Unduh Semua Foto (ZIP Paket)',
      ext: 'zip',
      formatId: 'carousel-zip',
      requiresMerge: false,
      type: 'gallery',
      images: imageUrls,
    },
  ];

  imageUrls.forEach((url, idx) => {
    formats.push({
      id: `${mediaId}-img-${idx + 1}`,
      quality: `Foto Slide ${idx + 1} (JPG)`,
      ext: 'jpg',
      url,
      formatId: `slide-${idx + 1}`,
      requiresMerge: false,
      type: 'image',
    });
  });

  return formats;
}

export async function buildCarouselZip(images: ImageFile[]): Promise<Buffer> {
  const zip = new JSZip();

  images.forEach((img) => {
    zip.file(img.filename, img.buffer);
  });

  const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
  return zipContent;
}
