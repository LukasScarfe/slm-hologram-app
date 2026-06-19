// Axicon: conical phase φ(r) = 2π·r·sin(θ)/λ
// r is the physical radial distance from centre.

const TWO_PI = 2 * Math.PI;

export function axicon({
  resX,
  resY,
  pixelPitchM = 8e-6,
  halfAngleDeg = 1.0,
  wavelengthM = 532e-9,
  x0 = 0,
  y0 = 0,
}) {
  const out = new Float32Array(2 * resX * resY);
  const cx = resX / 2 + x0;
  const cy = resY / 2 + y0;
  const sinTheta = Math.sin(halfAngleDeg * (Math.PI / 180));
  const kAxicon = TWO_PI * sinTheta / wavelengthM;

  for (let j = 0; j < resY; j++) {
    for (let i = 0; i < resX; i++) {
      const dx = i - cx;
      const dy = j - cy;
      const r = Math.sqrt(dx * dx + dy * dy) * pixelPitchM;
      const phase = kAxicon * r;
      const idx = 2 * (j * resX + i);
      out[idx] = Math.cos(phase);
      out[idx + 1] = Math.sin(phase);
    }
  }
  return out;
}
