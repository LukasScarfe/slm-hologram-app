import { gaussianBeam } from '../physics/modes/gaussianBeam.js';
import { laguerreGaussian } from '../physics/modes/laguerreGaussian.js';
import { hermiteGaussian } from '../physics/modes/hermiteGaussian.js';
import { besselBeam } from '../physics/modes/besselBeam.js';
import { lens } from '../physics/modes/lens.js';
import { zernikeModes } from '../physics/modes/zernikeModes.js';
import { blazedGrating } from '../physics/modes/blazedGrating.js';
import { airyBeam } from '../physics/modes/airyBeam.js';
import { inceGaussian } from '../physics/modes/inceGaussian.js';
import { matthieuBeam } from '../physics/modes/matthieuBeam.js';
import { parabolicalBeam } from '../physics/modes/parabolicalBeam.js';
import { vectorVortex } from '../physics/modes/vectorVortex.js';
import { axicon } from '../physics/modes/axicon.js';
import { spiralPhase } from '../physics/modes/spiralPhase.js';
import { customEquation } from '../physics/modes/customEquation.js';
import { superpose, normalise, extractAmplitudeAndPhase } from '../physics/hologram.js';
import { encodeExact, encodeApproximate } from '../physics/intensityMasking.js';

const TWO_PI = 2 * Math.PI;

// HSV → RGB, all channels in [0, 1].  h wraps at 1.0 (same as 0.0 → red).
function hsvToRgb(h, s, v) {
  const i = Math.floor(h * 6) % 6;
  const f = h * 6 - Math.floor(h * 6);
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i) {
    case 0: return [v, t, p];
    case 1: return [q, v, p];
    case 2: return [p, v, t];
    case 3: return [p, q, v];
    case 4: return [t, p, v];
    default: return [v, p, q];
  }
}

// Phase (HSV hue) × Intensity (HSV value = A²) → RGBA
// Zero intensity → black; full intensity → exact hue of the phase
function buildFieldPixels(A, Phi, N) {
  const px = new Uint8ClampedArray(N * 4);
  for (let i = 0; i < N; i++) {
    const hue = (Phi[i] + Math.PI) / TWO_PI;
    const val = A[i] * A[i]; // intensity
    const [r, g, b] = hsvToRgb(hue, 1, val);
    px[i * 4]     = Math.round(r * 255);
    px[i * 4 + 1] = Math.round(g * 255);
    px[i * 4 + 2] = Math.round(b * 255);
    px[i * 4 + 3] = 255;
  }
  return px;
}

// A² → greyscale RGBA  (A normalised to [0,1])
function buildIntensityPixels(A, N) {
  const px = new Uint8ClampedArray(N * 4);
  for (let i = 0; i < N; i++) {
    const g = Math.round(A[i] * A[i] * 255);
    px[i * 4]     = g;
    px[i * 4 + 1] = g;
    px[i * 4 + 2] = g;
    px[i * 4 + 3] = 255;
  }
  return px;
}

// Phi ∈ [−π, π] → HSV circular colormap RGBA
// Hue = (Phi + π) / 2π: −π→red, 0→cyan, +π→red (continuous wrap)
function buildPhasePixels(Phi, N) {
  const px = new Uint8ClampedArray(N * 4);
  for (let i = 0; i < N; i++) {
    const hue = (Phi[i] + Math.PI) / TWO_PI;
    const [r, g, b] = hsvToRgb(hue, 1, 1);
    px[i * 4]     = Math.round(r * 255);
    px[i * 4 + 1] = Math.round(g * 255);
    px[i * 4 + 2] = Math.round(b * 255);
    px[i * 4 + 3] = 255;
  }
  return px;
}

// Scale pixel-space mode parameters for preview grids.
// Modes specify w0, x0, y0, etc. in units of full-SLM pixels.
// At preview scale the computational grid is smaller by `scale`, so pixel-space
// position/size params must be shrunk by `scale` and spatial-frequency params
// (kr) must be grown by 1/scale so the same physical pattern is reproduced.
// Modes that already use pixelPitchM for physical conversions (lens, axicon)
// are scale-invariant and do NOT need this adjustment.
function scalePixelParams(modeType, params, scale) {
  if (scale >= 1) return params;
  const s = scale;
  const p = { ...params };

  // Position offsets — always in pixels for every mode
  if (p.x0 != null) p.x0 *= s;
  if (p.y0 != null) p.y0 *= s;

  // Pixel-space size parameters
  if (p.w0 != null) p.w0 *= s;
  if (p.pupilRadius != null) p.pupilRadius *= s;   // zernikeModes custom radius

  // airyBeam: 'scale' parameter sets lobe spacing in pixels
  if (modeType === 'airyBeam' && p.scale != null) p.scale *= s;

  // Bessel / Mathieu: kr is in radians/pixel — must grow as grid shrinks
  if ((modeType === 'besselBeam' || modeType === 'matthieuBeam') && p.kr != null) {
    p.kr /= s;
  }

  return p;
}

