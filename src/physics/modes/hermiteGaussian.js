/**
 * Hermite-Gaussian beam HG_mn.
 * m = order along x, n = order along y.
 * Returns Float32Array [Re0, Im0, ...] length 2*resX*resY.
 */

function hermiteH(n, x) {
  if (n === 0) return 1;
  if (n === 1) return 2 * x;
  let H0 = 1, H1 = 2 * x;
  for (let k = 2; k <= n; k++) {
    const H2 = 2 * x * H1 - 2 * (k - 1) * H0;
    H0 = H1; H1 = H2;
  }
  return H1;
}

export function hermiteGaussian({ resX, resY, pixelPitchM = 1, w0 = 50, m = 0, n = 0, x0 = 0, y0 = 0 }) {
  const out = new Float32Array(2 * resX * resY);
  const cx = resX / 2 + x0;
  const cy = resY / 2 + y0;
  const sqrt2 = Math.sqrt(2);

  for (let j = 0; j < resY; j++) {
    for (let i = 0; i < resX; i++) {
      const dx = i - cx;
      const dy = j - cy;
      const xn = sqrt2 * dx / w0;
      const yn = sqrt2 * dy / w0;
      const amp = hermiteH(m, xn) * hermiteH(n, yn) *
                  Math.exp(-(dx * dx + dy * dy) / (w0 * w0));
      const idx = 2 * (j * resX + i);
      out[idx] = amp;
      out[idx + 1] = 0;
    }
  }
  return out;
}
