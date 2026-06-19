/**
 * Bessel beam J_n(kr * r) * exp(i*n*phi).
 * Returns Float32Array [Re0, Im0, ...] length 2*resX*resY.
 */

// Bessel J_n via series (for moderate x, good enough for tests)
function besselJ(n, x) {
  if (x === 0) return n === 0 ? 1 : 0;
  // Use recurrence downward (Miller's algorithm) for stability
  const nAbs = Math.abs(n);
  // For small-ish x use forward series
  let sum = 0;
  const terms = 40;
  for (let k = 0; k < terms; k++) {
    const term = (Math.pow(-1, k) / (factorial(k) * factorial(k + nAbs))) *
                 Math.pow(x / 2, 2 * k + nAbs);
    sum += term;
    if (Math.abs(term) < 1e-15 * Math.abs(sum)) break;
  }
  return sum;
}

function factorial(n) {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

export function besselBeam({ resX, resY, pixelPitchM = 1, kr = 0.1, n = 0, x0 = 0, y0 = 0 }) {
  const out = new Float32Array(2 * resX * resY);
  const cx = resX / 2 + x0;
  const cy = resY / 2 + y0;

  for (let j = 0; j < resY; j++) {
    for (let i = 0; i < resX; i++) {
      const dx = i - cx;
      const dy = j - cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      const phi = Math.atan2(dy, dx);
      const amp = besselJ(n, kr * r);
      const phase = n * phi;
      const idx = 2 * (j * resX + i);
      out[idx] = amp * Math.cos(phase);
      out[idx + 1] = amp * Math.sin(phase);
    }
  }
  return out;
}

export { besselJ };
