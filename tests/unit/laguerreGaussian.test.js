import { describe, it, expect } from 'vitest';
import { laguerreGaussian } from '../../src/physics/modes/laguerreGaussian.js';

function getAmp(field, i, j, resX) {
  const idx = 2 * (j * resX + i);
  return Math.sqrt(field[idx] ** 2 + field[idx + 1] ** 2);
}

function getPhase(field, i, j, resX) {
  const idx = 2 * (j * resX + i);
  return Math.atan2(field[idx + 1], field[idx]);
}

describe('laguerreGaussian', () => {
  it('l=1,p=0: amplitude at r=0 is 0 (vortex null)', () => {
    const resX = 128, resY = 128;
    const field = laguerreGaussian({ resX, resY, w0: 30, l: 1, p: 0 });
    const cx = Math.floor(resX / 2), cy = Math.floor(resY / 2);
    const amp = getAmp(field, cx, cy, resX);
    expect(amp).toBeLessThan(1e-6);
  });

  it('l=1,p=0: phase wraps 2π around a circle at r=w0/2', () => {
    const resX = 256, resY = 256;
    const w0 = 60;
    const field = laguerreGaussian({ resX, resY, w0, l: 1, p: 0 });
    const cx = resX / 2, cy = resY / 2;
    const r = w0 / 2;
    const N = 360;
    let phaseSum = 0;
    let prevPhase = null;
    for (let k = 0; k < N; k++) {
      const angle = (2 * Math.PI * k) / N;
      const xi = Math.round(cx + r * Math.cos(angle));
      const yi = Math.round(cy + r * Math.sin(angle));
      const ph = getPhase(field, xi, yi, resX);
      if (prevPhase !== null) {
        let diff = ph - prevPhase;
        // Wrap diff to [-pi, pi]
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        phaseSum += diff;
      }
      prevPhase = ph;
    }
    // phaseSum should be ≈ 2π
    expect(Math.abs(phaseSum - 2 * Math.PI)).toBeLessThan(0.05);
  });

  it('l=2,p=0: phase accumulates 4π around a circle', () => {
    const resX = 256, resY = 256;
    const w0 = 60;
    const field = laguerreGaussian({ resX, resY, w0, l: 2, p: 0 });
    const cx = resX / 2, cy = resY / 2;
    const r = w0 / 2;
    const N = 720;
    let phaseSum = 0;
    let prevPhase = null;
    for (let k = 0; k < N; k++) {
      const angle = (2 * Math.PI * k) / N;
      const xi = Math.round(cx + r * Math.cos(angle));
      const yi = Math.round(cy + r * Math.sin(angle));
      const ph = getPhase(field, xi, yi, resX);
      if (prevPhase !== null) {
        let diff = ph - prevPhase;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        phaseSum += diff;
      }
      prevPhase = ph;
    }
    expect(Math.abs(phaseSum - 4 * Math.PI)).toBeLessThan(0.05);
  });

  it('l=0,p=1: radial node ring exists (amplitude crosses zero at one radial distance)', () => {
    const resX = 256, resY = 256;
    const w0 = 50;
    const field = laguerreGaussian({ resX, resY, w0, l: 0, p: 1 });
    const cx = Math.floor(resX / 2), cy = Math.floor(resY / 2);

    // Scan radially from cx outward and find a sign change in the real part
    let foundZero = false;
    let prev = field[2 * (cy * resX + cx)];
    for (let dr = 1; dr < resX / 2 - 1; dr++) {
      const xi = cx + dr;
      const val = field[2 * (cy * resX + xi)];
      if (prev * val < 0) { foundZero = true; break; }
      prev = val;
    }
    expect(foundZero).toBe(true);
  });
});
