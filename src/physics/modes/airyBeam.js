// Airy beam: E(x,y) = Ai(x/scale)*exp(a*x/scale) * Ai(y/scale)*exp(a*y/scale)
// Airy ODE: Ai''(ξ) = ξ·Ai(ξ), built via RK4 LUT.

const XMIN = -20;
const XMAX = 5;
const N_LUT = 5000;
const H_LUT = (XMAX - XMIN) / (N_LUT - 1);

function rk4Step(x, y0, y1, h) {
  const k1y0 = y1;
  const k1y1 = x * y0;
  const x2 = x + h / 2;
  const k2y0 = y1 + (h / 2) * k1y1;
  const k2y1 = x2 * (y0 + (h / 2) * k1y0);
  const k3y0 = y1 + (h / 2) * k2y1;
  const k3y1 = x2 * (y0 + (h / 2) * k2y0);
  const x4 = x + h;
  const k4y0 = y1 + h * k3y1;
  const k4y1 = x4 * (y0 + h * k3y0);
  return [
    y0 + (h / 6) * (k1y0 + 2 * k2y0 + 2 * k3y0 + k4y0),
    y1 + (h / 6) * (k1y1 + 2 * k2y1 + 2 * k3y1 + k4y1),
  ];
}

function buildAiryLUT() {
  const lut = new Float64Array(N_LUT);
  const AI0 = 0.35502805388781723926;
  const AIP0 = -0.25881940379280679841;
  const i0 = Math.round((0 - XMIN) / H_LUT);

  lut[i0] = AI0;
  let y0 = AI0, y1 = AIP0;
  for (let i = i0; i < N_LUT - 1; i++) {
    const x = XMIN + i * H_LUT;
    [y0, y1] = rk4Step(x, y0, y1, H_LUT);
    lut[i + 1] = y0;
  }

  y0 = AI0; y1 = AIP0;
  for (let i = i0; i > 0; i--) {
    const x = XMIN + i * H_LUT;
    [y0, y1] = rk4Step(x, y0, y1, -H_LUT);
    lut[i - 1] = y0;
  }
  return lut;
}

const AIRY_LUT = buildAiryLUT();

function airyFn(x) {
  if (x < XMIN || x > XMAX) return 0;
  const idx = Math.round((x - XMIN) / H_LUT);
  return AIRY_LUT[Math.max(0, Math.min(N_LUT - 1, idx))];
}

export function airyBeam({ resX, resY, scale = 30, a = 0.1, x0 = 0, y0 = 0 }) {
  const out = new Float32Array(2 * resX * resY);
  const cx = resX / 2 + x0;
  const cy = resY / 2 + y0;
  for (let j = 0; j < resY; j++) {
    for (let i = 0; i < resX; i++) {
      const xn = (i - cx) / scale;
      const yn = (j - cy) / scale;
      const amp = airyFn(xn) * Math.exp(a * xn) * airyFn(yn) * Math.exp(a * yn);
      const idx = 2 * (j * resX + i);
      out[idx] = amp;
      out[idx + 1] = 0;
    }
  }
  return out;
}
