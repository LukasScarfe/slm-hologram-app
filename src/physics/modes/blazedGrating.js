/**
 * Blazed diffraction grating carrier.
 * phase(i,j) = 2*pi*(fx*i + fy*j) mod 2*pi
 * Returns Float32Array [Re0, Im0, ...] length 2*resX*resY.
 */
export function blazedGrating({ resX, resY, fx = 0.01, fy = 0.0 }) {
  const out = new Float32Array(2 * resX * resY);
  const TWO_PI = 2 * Math.PI;

  for (let j = 0; j < resY; j++) {
    for (let i = 0; i < resX; i++) {
      const phase = TWO_PI * (fx * i + fy * j);
      const idx = 2 * (j * resX + i);
      out[idx] = Math.cos(phase);
      out[idx + 1] = Math.sin(phase);
    }
  }
  return out;
}
