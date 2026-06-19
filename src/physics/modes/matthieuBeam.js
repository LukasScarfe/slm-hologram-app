// Mathieu beam — simplified: J_m(kr·r) × angular Mathieu function approximation.
// For small q the angular function reduces to cos(m·θ), matching the Bessel limit.

import { besselJ } from './besselBeam.js';

function ce(m, theta, q) {
  if (m === 0) return 1;
  const base = Math.cos(m * theta);
  if (q === 0 || m <= 1) return base;
  // First-order perturbation: ce_m ≈ cos(mθ) + q/(4(m²-1)) * [cos((m-2)θ) - cos((m+2)θ)]
  const corr = (q / (4 * (m * m - 1))) * (Math.cos((m - 2) * theta) - Math.cos((m + 2) * theta));
  return base + corr;
}

export function matthieuBeam({
  resX,
  resY,
  m = 0,
  q = 1.0,
  kr = 0.1,
  x0 = 0,
  y0 = 0,
}) {
  const out = new Float32Array(2 * resX * resY);
  const cx = resX / 2 + x0;
  const cy = resY / 2 + y0;

  for (let j = 0; j < resY; j++) {
    for (let i = 0; i < resX; i++) {
      const dx = i - cx;
      const dy = j - cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      const theta = Math.atan2(dy, dx);
      const amp = besselJ(m, kr * r) * ce(m, theta, q);
      const idx = 2 * (j * resX + i);
      out[idx] = amp;
      out[idx + 1] = 0;
    }
  }
  return out;
}
