/**
 * Quadratic phase lens: phi(x,y) = -pi*(dx^2+dy^2)/(lambda*f)
 * f in pixels (pass f_m/pixelPitchM if physical), lambda in pixels.
 * Returns Float32Array [Re0, Im0, ...] length 2*resX*resY.
 */
export function lens({ resX, resY, pixelPitchM = 1e-6, focalLengthM = 0.5, wavelengthM = 532e-9, x0 = 0, y0 = 0 }) {
  const out = new Float32Array(2 * resX * resY);
  const cx = resX / 2 + x0;
  const cy = resY / 2 + y0;

  for (let j = 0; j < resY; j++) {
    for (let i = 0; i < resX; i++) {
      const dx = (i - cx) * pixelPitchM;
      const dy = (j - cy) * pixelPitchM;
      const r2 = dx * dx + dy * dy;
      const phase = -Math.PI * r2 / (wavelengthM * focalLengthM);
      const idx = 2 * (j * resX + i);
      out[idx] = Math.cos(phase);
      out[idx + 1] = Math.sin(phase);
    }
  }
  return out;
}
