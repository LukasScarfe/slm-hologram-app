import { describe, it, expect } from 'vitest';
import { besselBeam, besselJ } from '../../src/physics/modes/besselBeam.js';

describe('besselBeam', () => {
  it('n=0: radial profile matches J0(kr*r) to within 1% at 5 sampled radii', () => {
    const resX = 256, resY = 256;
    const kr = 0.08;
    const field = besselBeam({ resX, resY, kr, n: 0 });
    const cx = Math.floor(resX / 2), cy = Math.floor(resY / 2);

    const radii = [5, 10, 15, 20, 25];
    for (const r of radii) {
      const xi = cx + r;
      const idx = 2 * (cy * resX + xi);
      const actual = Math.sqrt(field[idx] ** 2 + field[idx + 1] ** 2) * Math.sign(field[idx]);
      const expected = besselJ(0, kr * r);
      const err = Math.abs(actual - expected);
      const tol = Math.max(0.01 * Math.abs(expected), 1e-4);
      expect(err).toBeLessThan(tol);
    }
  });

  it('n=1: amplitude at r=0 is 0', () => {
    const resX = 128, resY = 128;
    const field = besselBeam({ resX, resY, kr: 0.1, n: 1 });
    const cx = Math.floor(resX / 2), cy = Math.floor(resY / 2);
    const amp = Math.sqrt(field[2 * (cy * resX + cx)] ** 2 + field[2 * (cy * resX + cx) + 1] ** 2);
    expect(amp).toBeLessThan(1e-6);
  });

  it('n=1: phase winds by 2π azimuthally', () => {
    const resX = 256, resY = 256;
    const kr = 0.05;
    const field = besselBeam({ resX, resY, kr, n: 1 });
    const cx = resX / 2, cy = resY / 2;
    const r = 30;
    const N = 360;
    let phaseSum = 0;
    let prevPhase = null;
    for (let k = 0; k < N; k++) {
      const angle = (2 * Math.PI * k) / N;
      const xi = Math.round(cx + r * Math.cos(angle));
      const yi = Math.round(cy + r * Math.sin(angle));
      const idx = 2 * (yi * resX + xi);
      const ph = Math.atan2(field[idx + 1], field[idx]);
      if (prevPhase !== null) {
        let diff = ph - prevPhase;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        phaseSum += diff;
      }
      prevPhase = ph;
    }
    expect(Math.abs(phaseSum - 2 * Math.PI)).toBeLessThan(0.05);
  });
});
