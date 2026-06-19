import { describe, it, expect } from 'vitest';
import { blazedGrating } from '../../src/physics/modes/blazedGrating.js';

describe('blazedGrating', () => {
  it('phase(i,j) = 2π(fx*i + fy*j) mod 2π to within 1e-5 rad', () => {
    const resX = 32, resY = 32;
    const fx = 0.03, fy = 0.05;
    const field = blazedGrating({ resX, resY, fx, fy });

    const testPoints = [[0,0],[3,5],[7,2],[15,15],[10,20],[25,8],[0,31],[31,0]];
    for (const [i, j] of testPoints) {
      const idx = 2 * (j * resX + i);
      const phase = Math.atan2(field[idx + 1], field[idx]);
      let expected = (2 * Math.PI * (fx * i + fy * j)) % (2 * Math.PI);
      // Normalise to [-pi, pi]
      if (expected > Math.PI) expected -= 2 * Math.PI;
      // Compare with wrap tolerance
      let diff = Math.abs(phase - expected);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      expect(diff).toBeLessThan(1e-5);
    }
  });
});
