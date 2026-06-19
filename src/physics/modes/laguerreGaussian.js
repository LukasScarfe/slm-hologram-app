/**
 * Laguerre-Gaussian beam LG_lp.
 * l = azimuthal index (OAM charge), p = radial index.
 * Returns Float32Array [Re0, Im0, ...] length 2*resX*resY.
 */

function laguerreL(p, l, x) {
  // Associated Laguerre polynomial L_p^|l|(x) via recurrence
  const absL = Math.abs(l);
  if (p === 0) return 1;
  if (p === 1) return 1 + absL - x;
  let Lprev = 1;
  let Lcur = 1 + absL - x;
  for (let k = 2; k <= p; k++) {
    const Lnext = ((2 * k - 1 + absL - x) * Lcur - (k - 1 + absL) * Lprev) / k;
    Lprev = Lcur;
    Lcur = Lnext;
  }
  return Lcur;
}

export function laguerreGaussian({ resX, resY, pixelPitchM = 1, w0 = 50, l = 1, p = 0, x0 = 0, y0 = 0 }) {
  const out = new Float32Array(2 * resX * resY);
  const cx = resX / 2 + x0;
  const cy = resY / 2 + y0;
  const absL = Math.abs(l);

  for (let j = 0; j < resY; j++) {
    for (let i = 0; i < resX; i++) {
      const dx = i - cx;
      const dy = j - cy;
      const r2 = dx * dx + dy * dy;
      const r = Math.sqrt(r2);
      const phi = Math.atan2(dy, dx);

      const rho = Math.sqrt(2) * r / w0;
      const rho2 = 2 * r2 / (w0 * w0);

      // LG amplitude profile: r^|l| * Laguerre * exp(-r^2/w0^2)
      const amp = Math.pow(rho, absL) * laguerreL(p, l, rho2) * Math.exp(-r2 / (w0 * w0));
      const phase = l * phi;

      const idx = 2 * (j * resX + i);
      out[idx] = amp * Math.cos(phase);
      out[idx + 1] = amp * Math.sin(phase);
    }
  }
  return out;
}
