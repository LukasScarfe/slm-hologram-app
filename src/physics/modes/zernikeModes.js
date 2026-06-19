/**
 * Zernike polynomial Z_n^m as a pure phase element (amplitude = 1 inside pupil, 0 outside).
 * Standard Noll normalisation.
 */

function factorial(n) {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function zernikeR(n, m, rho) {
  // Radial polynomial R_n^m(rho)
  const absM = Math.abs(m);
  let sum = 0;
  for (let s = 0; s <= (n - absM) / 2; s++) {
    const num = Math.pow(-1, s) * factorial(n - s);
    const den = factorial(s) * factorial((n + absM) / 2 - s) * factorial((n - absM) / 2 - s);
    sum += (num / den) * Math.pow(rho, n - 2 * s);
  }
  return sum;
}

export function zernikeModes({ resX, resY, pixelPitchM = 1, n = 0, m = 0, pupilRadiusPx = null, coefficient = 1, x0 = 0, y0 = 0 }) {
  const out = new Float32Array(2 * resX * resY);
  const cx = resX / 2 + x0;
  const cy = resY / 2 + y0;
  const R = pupilRadiusPx !== null ? pupilRadiusPx : Math.min(resX, resY) / 2;

  // Normalisation factor
  const norm = Math.sqrt((n + 1) * (m === 0 ? 1 : 2));

  for (let j = 0; j < resY; j++) {
    for (let i = 0; i < resX; i++) {
      const dx = i - cx;
      const dy = j - cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      const rho = r / R;
      const phi = Math.atan2(dy, dx);
      const idx = 2 * (j * resX + i);

      if (rho > 1.0) {
        out[idx] = 0;
        out[idx + 1] = 0;
        continue;
      }

      const Rnm = zernikeR(n, m, rho);
      let Z;
      if (m === 0) {
        Z = norm * Rnm;
      } else if (m > 0) {
        Z = norm * Rnm * Math.cos(m * phi);
      } else {
        Z = norm * Rnm * Math.sin(-m * phi);
      }

      const phase = coefficient * Z;
      out[idx] = Math.cos(phase);
      out[idx + 1] = Math.sin(phase);
    }
  }
  return out;
}
