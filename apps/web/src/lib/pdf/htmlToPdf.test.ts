import { describe, expect, it } from 'vitest';
import { computePdfPageOffsets } from './htmlToPdf';

describe('computePdfPageOffsets', () => {
  it('returns a single offset (0) when the image fits within one page', () => {
    expect(computePdfPageOffsets(300, 800)).toEqual([0]);
  });

  it('returns a single offset (0) when the image exactly fills one page', () => {
    expect(computePdfPageOffsets(800, 800)).toEqual([0]);
  });

  it('slices a taller image across multiple pages, shifting up by pageHeight each time', () => {
    // A 250pt-tall image on 100pt pages needs 3 pages: [0, -100, -200].
    expect(computePdfPageOffsets(250, 100)).toEqual([0, -100, -200]);
  });

  it('handles an image height that is an exact multiple of the page height', () => {
    // 200pt image on 100pt pages needs exactly 2 pages: [0, -100].
    expect(computePdfPageOffsets(200, 100)).toEqual([0, -100]);
  });

  it('produces one offset per page, and the number of pages matches ceil(imgHeight / pageHeight)', () => {
    const imgHeight = 733;
    const pageHeight = 150;
    const offsets = computePdfPageOffsets(imgHeight, pageHeight);
    expect(offsets).toHaveLength(Math.ceil(imgHeight / pageHeight));
  });

  it('always starts the first page at offset 0', () => {
    expect(computePdfPageOffsets(50, 800)[0]).toBe(0);
    expect(computePdfPageOffsets(5000, 800)[0]).toBe(0);
  });
});
