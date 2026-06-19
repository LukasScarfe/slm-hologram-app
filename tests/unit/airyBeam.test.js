import { describe, it, expect } from 'vitest';
import { airyBeam } from '../../src/physics/modes/airyBeam.js';

describe('airyBeam', () => {
  it('returns Float32Array of length 2 * resX * resY', () => {
    const field = airyBeam({ resX: 64, resY: 64, scale: 20 });
    expect(field).toBeInstanceOf(Float32Array);
    expect(field.length).toBe(2 * 64 * 64);
  });

  it('main lobe position matches ξ_peak ≈ -1.019 × scale for two different scales', () => {
    const N = 256;
    const AIRY_PEAK_XI = 1.019; // |offset from centre in units of scale|

    for (const scale of [20, 40]) {
      const field = airyBeam({ resX: N, resY: N, scale });
      const j = Math.floor(N / 2);
      let maxIntens = 0;
      let peakI = 0;
      for (let i = 0; i < N; i++) {
        const idx = 2 * (j * N + i);
        const intens = field[idx] ** 2 + field[idx + 1] ** 2;
        if (intens > maxIntens) { maxIntens = intens; peakI = i; }
      }
      const cx = N / 2;
      const expected = cx - AIRY_PEAK_XI * scale;
      expect(Math.abs(peakI - expected)).toBeLessThan(4);
    }
  });

  it('output is non-zero (max amplitude > 0)', () => {
    const field = airyBeam({ resX: 128, resY: 128, scale: 30 });
    const maxAbs = Math.max(...Array.from({ length: field.length / 2 }, (_, i) =>
      Math.sqrt(field[2 * i] ** 2 + field[2 * i + 1] ** 2)
    ));
    expect(maxAbs).toBeGreaterThan(0);
  });
});
