import { describe, it, expect } from 'vitest';
import { lens } from '../../src/physics/modes/lens.js';

describe('lens', () => {
  it('phase at pixel (x,y) equals -π(dx²+dy²)/(λf) mod 2π to within 1e-5 rad at 10 points', () => {
    const resX = 64, resY = 64;
    const pixelPitchM = 8e-6;
    const focalLengthM = 0.5;
    const wavelengthM = 532e-9;
    const field = lens({ resX, resY, pixelPitchM, focalLengthM, wavelengthM });

    const cx = resX / 2, cy = resY / 2;
    const testPoints = [
      [5, 5], [10, 3], [3, 10], [15, 8], [8, 15],
      [20, 20], [2, 30], [30, 2], [25, 15], [12, 12]
    ];

    for (const [pi, pj] of testPoints) {
      const idx = 2 * (pj * resX + pi);
      const phase = Math.atan2(field[idx + 1], field[idx]);

      const dx = (pi - cx) * pixelPitchM;
      const dy = (pj - cy) * pixelPitchM;
      const r2 = dx * dx + dy * dy;
      let expected = -Math.PI * r2 / (wavelengthM * focalLengthM);
      // Normalise to [-pi, pi]
      expected = expected % (2 * Math.PI);
      if (expected > Math.PI) expected -= 2 * Math.PI;
      if (expected < -Math.PI) expected += 2 * Math.PI;

      // Both phase and expected are in [-pi, pi]; compare with wrap
      let diff = Math.abs(phase - expected);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      expect(diff).toBeLessThan(1e-5);
    }
  });
});
