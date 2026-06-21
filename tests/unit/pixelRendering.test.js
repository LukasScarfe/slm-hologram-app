import { describe, it, expect } from 'vitest';
import {
  buildPhasePixels,
  buildIntensityPixels,
  buildFieldPixels,
  hsvToRgb,
  cetC6Lookup,
} from '../../src/workers/pixelRendering.js';

const PI = Math.PI;

describe('hsvToRgb', () => {
  it('hue=0 (red) → [1, ~0, ~0]', () => {
    const [r, g, b] = hsvToRgb(0, 1, 1);
    expect(r).toBeCloseTo(1, 5);
    expect(g).toBeCloseTo(0, 5);
    expect(b).toBeCloseTo(0, 5);
  });

  it('hue=1/3 (green) → [~0, 1, ~0]', () => {
    const [r, g, b] = hsvToRgb(1 / 3, 1, 1);
    expect(r).toBeCloseTo(0, 5);
    expect(g).toBeCloseTo(1, 5);
    expect(b).toBeCloseTo(0, 5);
  });

  it('saturation=0 → grey (r=g=b=v)', () => {
    const [r, g, b] = hsvToRgb(0.5, 0, 0.6);
    expect(r).toBeCloseTo(0.6, 5);
    expect(g).toBeCloseTo(0.6, 5);
    expect(b).toBeCloseTo(0.6, 5);
  });

  it('value=0 → black', () => {
    const [r, g, b] = hsvToRgb(0.5, 1, 0);
    expect(r).toBe(0);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });
});

describe('cetC6Lookup', () => {
  it('hue=0 (entry 0) returns the first row RGB', () => {
    const [r, g, b] = cetC6Lookup(0);
    // Entry 0 of CET_C6 is ~red-orange (R high, G low, B low)
    expect(r).toBeGreaterThan(200);
    expect(b).toBeLessThan(100);
  });

  it('hue=1 clamps to entry 255 (not 256)', () => {
    const at1 = cetC6Lookup(1);
    const at255 = cetC6Lookup(255 / 255);
    expect(at1).toEqual(at255);
  });

  it('hue=0 and hue=1 are the same entry (cyclic)', () => {
    // CET_C6 is cyclic: first and last entries are the same colour
    const [r0, g0, b0] = cetC6Lookup(0);
    const [r1, g1, b1] = cetC6Lookup(1);
    expect(Math.abs(r1 - r0)).toBeLessThan(10);
    expect(Math.abs(g1 - g0)).toBeLessThan(10);
    expect(Math.abs(b1 - b0)).toBeLessThan(10);
  });

  it('returns integers in [0, 255]', () => {
    for (const hue of [0, 0.1, 0.5, 0.9, 1]) {
      const [r, g, b] = cetC6Lookup(hue);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(255);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
    }
  });
});

describe('buildIntensityPixels', () => {
  it('zero amplitude → all-black pixels', () => {
    const A = new Float32Array([0, 0, 0, 0]);
    const px = buildIntensityPixels(A, 4);
    for (let i = 0; i < 4; i++) {
      expect(px[i * 4]).toBe(0);
      expect(px[i * 4 + 1]).toBe(0);
      expect(px[i * 4 + 2]).toBe(0);
      expect(px[i * 4 + 3]).toBe(255);
    }
  });

  it('full amplitude (1.0) → white pixels', () => {
    const A = new Float32Array([1, 1, 1]);
    const px = buildIntensityPixels(A, 3);
    for (let i = 0; i < 3; i++) {
      expect(px[i * 4]).toBe(255);
      expect(px[i * 4 + 1]).toBe(255);
      expect(px[i * 4 + 2]).toBe(255);
      expect(px[i * 4 + 3]).toBe(255);
    }
  });

  it('mid amplitude (0.5) → ~64 grey (A² = 0.25)', () => {
    const A = new Float32Array([0.5]);
    const px = buildIntensityPixels(A, 1);
    const expected = Math.round(0.25 * 255);
    expect(px[0]).toBe(expected);
    expect(px[1]).toBe(expected);
    expect(px[2]).toBe(expected);
  });

  it('always sets alpha to 255', () => {
    const A = new Float32Array([0, 0.5, 1]);
    const px = buildIntensityPixels(A, 3);
    expect(px[3]).toBe(255);
    expect(px[7]).toBe(255);
    expect(px[11]).toBe(255);
  });
});

