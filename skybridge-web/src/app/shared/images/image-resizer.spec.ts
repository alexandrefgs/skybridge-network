import { TestBed } from '@angular/core/testing';
import { ImageResizer } from './image-resizer';

describe('ImageResizer', () => {
  const drawImage = vi.fn();
  const close = vi.fn();
  let canvas: HTMLCanvasElement | undefined;

  beforeEach(() => {
    drawImage.mockReset();
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 800, height: 600, close })));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
      canvas = this;
      return { drawImage, imageSmoothingQuality: 'low' } as unknown as CanvasRenderingContext2D;
    } as never);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback, type) => callback(new Blob(['x'], { type })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('crops the center square and scales it down', async () => {
    const blob = await TestBed.inject(ImageResizer).squareCrop(new Blob(['photo']), 256);

    expect(canvas?.width).toBe(256);
    expect(canvas?.height).toBe(256);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 100, 0, 600, 600, 0, 0, 256, 256);
    expect(close).toHaveBeenCalled();
    expect(blob.type).toBe('image/webp');
  });

  it('fails when the browser cannot encode the picture', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => callback(null));

    await expect(TestBed.inject(ImageResizer).squareCrop(new Blob(['photo']))).rejects.toThrow('Could not read the picture.');
  });
});