import { describe, expect, it } from 'vitest';
import { createTerrainMask, decodeTerrainRle, encodeTerrainRle } from '../../src/world/index';

describe('terrain RLE compression', () => {
  it('losslessly roundtrips a generated terrain mask', () => {
    const mask = createTerrainMask('rle-garden', {
      width: 320,
      height: 240,
      surfaceLevel: 120,
      amplitude: 30,
    });
    const encoded = encodeTerrainRle(mask.data);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = decodeTerrainRle(encoded, mask.data.width, mask.data.height);
    expect(decoded.length).toBe(mask.data.pixels.length);
    expect(decoded).toEqual(mask.data.pixels);
  });

  it('losslessly roundtrips after carving tunnels and pits', () => {
    const mask = createTerrainMask('rle-carved', {
      width: 320,
      height: 240,
      surfaceLevel: 120,
      amplitude: 30,
    });
    mask.carveCircle(100, 120, 14);
    mask.carveCircle(150, 180, 20);

    const encoded = encodeTerrainRle(mask.data);
    const decoded = decodeTerrainRle(encoded, mask.data.width, mask.data.height);
    expect(decoded).toEqual(mask.data.pixels);
  });

  it('handles all-air and all-solid masks', () => {
    const width = 100;
    const height = 100;

    const allAir = new Uint8Array(width * height);
    const encodedAir = encodeTerrainRle({ width, height, pixels: allAir });
    const decodedAir = decodeTerrainRle(encodedAir, width, height);
    expect(decodedAir).toEqual(allAir);

    const allSolid = new Uint8Array(width * height).fill(255);
    const encodedSolid = encodeTerrainRle({ width, height, pixels: allSolid });
    const decodedSolid = decodeTerrainRle(encodedSolid, width, height);
    expect(decodedSolid).toEqual(allSolid);
  });

  it('throws on corrupted or mismatched RLE buffer', () => {
    expect(() => decodeTerrainRle('invalid-base64!', 100, 100)).toThrow();
  });
});
