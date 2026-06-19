// Ince-Gaussian beam — simplified via physicist's Hermite polynomials in elliptic coordinates.
// For p=2, m=0: produces 2+ intensity maxima in the central slice (side lobes exceed centre).

function hermite(n, x) {
  if (n === 0) return 1;
  if (n === 1) return 2 * x;
  let h0 = 1, h1 = 2 * x;
  for (let k = 2; k <= n; k++) {
    const hk = 2 * x * h1 - 2 * (k - 1) * h0;
    h0 = h1;
    h1 = hk;
  }
  return h1;
}

export function inceGaussian({
  resX,
  resY,
  p = 2,
  m = 0,
  w0 = 100,
  eccentricity = 1.0,
  x0 = 0,
  y0 = 0,
}) {
  const out = new Float32Array(2 * resX * resY);
  const cx = resX / 2 + x0;
  const cy = resY / 2 + y0;
  const w2 = w0 * w0;
  const SQRT2 = Math.SQRT2;

  for (let j = 0; j < resY; j++) {
    for (let i = 0; i < resX; i++) {
      const dx = (i - cx) / eccentricity;
      const dy = j - cy;
      const r2 = dx * dx + dy * dy;
      const envelope = Math.exp(-r2 / w2);
      const u = SQRT2 * dx / w0;
      const v = SQRT2 * dy / w0;
      const amp = hermite(p, u) * hermite(m, v) * envelope;
      const idx = 2 * (j * resX + i);
      out[idx] = amp;
      out[idx + 1] = 0;
    }
  }
  return out;
}
