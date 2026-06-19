/**
 * Intensity + phase encoding per Bolduc et al. 2013, Opt. Lett. 38, 3546.
 *
 * The exact method:
 *   M = 1 + sinc⁻¹(A) / π           [sinc⁻¹ maps [0,1] → [-π,0]]
 *   F = Φ - π·M
 *   Ψ = M · mod(F + 2π(fx·x+fy·y), 2π)
 *
 * The corrected Davis et al. approximate method:
 *   M = A
 *   F = Φ - π·A
 *   Ψ = M · mod(F + 2π(fx·x+fy·y), 2π)
 *
 * First-order output simulation (paper Eq. 3):
 *   T₁ = -sinc(π(M-1)) · exp(i·(F + π·M))
 *      = sinc(π(1-M)) · exp(i·(F + π·M))
 *   |T₁| = sinc(π(1-M))
 *   arg(T₁) = F + π·M = Φ   (for both methods, since F = Φ - πM)
 *
 * For the exact method: sinc(π(1-M)) = sinc(sinc⁻¹(A)) = A  → zero amplitude error.
 * For the approximate method: sinc(π(1-A)) ≠ A in general    → bounded amplitude error.
 */

import { sincInverse } from './sincInverseLUT.js';

const TWO_PI = 2 * Math.PI;

function mod2pi(x) {
  return ((x % TWO_PI) + TWO_PI) % TWO_PI;
}

/**
 * Exact encoding. Inputs:
 *   A   - Float32Array of amplitudes in [0,1], length resX*resY
 *   Phi - Float32Array of phases in radians, length resX*resY
 *   fx, fy - grating frequencies in cycles/pixel
 * Returns Float32Array Psi (hologram phase), same length.
 */
export function encodeExact({ A, Phi, fx = 0, fy = 0, resX, resY }) {
  const N = resX * resY;
  const Psi = new Float32Array(N);

  for (let idx = 0; idx < N; idx++) {
    const a = Math.max(0, Math.min(1, A[idx]));
    // sinc⁻¹(a) ∈ [-π, 0]; M = 1 + sinc⁻¹(a)/π ∈ [0, 1]
    const sincInvA = sincInverse(a);
    const M = 1 + sincInvA / Math.PI;
    const F = Phi[idx] - Math.PI * M;

    const i = idx % resX;
    const j = Math.floor(idx / resX);
    const gratingPhase = TWO_PI * (fx * i + fy * j);

    Psi[idx] = M * mod2pi(F + gratingPhase);
  }
  return Psi;
}

/**
 * Approximate encoding (corrected Davis et al. 1999).
 */
export function encodeApproximate({ A, Phi, fx = 0, fy = 0, resX, resY }) {
  const N = resX * resY;
  const Psi = new Float32Array(N);

  for (let idx = 0; idx < N; idx++) {
    const a = Math.max(0, Math.min(1, A[idx]));
    const M = a;
    const F = Phi[idx] - Math.PI * a;

    const i = idx % resX;
    const j = Math.floor(idx / resX);
    const gratingPhase = TWO_PI * (fx * i + fy * j);

    Psi[idx] = M * mod2pi(F + gratingPhase);
  }
  return Psi;
}

/**
 * Simulate the first-order diffracted field amplitude and phase.
 *
 * From paper Eq (3): T₁ = -sinc(π(M-1)) · exp(i·(F + π·M))
 *                       = sinc(π(1-M)) · exp(i·(F + π·M))
 *
 * |T₁| = sinc(π(1-M))  (≥ 0 for M ∈ [0,1])
 * arg(T₁) = F + π·M = Φ  (for both encoding methods since F = Φ - πM)
 */
export function simulateFirstOrder(M, F) {
  const arg = Math.PI * (1 - M);
  const sincVal = Math.abs(arg) < 1e-12 ? 1.0 : Math.sin(arg) / arg;
  const amplitude = sincVal; // ≥ 0 for M ∈ [0,1] → arg ∈ [0,π]
  const phase = F + Math.PI * M; // = Φ
  return { amplitude, phase };
}
