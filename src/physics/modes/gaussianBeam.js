/**
 * Gaussian beam (TEM00).
 * Returns Float32Array [Re0, Im0, Re1, Im1, ...] length 2*resX*resY.
 */
export function gaussianBeam({ resX, resY, pixelPitchM = 1, w0 = 50, x0 = 0, y0 = 0 }) {
  const out = new Float32Array(2 * resX * resY);
  const cx = resX / 2 + x0;
  const cy = resY / 2 + y0;
  for (let j = 0; j < resY; j++) {
    for (let i = 0; i < resX; i++) {
      const dx = i - cx;
      const dy = j - cy;
      const r2 = dx * dx + dy * dy;
      const amp = Math.exp(-r2 / (w0 * w0));
      const idx = 2 * (j * resX + i);
      out[idx] = amp;
      out[idx + 1] = 0;
    }
  }
  return out;
}
