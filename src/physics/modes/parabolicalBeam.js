// Parabolic (Parabolic Cylinder) beam — approximated via parabolic cylinder functions
// D_n(x) ≈ H_n(x/√2) · exp(-x²/4) for integer order n.

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

function parabolicCylinder(n, x) {
  return hermite(n, x / Math.SQRT2) * Math.exp(-(x * x) / 4);
}

export function parabolicalBeam({
  resX,
  resY,
  order = 0,
  w0 = 100,
  x0 = 0,
  y0 = 0,
}) {
  const out = new Float32Array(2 * resX * resY);
  const cx = resX / 2 + x0;
  const cy = resY / 2 + y0;

  for (let j = 0; j < resY; j++) {
    for (let i = 0; i < resX; i++) {
      const u = (i - cx) / (w0 / 2);
      const v = (j - cy) / (w0 / 2);
      const amp = parabolicCylinder(order, u) * Math.exp(-(v * v) / 4);
      const idx = 2 * (j * resX + i);
      out[idx] = amp;
      out[idx + 1] = 0;
    }
  }
  return out;
}
