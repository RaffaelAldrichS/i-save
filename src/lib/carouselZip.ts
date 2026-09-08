import JSZip from 'jszip';
import { MediaItem } from '@/types/media';

export interface ImageFile {
  filename: string;
  buffer: Buffer;
}

export function createCarouselFormats(mediaId: string, imageUrls: string[]): MediaItem[] {
  const formats: MediaItem[] = [
    {
      id: `${mediaId}-zip-bundle`,
      type: 'gallery',
      mimeType: 'application/zip',
      quality: 'Unduh Semua Foto (ZIP Paket)',
      ext: 'zip',
      formatId: 'carousel-zip',
      requiresMerge: false,
      images: imageUrls,
    },
  ];

  imageUrls.forEach((url, idx) => {
    formats.push({
      id: `${mediaId}-img-${idx + 1}`,
      type: 'image',
      mimeType: 'image/jpeg',
      quality: `Foto Slide ${idx + 1} (JPG)`,
      ext: 'jpg',
      url,
      formatId: `slide-${idx + 1}`,
      requiresMerge: false,
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
