import { CET_C6 } from '../data/cetC6.js';

const TWO_PI = 2 * Math.PI;

// hue ∈ [0, 1] → [r, g, b] from the CET_C6 256-entry lookup table
export function cetC6Lookup(hue) {
  const i = Math.min(255, Math.max(0, Math.round(hue * 255))) * 3;
  return [CET_C6[i], CET_C6[i + 1], CET_C6[i + 2]];
}

// HSV → RGB, all channels in [0, 1].  h wraps at 1.0 (same as 0.0 → red).
export function hsvToRgb(h, s, v) {
  const i = Math.floor(h * 6) % 6;
  const f = h * 6 - Math.floor(h * 6);
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i) {
    case 0: return [v, t, p];
    case 1: return [q, v, p];
    case 2: return [p, v, t];
    case 3: return [p, q, v];
    case 4: return [t, p, v];
    default: return [v, p, q];
  }
}

// Phase (hue) × Intensity (brightness = A²) → RGBA
// colormap: 'hsv' uses hsvToRgb at full saturation; 'cet_c6' uses cetC6Lookup.
// Either way the value channel scales with A² so zero intensity → black.
export function buildFieldPixels(A, Phi, N, colormap) {
  const px = new Uint8ClampedArray(N * 4);
  const useCet = colormap === 'cet_c6';
  for (let i = 0; i < N; i++) {
    const hue = (Phi[i] + Math.PI) / TWO_PI;
    const val = A[i] * A[i]; // intensity ∈ [0, 1]
    let r, g, b;
    if (useCet) {
      const [cr, cg, cb] = cetC6Lookup(hue);
      r = Math.round(cr * val);
      g = Math.round(cg * val);
      b = Math.round(cb * val);
    } else {
      const rgb = hsvToRgb(hue, 1, val);
      r = Math.round(rgb[0] * 255);
      g = Math.round(rgb[1] * 255);
      b = Math.round(rgb[2] * 255);
    }
    px[i * 4]     = r;
    px[i * 4 + 1] = g;
    px[i * 4 + 2] = b;
    px[i * 4 + 3] = 255;
  }
  return px;
}

// A² → greyscale RGBA  (A normalised to [0,1])
export function buildIntensityPixels(A, N) {
  const px = new Uint8ClampedArray(N * 4);
  for (let i = 0; i < N; i++) {
    const g = Math.round(A[i] * A[i] * 255);
    px[i * 4]     = g;
    px[i * 4 + 1] = g;
    px[i * 4 + 2] = g;
    px[i * 4 + 3] = 255;
  }
  return px;
}

// Phi ∈ [−π, π] → circular colormap RGBA
// colormap: 'hsv' — hue-only HSV (−π→red, 0→cyan, +π→red)
//           'cet_c6' — Colorcet CET_C6 cyclic_rygcbmr_50_90_c64
export function buildPhasePixels(Phi, N, colormap) {
  const px = new Uint8ClampedArray(N * 4);
  const useCet = colormap === 'cet_c6';
  for (let i = 0; i < N; i++) {
    const hue = (Phi[i] + Math.PI) / TWO_PI;
    let r, g, b;
    if (useCet) {
      [r, g, b] = cetC6Lookup(hue);
    } else {
      const rgb = hsvToRgb(hue, 1, 1);
      r = Math.round(rgb[0] * 255);
      g = Math.round(rgb[1] * 255);
      b = Math.round(rgb[2] * 255);
    }
    px[i * 4]     = r;
    px[i * 4 + 1] = g;
    px[i * 4 + 2] = b;
    px[i * 4 + 3] = 255;
  }
  return px;
}
