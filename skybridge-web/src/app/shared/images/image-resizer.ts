import { DOCUMENT, Injectable, inject } from '@angular/core';

export const AVATAR_SIZE = 256;

@Injectable({ providedIn: 'root' })
export class ImageResizer {
  private readonly document = inject(DOCUMENT);

  async squareCrop(file: Blob, size = AVATAR_SIZE): Promise<Blob> {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = this.document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not read the picture.');

    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
    bitmap.close();

    return new Promise((resolve, reject) =>
      canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Could not read the picture.'))), 'image/webp', 0.9)
    );
  }
}