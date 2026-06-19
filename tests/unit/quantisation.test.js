import { describe, it, expect } from 'vitest';
import { quantise, dequantise } from '../../src/physics/quantisation.js';

const TWO_PI = 2 * Math.PI;
const EPS = 1e-9;

describe('quantisation', () => {
  it('8-bit default: all values in [0,255], Psi=0→0, Psi≈2π→255', () => {
    const Psi = new Float32Array([0, TWO_PI - EPS]);
    const grey = quantise(Psi, 255);
    expect(grey[0]).toBe(0);
    expect(grey[1]).toBe(255);
    for (const v of grey) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(255);
    }
  });

  it('10-bit default: Psi=π maps to 512 (±1)', () => {
    const Psi = new Float32Array([Math.PI]);
    const grey = quantise(Psi, 1023);
    expect(grey[0]).toBeGreaterThanOrEqual(511);
    expect(grey[0]).toBeLessThanOrEqual(513);
  });

  it('gamma cap 8-bit: γ=200, Psi≈2π maps to 200, all ≤200', () => {
    const Psi = new Float32Array([0, Math.PI, TWO_PI - EPS]);
    const grey = quantise(Psi, 200);
    expect(grey[2]).toBe(200);
    for (const v of grey) {
      expect(v).toBeLessThanOrEqual(200);
    }
  });

  it('gamma cap 10-bit: γ=800, Psi=π maps to 400 (±1)', () => {
    const Psi = new Float32Array([Math.PI]);
    const grey = quantise(Psi, 800);
    expect(grey[0]).toBeGreaterThanOrEqual(399);
    expect(grey[0]).toBeLessThanOrEqual(401);
  });

  it('gamma boundary: γ=1, Psi=0→0, Psi≈2π→1', () => {
    const Psi = new Float32Array([0, TWO_PI - EPS]);
    const grey = quantise(Psi, 1);
    expect(grey[0]).toBe(0);
    expect(grey[1]).toBe(1);
  });

  it('round-trip: max error < 2π/γ', () => {
    const gamma = 255;
    const N = 100;
    const Psi = new Float32Array(N);
    for (let i = 0; i < N; i++) Psi[i] = (i / N) * TWO_PI * 0.999;
    const grey = quantise(Psi, gamma);
    const recovered = dequantise(grey, gamma);
    const stepSize = TWO_PI / gamma;
    for (let i = 0; i < N; i++) {
      expect(Math.abs(recovered[i] - Psi[i])).toBeLessThan(stepSize);
    }
  });
});
