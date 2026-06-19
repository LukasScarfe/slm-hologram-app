import { describe, it, expect } from 'vitest';
import { zernikeModes } from '../../src/physics/modes/zernikeModes.js';

describe('zernikeModes', () => {
  it('Z(0,0) piston: phase is uniform across pupil (std dev < 1e-6)', () => {
    const resX = 64, resY = 64;
    const R = 28;
    const field = zernikeModes({ resX, resY, n: 0, m: 0, pupilRadiusPx: R, coefficient: 1 });
    const cx = Math.floor(resX / 2), cy = Math.floor(resY / 2);
    const phases = [];
    for (let j = 0; j < resY; j++) {
      for (let i = 0; i < resX; i++) {
        const dx = i - cx, dy = j - cy;
        if (Math.sqrt(dx * dx + dy * dy) <= R) {
          const idx = 2 * (j * resX + i);
          phases.push(Math.atan2(field[idx + 1], field[idx]));
        }
      }
    }
    const mean = phases.reduce((a, b) => a + b, 0) / phases.length;
    const variance = phases.reduce((a, b) => a + (b - mean) ** 2, 0) / phases.length;
    expect(Math.sqrt(variance)).toBeLessThan(1e-6);
  });

  it('Z(1,1) tip: phase increases linearly along x within pupil (R² > 0.9999)', () => {
    const resX = 128, resY = 128;
    const R = 50;
    const field = zernikeModes({ resX, resY, n: 1, m: 1, pupilRadiusPx: R, coefficient: 1 });
    const cx = Math.floor(resX / 2), cy = Math.floor(resY / 2);

    const xs = [], phases = [];
    for (let i = cx - R + 2; i <= cx + R - 2; i++) {
      const dx = i - cx;
      if (Math.abs(dx) <= R) {
        const idx = 2 * (cy * resX + i);
        xs.push(dx);
        phases.push(Math.atan2(field[idx + 1], field[idx]));
      }
    }
    // Linear regression
    const n = xs.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = phases.reduce((a, b) => a + b, 0);
    const sumXX = xs.reduce((a, b) => a + b * b, 0);
    const sumXY = xs.reduce((a, b, i) => a + b * phases[i], 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const yPred = xs.map(x => slope * x + intercept);
    const ssRes = phases.reduce((a, b, i) => a + (b - yPred[i]) ** 2, 0);
    const ssTot = phases.reduce((a, b) => a + (b - sumY / n) ** 2, 0);
    const R2 = 1 - ssRes / ssTot;
    expect(R2).toBeGreaterThan(0.9999);
  });

  it('Z(2,0) defocus: value at r=R_pupil matches analytic 2r²-1 form to within 1%', () => {
    const resX = 128, resY = 128;
    const R = 50;
    const coeff = 1;
    const field = zernikeModes({ resX, resY, n: 2, m: 0, pupilRadiusPx: R, coefficient: coeff });
    const cx = Math.floor(resX / 2), cy = Math.floor(resY / 2);

    // At rho=1 (r=R), Zernike defocus = sqrt(3)*(2*1^2-1) = sqrt(3)
    // The normalisation: norm = sqrt(n+1) * (m==0 ? 1 : sqrt(2)) = sqrt(3)
    // Z_2^0 at rho=1: norm * R_2^0(1) = sqrt(3) * (2*1-1) = sqrt(3)
    const norm = Math.sqrt(3);
    const expectedPhase = coeff * norm;

    const xi = Math.round(cx + R - 1);
    const idx = 2 * (cy * resX + xi);
    const actualPhase = Math.atan2(field[idx + 1], field[idx]);

    // Compare at rho close to 1
    const rho = (xi - cx) / R;
    const Z_analytic = norm * (2 * rho * rho - 1);
    const expectedPhaseActual = coeff * Z_analytic;

    let diff = Math.abs(actualPhase - expectedPhaseActual);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    expect(diff / Math.abs(expectedPhaseActual + 1e-10)).toBeLessThan(0.01);
  });
});
