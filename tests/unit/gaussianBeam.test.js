import { describe, it, expect } from 'vitest';
import { gaussianBeam } from '../../src/physics/modes/gaussianBeam.js';

describe('gaussianBeam', () => {
  it('peak amplitude is at (x0, y0)', () => {
    const resX = 64, resY = 64;
    const field = gaussianBeam({ resX, resY, w0: 10, x0: 0, y0: 0 });
    // Centre pixel
    const cx = Math.round(resX / 2);
    const cy = Math.round(resY / 2);
    const centreAmp = field[2 * (cy * resX + cx)];

    // Check centre is the max
    let maxAmp = 0;
    for (let i = 0; i < resX * resY; i++) {
      const a = Math.sqrt(field[2 * i] ** 2 + field[2 * i + 1] ** 2);
      if (a > maxAmp) maxAmp = a;
    }
    expect(Math.abs(centreAmp - maxAmp)).toBeLessThan(1e-4);
  });

  it('amplitude at r=w0 is ≤ 1/e of peak (±1%)', () => {
    const resX = 256, resY = 256;
    const w0 = 50;
    const field = gaussianBeam({ resX, resY, w0 });
    const cx = resX / 2, cy = resY / 2;

    // Peak amplitude
    const peakAmp = field[2 * (Math.floor(cy) * resX + Math.floor(cx))];

    // Sample at r = w0 along x-axis
    const xi = Math.round(cx + w0);
    const yi = Math.round(cy);
    const amp = Math.sqrt(field[2 * (yi * resX + xi)] ** 2 + field[2 * (yi * resX + xi) + 1] ** 2);

    const expected = peakAmp * Math.exp(-1); // 1/e
    expect(Math.abs(amp - expected) / expected).toBeLessThan(0.01);
  });
});
