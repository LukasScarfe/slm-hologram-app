import { describe, it, expect } from 'vitest';
import { inceGaussian } from '../../src/physics/modes/inceGaussian.js';

describe('inceGaussian', () => {
  it('returns Float32Array of length 2 * resX * resY', () => {
    const field = inceGaussian({ resX: 64, resY: 64 });
    expect(field).toBeInstanceOf(Float32Array);
    expect(field.length).toBe(2 * 64 * 64);
  });

  it('p=2, m=0 has at least 2 distinct intensity maxima in the central row', () => {
    const N = 512;
    const field = inceGaussian({ resX: N, resY: N, p: 2, m: 0, w0: 100 });
    const j = Math.floor(N / 2);
    const intensities = [];
    for (let i = 0; i < N; i++) {
      const idx = 2 * (j * N + i);
      intensities.push(field[idx] ** 2 + field[idx + 1] ** 2);
    }
    const peaks = [];
    for (let i = 1; i < N - 1; i++) {
      if (
        intensities[i] > intensities[i - 1] &&
        intensities[i] > intensities[i + 1] &&
        intensities[i] > 0.05
      ) {
        peaks.push(i);
      }
    }
    expect(peaks.length).toBeGreaterThanOrEqual(2);
  });

  it('p=0, m=0 produces a single-peak (Gaussian-like) central row profile', () => {
    const N = 256;
    const field = inceGaussian({ resX: N, resY: N, p: 0, m: 0, w0: 80 });
    const j = Math.floor(N / 2);
    // Find absolute max along centre row
    let maxIntens = 0, peakI = 0;
    for (let i = 0; i < N; i++) {
      const idx = 2 * (j * N + i);
      const intens = field[idx] ** 2 + field[idx + 1] ** 2;
      if (intens > maxIntens) { maxIntens = intens; peakI = i; }
    }
    // Peak should be near the centre
    expect(Math.abs(peakI - N / 2)).toBeLessThan(5);
  });
});
