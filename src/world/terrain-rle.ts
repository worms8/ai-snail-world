/**
 * Lossless run-length encoding for the byte terrain mask.
 * Used by persistence to compress the 3.84 MB mask into compact base64.
 * See docs/TERRAIN.md §9.
 */

import type { TerrainMaskData } from './terrain';

function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
  }
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(base64, 'base64');
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function encodeTerrainRle(data: TerrainMaskData): string {
  const { pixels, width, height } = data;
  const totalPixels = width * height;
  if (pixels.length !== totalPixels) {
    throw new Error(`Pixel length ${pixels.length} does not match dimensions ${width}x${height}`);
  }
  if (totalPixels === 0) return '';

  const runs: Array<{ length: number; value: number }> = [];
  let currentVal = pixels[0]!;
  let currentLen = 1;

  for (let i = 1; i < totalPixels; i += 1) {
    const val = pixels[i]!;
    if (val === currentVal) {
      currentLen += 1;
    } else {
      runs.push({ length: currentLen, value: currentVal });
      currentVal = val;
      currentLen = 1;
    }
  }
  runs.push({ length: currentLen, value: currentVal });

  const buffer = new Uint8Array(runs.length * 5);
  const view = new DataView(buffer.buffer);
  for (let i = 0; i < runs.length; i += 1) {
    const run = runs[i]!;
    view.setUint32(i * 5, run.length, true);
    buffer[i * 5 + 4] = run.value;
  }

  return uint8ArrayToBase64(buffer);
}

export function decodeTerrainRle(base64: string, width: number, height: number): Uint8Array {
  const totalPixels = width * height;
  const pixels = new Uint8Array(totalPixels);
  if (!base64 || totalPixels === 0) return pixels;

  const buffer = base64ToUint8Array(base64);
  if (buffer.length % 5 !== 0) {
    throw new Error(`Corrupted RLE buffer length: ${buffer.length}`);
  }

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let pixelOffset = 0;
  const runCount = buffer.length / 5;

  for (let i = 0; i < runCount; i += 1) {
    const length = view.getUint32(i * 5, true);
    const value = buffer[i * 5 + 4]!;
    if (pixelOffset + length > totalPixels) {
      throw new Error(`RLE runs exceed expected dimensions ${width}x${height}`);
    }
    pixels.fill(value, pixelOffset, pixelOffset + length);
    pixelOffset += length;
  }

  if (pixelOffset !== totalPixels) {
    throw new Error(`RLE unpacked ${pixelOffset} pixels, expected ${totalPixels}`);
  }

  return pixels;
}