function buildPhysicsParams(modeType, uiParams, hardware, resX, resY, pixelPitchM) {
  const base = { resX, resY, pixelPitchM };
  switch (modeType) {
    case 'lens': {
      const fMm = uiParams.focalLengthMm ?? 500;
      const wNm = hardware.wavelengthNm ?? 532;
      // x0/y0 already scaled by caller; lens converts to physical via pixelPitchM
      return {
        ...base,
        focalLengthM: fMm * 1e-3,
        wavelengthM: wNm * 1e-9,
        x0: uiParams.x0 ?? 0,
        y0: uiParams.y0 ?? 0,
      };
    }
    case 'zernikeModes':
      return {
        ...base,
        n: uiParams.n ?? 0,
        m: uiParams.m ?? 0,
        coefficient: uiParams.amplitude ?? 1,
        // pupilRadius already scaled; fall back to half the computational grid
        pupilRadiusPx: uiParams.pupilRadius ?? Math.min(resX, resY) / 2,
        x0: uiParams.x0 ?? 0,
        y0: uiParams.y0 ?? 0,
      };
    case 'axicon':
      // axicon uses pixelPitchM for physical radius — already scale-invariant
      return {
        ...base,
        halfAngleDeg: uiParams.halfAngleDeg ?? 1.0,
        wavelengthM: (hardware.wavelengthNm ?? 532) * 1e-9,
        x0: uiParams.x0 ?? 0,
        y0: uiParams.y0 ?? 0,
      };
    default:
      return { ...base, ...uiParams };
  }
}

const MODE_FNS = {
  gaussianBeam,
  laguerreGaussian,
  hermiteGaussian,
  besselBeam,
  lens,
  zernikeModes,
  blazedGrating,
  airyBeam,
  inceGaussian,
  matthieuBeam,
  parabolicalBeam,
  vectorVortex,
  axicon,
  spiralPhase,
  customEquation,
};

