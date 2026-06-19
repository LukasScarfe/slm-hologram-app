// Spiral phase plate: φ(x,y) = l·atan2(y,x)
// For l=0 the output is uniform (Re=1, Im=0).

export function spiralPhase({ resX, resY, l = 1, x0 = 0, y0 = 0 }) {
  const out = new Float32Array(2 * resX * resY);
  const cx = resX / 2 + x0;
  const cy = resY / 2 + y0;
  for (let j = 0; j < resY; j++) {
    for (let i = 0; i < resX; i++) {
      const dx = i - cx;
      const dy = j - cy;
      const phase = l * Math.atan2(dy, dx);
      const idx = 2 * (j * resX + i);
      out[idx] = Math.cos(phase);
      out[idx + 1] = Math.sin(phase);
    }
  }
  return out;
}
