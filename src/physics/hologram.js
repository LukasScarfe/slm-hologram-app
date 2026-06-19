/**
 * Hologram pipeline utilities: superpose, extract, normalise.
 * All operate on interleaved complex Float32Arrays [Re0, Im0, Re1, Im1, ...].
 */

/**
 * Coherent superposition: E_total = Σ wk * exp(i*deltaPhik) * Ek
 * modes: array of { field: Float32Array, weight: number, phaseOffset: number, enabled: boolean }
 * Returns Float32Array (interleaved complex), same length as each field.
 */
export function superpose(modes) {
  if (modes.length === 0) throw new Error('No modes to superpose');
  const len = modes[0].field.length;
  const out = new Float32Array(len);

  for (const { field, weight = 1, phaseOffset = 0, enabled = true } of modes) {
    if (!enabled) continue;
    const wr = weight * Math.cos(phaseOffset);
    const wi = weight * Math.sin(phaseOffset);
    for (let k = 0; k < len; k += 2) {
      const re = field[k];
      const im = field[k + 1];
      out[k] += wr * re - wi * im;
      out[k + 1] += wr * im + wi * re;
    }
  }
  return out;
}

/**
 * Extract amplitude and phase from an interleaved complex field.
 * Returns { amplitude: Float32Array, phase: Float32Array } each length N (N = len/2).
 */
export function extractAmplitudeAndPhase(field) {
  const N = field.length / 2;
  const amplitude = new Float32Array(N);
  const phase = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const re = field[2 * i];
    const im = field[2 * i + 1];
    amplitude[i] = Math.sqrt(re * re + im * im);
    phase[i] = Math.atan2(im, re);
  }
  return { amplitude, phase };
}

/**
 * Normalise a complex field so max amplitude = 1.
 * Returns a new Float32Array with the same phases but rescaled amplitudes.
 */
export function normalise(field) {
  const N = field.length / 2;
  let maxAmp = 0;
  for (let i = 0; i < N; i++) {
    const re = field[2 * i];
    const im = field[2 * i + 1];
    const amp = Math.sqrt(re * re + im * im);
    if (amp > maxAmp) maxAmp = amp;
  }
  if (maxAmp === 0) return new Float32Array(field.length);
  const out = new Float32Array(field.length);
  const inv = 1 / maxAmp;
  for (let k = 0; k < field.length; k++) {
    out[k] = field[k] * inv;
  }
  return out;
}