function computeHologram({ modes, hardware, encodingMethod, gamma, gratingFrequency, holoShift, fullResolution, computeAllViews = true }) {
  const { resX, resY, pixelPitchMicron, bitDepth } = hardware;

  let w, h, pixelPitchM, scale;
  if (fullResolution) {
    w = resX;
    h = resY;
    pixelPitchM = pixelPitchMicron * 1e-6;
    scale = 1;
  } else {
    scale = Math.min(1, 256 / Math.max(resX, resY));
    w = Math.max(1, Math.round(resX * scale));
    h = Math.max(1, Math.round(resY * scale));
    pixelPitchM = (pixelPitchMicron * 1e-6) / scale;
  }

  const enabledModes = (modes || []).filter((m) => m.enabled);

  if (enabledModes.length === 0) {
    const N = w * h;
    const pixels = new Uint8ClampedArray(N * 4);
    const grey = new Uint16Array(N);
    for (let i = 0; i < N; i++) {
      pixels[i * 4]     = 64;
      pixels[i * 4 + 1] = 64;
      pixels[i * 4 + 2] = 64;
      pixels[i * 4 + 3] = 255;
    }
    if (!computeAllViews) return { pixels, grey, width: w, height: h };
    // No field → black intensity, neutral grey phase, black field
    const intensityPixels = new Uint8ClampedArray(N * 4);
    for (let i = 0; i < N; i++) intensityPixels[i * 4 + 3] = 255;
    const phasePixels = new Uint8ClampedArray(N * 4);
    for (let i = 0; i < N; i++) {
      phasePixels[i * 4] = phasePixels[i * 4 + 1] = phasePixels[i * 4 + 2] = 64;
      phasePixels[i * 4 + 3] = 255;
    }
    const fieldPixels = new Uint8ClampedArray(N * 4);
    for (let i = 0; i < N; i++) fieldPixels[i * 4 + 3] = 255;
    return { pixels, grey, intensityPixels, phasePixels, fieldPixels, width: w, height: h };
  }

  const shiftX = (holoShift?.x ?? 0) * scale;
  const shiftY = (holoShift?.y ?? 0) * scale;

  const modeInputs = enabledModes.map((m) => {
    const fn = MODE_FNS[m.type];
    let field;
    if (fn) {
      try {
        const scaledParams = scalePixelParams(m.type, m.params || {}, scale);
        const shiftedParams = {
          ...scaledParams,
          x0: (scaledParams.x0 ?? 0) + shiftX,
          y0: (scaledParams.y0 ?? 0) + shiftY,
        };
        const physParams = buildPhysicsParams(m.type, shiftedParams, hardware, w, h, pixelPitchM);
        const result = fn(physParams);
        // customEquation may return { error } on invalid equation
        field = (result instanceof Float32Array) ? result : new Float32Array(2 * w * h);
      } catch {
        field = new Float32Array(2 * w * h);
      }
    } else {
      field = new Float32Array(2 * w * h);
    }
    return { field, weight: m.weight ?? 1, phaseOffset: m.phaseOffset ?? 0, enabled: true };
  });

  const combined = superpose(modeInputs);
  const normed = normalise(combined);
  const { amplitude: A, phase: Phi } = extractAmplitudeAndPhase(normed);

  // Convert grating angles (mrad) → cycles/computational pixel.
  // pixelPitchM is already adjusted for preview scale, so this gives the
  // correct computational frequency in both full-res and preview modes.
  const lambda_m = (hardware.wavelengthNm ?? 532) * 1e-9;
  const fx = (gratingFrequency?.fx ?? 0) * 1e-3 * pixelPitchM / lambda_m;
  const fy = (gratingFrequency?.fy ?? 0) * 1e-3 * pixelPitchM / lambda_m;
  const hasGrating = fx !== 0 || fy !== 0;

  let Psi;
  if (hasGrating) {
    const encodeFn = encodingMethod === 'approximate' ? encodeApproximate : encodeExact;
    Psi = encodeFn({ A, Phi, resX: w, resY: h, fx, fy });
  } else {
    // No carrier grating: encode amplitude directly into [0, 2π] so the full
    // grey-level range is used. Bolduc encoding without a carrier is meaningless
    // (its max is bounded to π ≈ grey 128 for real-positive fields).
    Psi = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      Psi[i] = A[i] * TWO_PI;
    }
  }

  const maxGamma = gamma ?? (Math.pow(2, bitDepth) - 1);
  const grey = new Uint16Array(w * h);
  for (let i = 0; i < w * h; i++) {
    grey[i] = Math.max(0, Math.min(maxGamma, Math.round((Psi[i] / TWO_PI) * maxGamma)));
  }

  const N = w * h;
  const pixels = new Uint8ClampedArray(N * 4);
  // Map grey values [0, maxGamma] → display brightness [0, 255] using the full
  // bit-depth range as denominator, not maxGamma. This means a gamma of 10 on
  // an 8-bit SLM results in a maximum pixel brightness of 10/255 (dark grey),
  // faithfully representing the actual grey level written to the device.
  const maxBitVal = Math.pow(2, bitDepth) - 1;
  for (let i = 0; i < N; i++) {
    const g = Math.round((grey[i] / maxBitVal) * 255);
    pixels[i * 4]     = g;
    pixels[i * 4 + 1] = g;
    pixels[i * 4 + 2] = g;
    pixels[i * 4 + 3] = 255;
  }

  const intensityPixels = computeAllViews ? buildIntensityPixels(A, N)       : null;
  const phasePixels     = computeAllViews ? buildPhasePixels(Phi, N)         : null;
  const fieldPixels     = computeAllViews ? buildFieldPixels(A, Phi, N)      : null;
  return { pixels, grey, intensityPixels, phasePixels, fieldPixels, width: w, height: h };
}

self.onmessage = (e) => {
  const { type, payload } = e.data;
  if (type === 'COMPUTE') {
    try {
      const result = computeHologram(payload);
      self.postMessage({ type: 'RESULT', payload: { slmId: payload.slmId, ...result } });
    } catch (err) {
      self.postMessage({ type: 'ERROR', payload: { slmId: payload.slmId, error: err.message } });
    }
  }
};
