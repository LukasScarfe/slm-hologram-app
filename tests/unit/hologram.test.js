import { describe, it, expect } from 'vitest';
import { superpose, extractAmplitudeAndPhase, normalise } from '../../src/physics/hologram.js';
import { laguerreGaussian } from '../../src/physics/modes/laguerreGaussian.js';

const resX = 64, resY = 64;

function makeField(l, w0 = 20) {
  return laguerreGaussian({ resX, resY, w0, l });
}

describe('hologram', () => {
  it('superpose(): LG(l=1) + LG(l=-1) produces non-vortex field (phase winding = 0 around origin)', () => {
    const f1 = makeField(1);
    const f2 = makeField(-1);
    const result = superpose([
      { field: f1, weight: 1, phaseOffset: 0, enabled: true },
      { field: f2, weight: 1, phaseOffset: 0, enabled: true },
    ]);
    // Check phase winding number around a small circle: should be ~0, not ±2π
    const cx = resX / 2, cy = resY / 2;
    const r = 8;
    const N = 360;
    let phaseSum = 0;
    let prevPhase = null;
    for (let k = 0; k < N; k++) {
      const angle = (2 * Math.PI * k) / N;
      const xi = Math.round(cx + r * Math.cos(angle));
      const yi = Math.round(cy + r * Math.sin(angle));
      const idx = 2 * (yi * resX + xi);
      const ph = Math.atan2(result[idx + 1], result[idx]);
      if (prevPhase !== null) {
        let diff = ph - prevPhase;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        phaseSum += diff;
      }
      prevPhase = ph;
    }
    // Winding = 0 means |phaseSum| << 2π
    expect(Math.abs(phaseSum)).toBeLessThan(0.2);
  });

  it('extractAmplitudeAndPhase(): recovers A0 and phi to within 1e-5', () => {
    const A0 = 0.7, phi = 1.23;
    const N = 16;
    const field = new Float32Array(2 * N);
    for (let i = 0; i < N; i++) {
      field[2 * i] = A0 * Math.cos(phi);
      field[2 * i + 1] = A0 * Math.sin(phi);
    }
    const { amplitude, phase } = extractAmplitudeAndPhase(field);
    for (let i = 0; i < N; i++) {
      expect(Math.abs(amplitude[i] - A0)).toBeLessThan(1e-5);
      expect(Math.abs(phase[i] - phi)).toBeLessThan(1e-5);
    }
  });

  it('normalise(): max amplitude becomes 1.0, phases preserved', () => {
    const N = 100;
    const field = new Float32Array(2 * N);
    const origPhases = [];
    for (let i = 0; i < N; i++) {
      const amp = 0.4 * (0.1 + Math.random() * 0.9);
      const ph = Math.random() * 2 * Math.PI - Math.PI;
      origPhases.push(ph);
      field[2 * i] = amp * Math.cos(ph);
      field[2 * i + 1] = amp * Math.sin(ph);
    }
    const normed = normalise(field);
    let maxAmp = 0;
    for (let i = 0; i < N; i++) {
      const a = Math.sqrt(normed[2 * i] ** 2 + normed[2 * i + 1] ** 2);
      if (a > maxAmp) maxAmp = a;
    }
    expect(Math.abs(maxAmp - 1.0)).toBeLessThan(1e-5);

    // Phase preservation
    for (let i = 0; i < N; i++) {
      const ph = Math.atan2(normed[2 * i + 1], normed[2 * i]);
      let diff = Math.abs(ph - origPhases[i]);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      expect(diff).toBeLessThan(1e-5);
    }
  });

  it('normalise(): single LG at weight 0.3 vs 1.0 produce identical (A,phi)', () => {
    const f = makeField(1);
    const m1 = superpose([{ field: f, weight: 0.3, phaseOffset: 0, enabled: true }]);
    const m2 = superpose([{ field: f, weight: 1.0, phaseOffset: 0, enabled: true }]);
    const n1 = normalise(m1);
    const n2 = normalise(m2);
    for (let i = 0; i < n1.length; i++) {
      expect(Math.abs(n1[i] - n2[i])).toBeLessThan(1e-5);
    }
  });

  it('normalise(): relative weights alter superposition', () => {
    const f1 = makeField(1);
    const f2 = makeField(-1);
    const A = superpose([
      { field: f1, weight: 1.0, phaseOffset: 0, enabled: true },
      { field: f2, weight: 0.5, phaseOffset: 0, enabled: true },
    ]);
    const B = superpose([
      { field: f1, weight: 1.0, phaseOffset: 0, enabled: true },
      { field: f2, weight: 1.0, phaseOffset: 0, enabled: true },
    ]);
    const nA = normalise(A);
    const nB = normalise(B);

    // Max amplitude should be 1
    const { amplitude: ampA } = extractAmplitudeAndPhase(nA);
    let maxA = 0;
    for (const a of ampA) if (a > maxA) maxA = a;
    expect(Math.abs(maxA - 1.0)).toBeLessThan(1e-5);

    // Phase maps should differ at at least one pixel
    const { phase: phA } = extractAmplitudeAndPhase(nA);
    const { phase: phB } = extractAmplitudeAndPhase(nB);
    let maxDiff = 0;
    for (let i = 0; i < phA.length; i++) {
      let d = Math.abs(phA[i] - phB[i]);
      if (d > Math.PI) d = 2 * Math.PI - d;
      if (d > maxDiff) maxDiff = d;
    }
    expect(maxDiff).toBeGreaterThan(0.01);
  });

  it('weight=0 mode contributes nothing', () => {
    const f1 = makeField(1);
    const f2 = makeField(2);
    const withZero = superpose([
      { field: f1, weight: 1.0, phaseOffset: 0, enabled: true },
      { field: f2, weight: 0.0, phaseOffset: 0, enabled: true },
    ]);
    const withoutZero = superpose([
      { field: f1, weight: 1.0, phaseOffset: 0, enabled: true },
    ]);
    const n1 = normalise(withZero);
    const n2 = normalise(withoutZero);
    for (let i = 0; i < n1.length; i++) {
      expect(Math.abs(n1[i] - n2[i])).toBeLessThan(1e-5);
    }
  });
});