describe('buildPhasePixels', () => {
  it('HSV mode produces colored pixels (R ≠ G) for non-red hues', () => {
    // Phase = 0 → hue = 0.5 (cyan in HSV)
    const Phi = new Float32Array([0]);
    const px = buildPhasePixels(Phi, 1, 'hsv');
    // Cyan: R should be 0, G and B should be high
    expect(px[0]).toBe(0);       // R
    expect(px[1]).toBe(255);     // G
    expect(px[2]).toBe(255);     // B
    expect(px[3]).toBe(255);     // A
  });

  it('HSV and CET_C6 produce different output for same phase', () => {
    const Phi = new Float32Array(8).fill(0);
    const hsv = buildPhasePixels(Phi, 8, 'hsv');
    const cet = buildPhasePixels(Phi, 8, 'cet_c6');
    let differ = false;
    for (let i = 0; i < 8; i++) {
      if (hsv[i * 4] !== cet[i * 4] || hsv[i * 4 + 1] !== cet[i * 4 + 1]) {
        differ = true;
        break;
      }
    }
    expect(differ).toBe(true);
  });

  it('phase=+π and phase=−π map to the same hue (cyclic wrap)', () => {
    const Phi = new Float32Array([Math.PI - 0.001, -Math.PI + 0.001]);
    const px = buildPhasePixels(Phi, 2, 'cet_c6');
    // Entries should be very close in color (hue ≈ 1 and hue ≈ 0 both map to entry ~255 and ~0)
    // CET_C6 is cyclic so they should be similar
    expect(Math.abs(px[0] - px[4])).toBeLessThan(30);
    expect(Math.abs(px[1] - px[5])).toBeLessThan(30);
    expect(Math.abs(px[2] - px[6])).toBeLessThan(30);
  });

  it('always sets alpha to 255', () => {
    const Phi = new Float32Array([0, PI / 2, -PI / 2]);
    for (const cm of ['hsv', 'cet_c6']) {
      const px = buildPhasePixels(Phi, 3, cm);
      expect(px[3]).toBe(255);
      expect(px[7]).toBe(255);
      expect(px[11]).toBe(255);
    }
  });
});

describe('buildFieldPixels', () => {
  it('zero amplitude → black regardless of phase', () => {
    const A = new Float32Array([0, 0, 0]);
    const Phi = new Float32Array([0, Math.PI / 2, -Math.PI]);
    for (const cm of ['hsv', 'cet_c6']) {
      const px = buildFieldPixels(A, Phi, 3, cm);
      for (let i = 0; i < 3; i++) {
        expect(px[i * 4]).toBe(0);
        expect(px[i * 4 + 1]).toBe(0);
        expect(px[i * 4 + 2]).toBe(0);
      }
    }
  });

  it('full amplitude modulates by intensity: output < colormap max at A=0.5', () => {
    const A = new Float32Array([0.5]);
    const Phi = new Float32Array([0]); // hue=0.5 (cyan in HSV)
    const px = buildFieldPixels(A, Phi, 1, 'hsv');
    // val = 0.5² = 0.25; cyan G channel should be ~64, not 255
    expect(px[1]).toBeLessThan(100);
  });

  it('HSV and CET_C6 produce different output for same amplitude and phase', () => {
    const A = new Float32Array(8).fill(0.8);
    const Phi = new Float32Array(8).fill(1.0);
    const hsv = buildFieldPixels(A, Phi, 8, 'hsv');
    const cet = buildFieldPixels(A, Phi, 8, 'cet_c6');
    let differ = false;
    for (let i = 0; i < 8; i++) {
      if (hsv[i * 4] !== cet[i * 4] || hsv[i * 4 + 1] !== cet[i * 4 + 1]) {
        differ = true;
        break;
      }
    }
    expect(differ).toBe(true);
  });

  it('always sets alpha to 255', () => {
    const A = new Float32Array([0.5, 1.0]);
    const Phi = new Float32Array([0, PI / 4]);
    const px = buildFieldPixels(A, Phi, 2, 'cet_c6');
    expect(px[3]).toBe(255);
    expect(px[7]).toBe(255);
  });
});
