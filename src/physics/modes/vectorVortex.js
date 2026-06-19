// Vector vortex beam — scalar phase representation: Gaussian envelope × vortex phase.
// For a charge-m vortex: φ(x,y) = m·atan2(y,x).

export function vectorVortex({
  resX,
  resY,
  charge = 1,
  w0 = 100,
  x0 = 0,
  y0 = 0,
}) {
  const out = new Float32Array(2 * resX * resY);
  const cx = resX / 2 + x0;
  const cy = resY / 2 + y0;
  const w2 = w0 * w0;

  for (let j = 0; j < resY; j++) {
    for (let i = 0; i < resX; i++) {
      const dx = i - cx;
      const dy = j - cy;
      const r2 = dx * dx + dy * dy;
      const envelope = Math.exp(-r2 / w2);
      const phase = charge * Math.atan2(dy, dx);
      const idx = 2 * (j * resX + i);
      out[idx] = envelope * Math.cos(phase);
      out[idx + 1] = envelope * Math.sin(phase);
    }
  }
  return out;
}
