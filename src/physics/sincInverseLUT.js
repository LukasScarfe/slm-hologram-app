/**
 * Precomputed lookup table for sinc^{-1} restricted to x in [-pi, 0].
 * sinc(x) = sin(x)/x (unnormalised), sinc(0) = 1.
 * We need the inverse: given y in [0, 1], find x in [-pi, 0] such that sinc(x) = y.
 * The LUT is indexed by y mapped linearly to [0, LUT_SIZE-1].
 */

const LUT_SIZE = 4096;
let _lut = null;

function sincUnorm(x) {
  if (Math.abs(x) < 1e-12) return 1.0;
  return Math.sin(x) / x;
}

function sincInvNewton(y) {
  // y in [0,1], find x in [-pi, 0] such that sinc(x) = y
  if (y >= 1.0) return 0.0;
  if (y <= 0.0) return -Math.PI;

  // Initial guess: linear interpolation in [-pi, 0]
  let x = -Math.PI * (1 - y);
  for (let iter = 0; iter < 50; iter++) {
    const s = sincUnorm(x);
    const ds = Math.abs(x) < 1e-12 ? 0 : (Math.cos(x) - s) / x;
    const dx = (s - y) / ds;
    x -= dx;
    // Clamp to domain
    if (x < -Math.PI) x = -Math.PI;
    if (x > 0) x = 0;
    if (Math.abs(dx) < 1e-12) break;
  }
  return x;
}

export function buildSincInverseLUT() {
  if (_lut) return _lut;
  _lut = new Float64Array(LUT_SIZE);
  for (let i = 0; i < LUT_SIZE; i++) {
    const y = i / (LUT_SIZE - 1); // y in [0, 1]
    _lut[i] = sincInvNewton(y);
  }
  return _lut;
}

export function sincInverse(y) {
  const lut = buildSincInverseLUT();
  if (y >= 1.0) return 0.0;
  if (y <= 0.0) return -Math.PI;
  const t = y * (LUT_SIZE - 1);
  const lo = Math.floor(t);
  const hi = Math.min(lo + 1, LUT_SIZE - 1);
  const frac = t - lo;
  return lut[lo] * (1 - frac) + lut[hi] * frac;
}

export { sincUnorm };
