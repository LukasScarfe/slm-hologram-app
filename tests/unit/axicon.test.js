import { describe, it, expect } from 'vitest';
import { axicon } from '../../src/physics/modes/axicon.js';

describe('axicon', () => {
  it('returns Float32Array of length 2 * resX * resY', () => {
    const field = axicon({ resX: 64, resY: 64 });
    expect(field).toBeInstanceOf(Float32Array);
    expect(field.length).toBe(2 * 64 * 64);
  });

  it('centre pixel has Re≈1, Im≈0 (phase = 0 at r = 0)', () => {
    const N = 128;
    const field = axicon({ resX: N, resY: N, halfAngleDeg: 1.0 });
    const cx = Math.floor(N / 2);
    const cy = Math.floor(N / 2);
    const idx = 2 * (cy * N + cx);
    expect(field[idx]).toBeCloseTo(1, 3);
    expect(field[idx + 1]).toBeCloseTo(0, 3);
  });

  it('phase increment per pixel matches 2π·sin(θ)·pixelPitch/λ', () => {
    const N = 256;
    const halfAngleDeg = 1.0;
    // Use 1 µm pixel pitch so Δφ ≈ 0.206 rad/pixel (no wrapping for k ≤ 15)
    const pixelPitchM = 1e-6;
    const wavelengthM = 532e-9;
    const field = axicon({ resX: N, resY: N, halfAngleDeg, pixelPitchM, wavelengthM });
    const cx = Math.floor(N / 2);
    const j = Math.floor(N / 2);
    const expectedDeltaPhi = 2 * Math.PI * pixelPitchM * Math.sin(halfAngleDeg * Math.PI / 180) / wavelengthM;

    function normalise(phi) {
      let p = phi;
      while (p > Math.PI) p -= 2 * Math.PI;
      while (p < -Math.PI) p += 2 * Math.PI;
      return p;
    }

    for (const k of [1, 2, 5, 10]) {
      const idx = 2 * (j * N + cx + k);
      const measured = normalise(Math.atan2(field[idx + 1], field[idx]));
      const expected = normalise(k * expectedDeltaPhi);
      expect(Math.abs(measured - expected)).toBeLessThan(0.02);
    }
  });
});
