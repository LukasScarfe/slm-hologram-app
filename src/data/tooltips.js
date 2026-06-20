export const TOOLTIPS = {
  gamma: {
    label: 'Gamma (γ) — Maximum grey level',
    description:
      'Caps the highest grey value written to the hologram. ' +
      'The phase range [0, 2π] is mapped linearly to [0, γ].',
    example:
      'Change this when your SLM calibration shows that grey levels ' +
      'above 240 all produce the same phase response (≈ 2π). Setting γ = 240 ' +
      'avoids wasting dynamic range in a region where the device is saturated.',
  },
  encodingMethod: {
    label: 'Encoding method — Exact vs Approximate',
    description:
      'Chooses how the desired amplitude and phase are written into the phase-only ' +
      'hologram. "Exact" uses the Bolduc et al. (2013) sinc⁻¹ correction, which ' +
      'reproduces the desired amplitude with zero error. "Approximate" uses a faster ' +
      'Davis et al. (1999) style encoding whose generated amplitude can differ from ' +
      'the desired amplitude by up to 0.161.',
    example:
      'Use "Exact" for any mode whose amplitude profile matters scientifically ' +
      '(e.g. precise radial mode purity for quantum state tomography). Switch to ' +
      '"Approximate" only if you need the small extra compute headroom.',
  },
  modeWeight: {
    label: 'Mode weight (wₖ)',
    description:
      'Sets the relative amplitude of this mode in the coherent superposition. ' +
      'The final hologram is always normalised, so only the ratio between ' +
      'weights matters, not their absolute values.',
    example:
      'To create a superposition of LG₁₀ and LG₋₁₀ with twice as much ' +
      'OAM content in one handedness, set one weight to 1.0 and the other to 0.5.',
  },
  modePhaseOffset: {
    label: 'Phase offset (Δφ)',
    description:
      'Adds a global phase shift to this mode before it enters the superposition. ' +
      'Equivalent to rotating the complex amplitude of the mode by Δφ in the ' +
      'complex plane.',
    example:
      'When interfering two LG modes to create a petal pattern, changing Δφ ' +
      'on one mode rotates the petal pattern azimuthally without changing ' +
      'the overall intensity profile.',
  },
  gratingFx: {
    label: 'Grating angle θₓ (mrad)',
    description:
      'Sets the horizontal deflection angle of the blazed grating carrier in milliradians. ' +
      'Controls where the first diffraction order lands relative to the zeroth order. ' +
      'Converted internally to cycles/pixel as fₓ = θₓ × 10⁻³ × d / λ, where d is the ' +
      'pixel pitch and λ is the wavelength. A proper blazed (sawtooth) phase ramp is written — ' +
      'not a binary grating. The maximum useful angle before aliasing is λ/(2d): ' +
      '≈ 33 mrad for 532 nm / 8 μm pitch.',
    example:
      'Set θₓ = 10 mrad to steer the first-order diffraction beam 10 mrad away from the ' +
      'zeroth-order (undiffracted) reflection in the horizontal direction. ' +
      'Increase until the first and zeroth orders are well separated on your camera.',
  },
  gratingFy: {
    label: 'Grating angle θᵧ (mrad)',
    description:
      'Sets the vertical deflection angle of the blazed grating carrier in milliradians. ' +
      'Same conversion as θₓ: fᵧ = θᵧ × 10⁻³ × d / λ.',
    example:
      'Combine θₓ and θᵧ to steer the diffracted beam to any 2D position ' +
      'in the far field, e.g. θₓ = 10 mrad, θᵧ = 5 mrad tilts the beam diagonally.',
  },
  pixelPitch: {
    label: 'Pixel pitch (μm)',
    description:
      'The centre-to-centre distance between adjacent SLM pixels. ' +
      'Used to convert between pixel-space and physical distances when ' +
      'computing lens phases and grating periods.',
    example:
      'If you switch from a Holoeye PLUTO (8.0 μm pitch) to a Meadowlark 1920 ' +
      '(9.2 μm pitch), update this value so that a lens phase hologram ' +
      'produces the correct focal length in the lab.',
  },
  bitDepth: {
    label: 'Bit depth',
    description:
      'The number of addressable grey levels of the SLM: 8-bit gives 256 levels ' +
      '(0–255), 10-bit gives 1024 levels (0–1023). ' +
      'Higher bit depth allows finer phase resolution.',
    example:
      'Use 10-bit when working with high-order Zernike aberration correction, ' +
      'where coarse phase quantisation would introduce visible diffraction artefacts.',
  },
  lgL: {
    label: 'Azimuthal index l (topological charge)',
    description:
      'Sets the orbital angular momentum (OAM) charge of the Laguerre-Gaussian beam. ' +
      'The beam phase winds l × 2π around the optical axis. ' +
      'Positive and negative values correspond to opposite handedness.',
    example:
      'Set l = 3 to trap a birefringent particle and apply a torque of 3ℏ per photon. ' +
      'Increase |l| to generate higher-order vortex beams for OAM multiplexing.',
  },
  lgP: {
    label: 'Radial index p',
    description:
      'Sets the number of radial nodes (dark rings) in the Laguerre-Gaussian beam. ' +
      'p = 0 gives a single-ring vortex; p = 1 adds one extra dark ring, and so on.',
    example:
      'Use p = 1 when you need a multi-ring LG mode to study radial mode ' +
      'sorting in optical fibre experiments.',
  },
  beamWaist: {
    label: 'Beam waist w₀ (pixels)',
    description:
      'The radial distance at which the field amplitude falls to 1/e of its ' +
      'peak value (or 1/e² in intensity). Larger values produce a wider beam ' +
      'that fills more of the SLM aperture.',
    example:
      'Reduce w₀ to underfill the SLM and avoid hard aperture clipping at the ' +
      'device edges. Increase it to maximise throughput when using the full aperture.',
  },
  lensFocalLength: {
    label: 'Focal length f (mm)',
    description:
      'Sets the focal length of the phase-only Fresnel lens encoded on the SLM. ' +
      'Positive f focuses, negative f diverges. The phase profile is ' +
      'φ(r) = −π r² / (λ f).',
    example:
      'Add a lens mode with f = 1000 mm to shift the focus of your beam along ' +
      'the optical axis by ~1 m without moving any physical optics.',
  },
  zernikeN: {
    label: 'Radial order n',
    description:
      'The radial order of the Zernike polynomial. Together with the azimuthal ' +
      'order m, it uniquely identifies the polynomial. Must satisfy n ≥ |m| and ' +
      '(n − |m|) must be even.',
    example:
      'n = 4, m = 0 is spherical aberration (Z₄⁰). Use this to pre-compensate ' +
      'spherical aberration introduced by a microscope objective.',
  },
  zernikeM: {
    label: 'Azimuthal order m',
    description:
      'The azimuthal order of the Zernike polynomial. Positive and negative ' +
      'values correspond to cosine and sine orientations of the same mode shape.',
    example:
      'n = 2, m = ±2 is astigmatism. Use m = +2 for 0°/90° astigmatism and ' +
      'm = −2 for 45°/135° astigmatism correction.',
  },
  preset: {
    label: 'SLM Hardware Preset',
    description:
      'Loads a predefined set of hardware parameters for a known SLM model. ' +
      'Sets resolution, pixel pitch, and bit depth.',
    example:
      'Use "Custom" ' +
      'to enter arbitrary hardware parameters for a device not in the list.',
  },
  resolution: {
    label: 'Resolution (pixels)',
    description:
      'The number of pixels in the horizontal (X) and vertical (Y) directions. ' +
      'The hologram is computed on a grid of this size.',
    example:
      'A 1920×1080 SLM requires a 1920×1080 hologram. Mismatching this value ' +
      'to your physical device will produce incorrect hologram scaling.',
  },
  wavelength: {
    label: 'Wavelength λ (nm)',
    description:
      'Wavelength of the light incident on the SLM. ',
  },
  holoShift: {
    label: 'Hologram Shift',
    description:
      'Shifts the entire hologram pattern (all modes together) by a fixed number of pixels ' +
      'in X and Y. Equivalent to adding a global position offset to every mode simultaneously.',
    example:
      'Use this to centre the diffracted beam on a camera or aperture without adjusting ' +
      'each mode individually.',
  },
  positionOffsetX: {
    label: 'Horizontal position shift x₀ (pixels)',
    description:
      'Shifts the centre of this mode horizontally by x₀ pixels relative to the ' +
      'centre of the SLM. Positive values move the mode to the right.',
    example:
      'Set x₀ = 100 to offset the beam centre 100 pixels to the right. ' +
      'Use this to place multiple modes at different positions across the aperture.',
  },
  positionOffsetY: {
    label: 'Vertical position shift y₀ (pixels)',
    description:
      'Shifts the centre of this mode vertically by y₀ pixels relative to the ' +
      'centre of the SLM. Positive values move the mode downward (screen coordinates).',
    example:
      'Set y₀ = −100 to offset the beam centre 100 pixels upward. ' +
      'Combine with x₀ to place modes anywhere across the SLM aperture.',
  },
};
