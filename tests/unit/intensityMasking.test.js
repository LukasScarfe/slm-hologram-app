import { describe, it, expect } from 'vitest';
import { buildSincInverseLUT, sincInverse, sincUnorm } from '../../src/physics/sincInverseLUT.js';
import { encodeExact, encodeApproximate, simulateFirstOrder } from '../../src/physics/intensityMasking.js';

const TWO_PI = 2 * Math.PI;

describe('sincInverseLUT', () => {
  it('round-trip sinc(sincInverse(x)) recovers x to within 1e-4 for 20 samples in [-π,0]', () => {
    buildSincInverseLUT();
    for (let k = 0; k < 20; k++) {
      const x = -Math.PI + (Math.PI * k) / 19; // x in [-pi, 0]
      const y = sincUnorm(x); // y = sinc(x) ∈ [0, 1]
      const xRecovered = sincInverse(y);
      // sinc(xRecovered) should equal y
      const yRecovered = sincUnorm(xRecovered);
      expect(Math.abs(yRecovered - y)).toBeLessThan(1e-4);
    }
  });
});

describe('encodeExact', () => {
  function makeUniform(N, A_val, Phi_val) {
    const A = new Float32Array(N).fill(A_val);
    const Phi = new Float32Array(N).fill(Phi_val);
    return { A, Phi };
  }

  it('A=1 everywhere: M≈1 and F≈Φ-π', () => {
    const N = 10;
    const Phi_val = 0.5;
    const { A, Phi } = makeUniform(N, 1.0, Phi_val);
    const Psi = encodeExact({ A, Phi, fx: 0, fy: 0, resX: N, resY: 1 });

    // For A=1: M=1, F=Phi-pi, Psi = 1 * mod(Phi-pi, 2pi)
    const expectedPsi = ((Phi_val - Math.PI) % TWO_PI + TWO_PI) % TWO_PI;
    for (let i = 0; i < N; i++) {
      expect(Math.abs(Psi[i] - expectedPsi)).toBeLessThan(1e-3);
    }
  });

  it('A=0 everywhere: Psi≈0 (M=0 so M*anything=0)', () => {
    const N = 10;
    const { A, Phi } = makeUniform(N, 0.0, 1.0);
    const Psi = encodeExact({ A, Phi, fx: 0, fy: 0, resX: N, resY: 1 });
    for (let i = 0; i < N; i++) {
      expect(Math.abs(Psi[i])).toBeLessThan(1e-3);
    }
  });

  it('M(A) is monotonically non-decreasing and in [0,1] for 50 samples in [0,1]', () => {
    function computeM(a) {
      const sincInvA = sincInverse(a);
      return 1 + sincInvA / Math.PI;
    }
    let prevM = computeM(0);
    for (let k = 1; k <= 50; k++) {
      const a = k / 50;
      const M = computeM(a);
      expect(M).toBeGreaterThanOrEqual(prevM - 1e-9);
      expect(M).toBeGreaterThanOrEqual(0);
      expect(M).toBeLessThanOrEqual(1 + 1e-9);
      prevM = M;
    }
  });

  it('exact method fidelity: |T1| matches A to within 1e-3 for 20 samples', () => {
    for (let k = 0; k < 20; k++) {
      const A_val = k / 19; // 0..1
      const Phi_val = 1.0;
      const { A, Phi } = makeUniform(1, A_val, Phi_val);
      const Psi = encodeExact({ A, Phi, fx: 0, fy: 0, resX: 1, resY: 1 });

      const sincInvA = sincInverse(A_val);
      const M = 1 + sincInvA / Math.PI;
      const F = Phi_val - Math.PI * M;

      const { amplitude } = simulateFirstOrder(M, F);
      expect(Math.abs(amplitude - A_val)).toBeLessThan(1e-3);
    }
  });

  it('exact method phase fidelity: arg(T1) matches Phi to within 1e-3 for 20 samples', () => {
    for (let k = 0; k < 20; k++) {
      const A_val = k / 19;
      const Phi_val = 1.23;
      const { A, Phi } = makeUniform(1, A_val, Phi_val);

      const sincInvA = sincInverse(A_val);
      const M = 1 + sincInvA / Math.PI;
      const F = Phi_val - Math.PI * M;

      const { phase } = simulateFirstOrder(M, F);
      // phase = F + pi*M = Phi_val - pi*M + pi*M = Phi_val
      expect(Math.abs(phase - Phi_val)).toBeLessThan(1e-3);
    }
  });

  it('approximate method: M = A exactly for 10 samples', () => {
    for (let k = 0; k < 10; k++) {
      const A_val = k / 9;
      const A = new Float32Array([A_val]);
      const Phi = new Float32Array([0.5]);
      // Access M via the formula: M = A for approximate
      // We verify by checking Psi = A * mod(Phi - pi*A, 2pi)
      const Psi = encodeApproximate({ A, Phi, fx: 0, fy: 0, resX: 1, resY: 1 });
      const expectedPsi = A_val * (((0.5 - Math.PI * A_val) % TWO_PI + TWO_PI) % TWO_PI);
      expect(Math.abs(Psi[0] - expectedPsi)).toBeLessThan(1e-5);
    }
  });

  it('approximate method amplitude bound: ||T1|-A| < 0.161 for 50 samples, and at least one > 0.05', () => {
    let maxError = 0;
    let atLeastOneAbove = false;
    for (let k = 0; k < 50; k++) {
      const A_val = k / 49;
      const Phi_val = 0.7;
      const M = A_val; // approximate: M = A
      const F = Phi_val - Math.PI * A_val;
      const { amplitude } = simulateFirstOrder(M, F);
      const err = Math.abs(amplitude - A_val);
      expect(err).toBeLessThan(0.161);
      if (err > maxError) maxError = err;
      if (err > 0.05) atLeastOneAbove = true;
    }
    expect(atLeastOneAbove).toBe(true);
  });

  it('approximate method phase fidelity: arg(T1) = Phi for 50 samples', () => {
    for (let k = 0; k < 50; k++) {
      const A_val = k / 49;
      const Phi_val = 0.87;
      const M = A_val;
      const F = Phi_val - Math.PI * A_val;
      const { phase } = simulateFirstOrder(M, F);
      expect(Math.abs(phase - Phi_val)).toBeLessThan(1e-3);
    }
  });

  it('grating placement: inside-mod formula differs from outside-mod for A<1', () => {
    const resX = 4, resY = 1;
    const A = new Float32Array([0.5, 0.5, 0.5, 0.5]);
    const Phi = new Float32Array([0.3, 0.3, 0.3, 0.3]);
    const fx = 0.1, fy = 0;

    // Inside-mod (correct per plan): Psi = M * mod(F + 2pi*fx*x, 2pi)
    const PsiInside = encodeExact({ A, Phi, fx, fy, resX, resY });

    // Outside-mod (wrong): Psi = M * mod(F, 2pi) + 2pi*fx*x
    const sincInvA = sincInverse(0.5);
    const M = 1 + sincInvA / Math.PI;
    const F = 0.3 - Math.PI * M;
    const PsiOutside = new Float32Array(resX);
    const fmod = ((F % TWO_PI) + TWO_PI) % TWO_PI;
    for (let i = 0; i < resX; i++) {
      PsiOutside[i] = M * fmod + TWO_PI * fx * i;
    }

    // They should diverge at some pixel
    let maxDiff = 0;
    for (let i = 0; i < resX; i++) {
      maxDiff = Math.max(maxDiff, Math.abs(PsiInside[i] - PsiOutside[i]));
    }
    expect(maxDiff).toBeGreaterThan(0.01);

    // Verify PsiInside matches the inside-mod formula
    for (let i = 0; i < resX; i++) {
      const grating = TWO_PI * fx * i;
      const expected = M * (((F + grating) % TWO_PI + TWO_PI) % TWO_PI);
      expect(Math.abs(PsiInside[i] - expected)).toBeLessThan(1e-5);
    }
  });
});
