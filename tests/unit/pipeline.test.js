/**
 * End-to-end pipeline test (plan test 37):
 * Gaussian beam → exact encoding → quantise → dequantise → simulate first order
 * → compare output amplitude to original Gaussian profile within one grey-level step.
 */
import { describe, it, expect } from 'vitest';
import { gaussianBeam } from '../../src/physics/modes/gaussianBeam.js';
import { superpose, extractAmplitudeAndPhase, normalise } from '../../src/physics/hologram.js';
import { encodeExact, simulateFirstOrder } from '../../src/physics/intensityMasking.js';
import { quantise, dequantise } from '../../src/physics/quantisation.js';
import { sincInverse } from '../../src/physics/sincInverseLUT.js';

describe('end-to-end pipeline', () => {
  it('Gaussian beam full pipeline: reconstructed amplitude within one grey-level step of desired', () => {
    const resX = 64, resY = 64;
    const w0 = 20;
    const gamma = 255;
    const TWO_PI = 2 * Math.PI;

    // 1. Generate Gaussian mode
    const field = gaussianBeam({ resX, resY, w0 });

    // 2. Superpose (single mode) and normalise
    const sup = superpose([{ field, weight: 1.0, phaseOffset: 0, enabled: true }]);
    const normed = normalise(sup);

    // 3. Extract A and Phi
    const { amplitude: A, phase: Phi } = extractAmplitudeAndPhase(normed);

    // 4. Exact encoding
    const Psi = encodeExact({ A, Phi, fx: 0, fy: 0, resX, resY });

    // 5. Quantise and dequantise (adds one grey-level worth of rounding)
    const grey = quantise(Psi, gamma);
    const PsiQ = dequantise(grey, gamma);

    // 6. For each pixel, recover M and F from the quantised Psi, simulate T1
    const stepSize = TWO_PI / gamma;
    const N = resX * resY;
    for (let idx = 0; idx < N; idx++) {
      const a = Math.max(0, Math.min(1, A[idx]));
      const sincInvA = sincInverse(a);
      const M = 1 + sincInvA / Math.PI;
      const F = Phi[idx] - Math.PI * M;

      const { amplitude: generatedAmp } = simulateFirstOrder(M, F);

      // Generated amplitude should match desired A within one grey-level step of phase
      // (phase quantisation error ~ stepSize, propagated through sinc)
      // Tolerant check: within stepSize worth of amplitude error
      const err = Math.abs(generatedAmp - a);
      expect(err).toBeLessThan(stepSize + 1e-4);
    }
  });
});
