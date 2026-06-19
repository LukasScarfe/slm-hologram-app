/**
 * Quantise hologram phase Psi (in radians, 0..2π) to grey levels.
 * grey = round(Psi / 2π × γ), clamped to [0, γ].
 *
 * quantise(Psi, gamma) → Uint16Array
 * dequantise(greyLevels, gamma) → Float32Array of phases
 */

const TWO_PI = 2 * Math.PI;

export function quantise(Psi, gamma) {
  const N = Psi.length;
  const out = new Uint16Array(N);
  for (let i = 0; i < N; i++) {
    const val = Math.round((Psi[i] / TWO_PI) * gamma);
    out[i] = Math.max(0, Math.min(gamma, val));
  }
  return out;
}

export function dequantise(greyLevels, gamma) {
  const N = greyLevels.length;
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    out[i] = (greyLevels[i] / gamma) * TWO_PI;
  }
  return out;
}
