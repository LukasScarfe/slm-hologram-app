# SLM Hologram Studio — Update Log

## 2026-06-22 (session 2)

### Test coverage expansion
Identified and closed major test coverage gaps across all milestone features.

**New files:** `tests/e2e/features.spec.js` (20 new e2e tests: colormap toggle, tab renaming, mode nicknames, hologram shift, clear stack, mode prepend order, preset/wavelength independence); `tests/unit/pixelRendering.test.js` (17 unit tests covering `buildPhasePixels`, `buildIntensityPixels`, `buildFieldPixels`, `hsvToRgb`, `cetC6Lookup`)
**Files changed:** `tests/unit/store.test.js` (7 new tests: `setPhaseColormap`, `renameSLM`, `setModeNickname`, `setHoloShift`, `clearModes`, addMode prepend, selectPreset preserves wavelength); `tests/e2e/milestone6.spec.js` (test 13 extended to check visualisation export items; tests 21–23 for Field/Intensity/Phase PNG download triggers)

### Code structure improvements
- Extracted `buildPhasePixels`, `buildIntensityPixels`, `buildFieldPixels`, `hsvToRgb`, `cetC6Lookup` from `hologramWorker.js` into `src/workers/pixelRendering.js`. The worker now imports them; all functions are independently unit-testable without running a worker.
- Extracted `computeFullRes` and `rgbaToPNG` from `SLMExportImport.jsx` into `src/workers/computeFullRes.js`. Component now imports from there; the worker-spawning logic is no longer embedded in a React component.
- Replaced `{ id: 'sep' }` magic sentinel in `EXPORT_FORMATS` with a named `SEPARATOR` constant and reference-equality check (`f === SEPARATOR`).

**New files:** `src/workers/pixelRendering.js`, `src/workers/computeFullRes.js`
**Files changed:** `src/workers/hologramWorker.js`, `src/components/slm/SLMExportImport.jsx`

### data-testid additions for testability
Added `data-testid` attributes to UI elements that lacked them:
- `data-testid="clear-stack-button"` on Clear Stack button in `ModeStack.jsx`
- `data-testid="slm-tab-rename-input"` on the inline rename input in `SLMTabBar.jsx`
- `data-testid="mode-title-{index}"` on ModeTitle span and `data-testid="mode-nickname-input-{index}"` on its editing input in `ModeCard.jsx`
- `data-testid="holo-shift-x-slider"` / `"holo-shift-y-slider"` and `numberInputTestId="holo-shift-x-input"` / `"holo-shift-y-input"` on the LabelledSlider calls in `HologramParamsSection.jsx`

**Files changed:** `src/components/modes/ModeStack.jsx`, `src/components/layout/SLMTabBar.jsx`, `src/components/modes/ModeCard.jsx`, `src/components/slm/HologramParamsSection.jsx`

## 2026-06-22

### Phase colormap toggle — HSV or CET C06
Phase and Field visualisation views now support two colourmap choices via a toggle in the preview toolbar. The default is **CET C06** (`cyclic_rygcbmr_50_90_c64` from Colorcet), a perceptually uniform cyclic map that cycles R→Y→G→C→B→M→R. The alternative is the previous **HSV** rainbow. The selection persists per SLM in localStorage. The colour legend bar updates to match. Both views (Phase and Field) honour the setting — Field applies the chosen hue mapping with intensity as brightness.

**New file:** `src/data/cetC6.js` (256-entry `Uint8Array` lookup table, CC0, sourced from `github.com/holoviz/colorcet`)
**Files changed:** `src/workers/hologramWorker.js`, `src/store/useSLMStore.js`, `src/hooks/useHologramCompute.js`, `src/components/slm/SLMPreview.jsx`

### Visualisation image exports
Three new entries in the Export dropdown (below a separator): **Field image (PNG)**, **Intensity image (PNG)**, **Phase image (PNG)**. Each renders the full-resolution SLM at the currently selected phase colourmap and saves as a 32-bit-per-pixel RGBA PNG via `fast-png`.

**File changed:** `src/components/slm/SLMExportImport.jsx`

## 2026-06-21

### Hologram preview enlarged
Default max preview width increased from 480 px → 720 px (1.5×) to visually balance with the taller left-column panels. The right column flex-basis raised to 600 px accordingly.

**File changed:** `src/components/slm/SLMPreview.jsx`, `src/components/slm/SLMPanel.jsx`

### Hardware Config control width fixes
`CONTROL_WIDTH` reduced from 160 px to 136 px in both `SLMConfigSection` and `HologramParamsSection` so controls fit inside the 300 px left column (12 px padding each side → 276 px interior). Resolution X/Y inputs given explicit `width: 65px` to fit beside the `×` separator. Control containers changed from `width: CONTROL_WIDTH` to `flex: 1` so all inputs stretch to the right edge of their bubble, aligning with the Hologram Shift LabelledSlider rows. Preset and Bit Depth selects changed to `width: 100%`.

**Files changed:** `src/components/slm/SLMConfigSection.jsx`, `src/components/slm/HologramParamsSection.jsx`

### No-grating hologram encoding
When no carrier grating is active (`fx = 0` and `fy = 0`), the Bolduc intensity-masking encoding is skipped. Instead, the hologram is amplitude-encoded: `Ψ = A × 2π`, mapping directly to `grey = A × maxGamma`. This allows a pure Gaussian beam to reach grey level 255 at its peak. Bolduc encoding (`encodeExact` / `encodeApproximate`) is still used whenever a non-zero grating is applied.

**File changed:** `src/workers/hologramWorker.js`

### SLM tab renaming
Double-clicking a tab label opens an inline text input. Pressing Enter or clicking away commits the new name; Escape cancels. The label is stored as a separate `tabLabel` field on each SLM in the Zustand store, independent of the preset `name`. New SLMs default their `tabLabel` to the preset name. A `renameSLM(slmId, label)` action was added to the store. Backwards-compatible: persisted states without `tabLabel` fall back to `slm.name`.

**Files changed:** `src/store/useSLMStore.js`, `src/components/layout/SLMTabBar.jsx`

### Mode nicknames
Double-clicking a mode card title opens an inline text input for a custom nickname. When a nickname is set it appears as the primary label; the canonical type name (`Gaussian`, `Lens`, etc.) is shown as a smaller grey suffix. A `setModeNickname(slmId, modeIndex, nickname)` action was added to the store. New modes initialise with `nickname: ''`. Backwards-compatible via the persist merge function.

**Files changed:** `src/store/useSLMStore.js`, `src/components/modes/ModeCard.jsx`

### Tooltips added to Hologram Parameters panel
All parameter labels in `HologramParamsSection` (Wavelength, Gamma, Grating θₓ, Grating θᵧ, Hologram Shift) are now wrapped with `<Tooltip>` using existing tooltip keys. A new `holoShift` entry was added to `tooltips.js`.

**Files changed:** `src/components/slm/HologramParamsSection.jsx`, `src/data/tooltips.js`

## 2026-06-20

### Hologram Parameters panel split from Hardware Config
Wavelength, Gamma, Grating θₓ/θᵧ, and a new Hologram Shift control are moved out of Hardware Config into a new "Hologram Parameters" bubble below it. Hardware Config now contains only Preset, Resolution, Pixel Pitch, and Bit Depth.

**New file:** `src/components/slm/HologramParamsSection.jsx`
**File changed:** `src/components/slm/SLMConfigSection.jsx`, `src/components/slm/SLMPanel.jsx`

### Unit toggles on Hologram Parameters
Every parameter in the new panel has a clickable green toggle badge on the right:
- **Wavelength**: nm ↔ THz (conversion: THz = 299792.458 / λ_nm), default nm
- **Gamma**: bit ↔ % (% = γ / maxGamma × 100, maxGamma = 2^bitDepth − 1), default bit
- **Grating θₓ / θᵧ**: mrad ↔ Hz where Hz = cycles across the screen (Hz_x = mrad × resX × pitchMicron / wavelengthNm), default mrad

### Hologram Shift X/Y controls
Two sliders with number inputs added to Hologram Parameters. They apply a global position offset (in pixels, stored in the Zustand state as `holoShift: { x, y }`) to all modes at render time. Toggle between mm and px (default mm, using pixel pitch for conversion). Slider range is ±half the screen dimension; number input is unbounded.

**Files changed:** `src/store/useSLMStore.js`, `src/workers/hologramWorker.js`, `src/hooks/useHologramCompute.js`, `src/components/slm/SLMExportImport.jsx`

### Display controls in one row
Primary Screen selector, Send to Display, Export, and Import buttons now appear in a single horizontal row below the preview.

**Files changed:** `src/components/slm/SLMDisplayButton.jsx`, `src/components/slm/SLMExportImport.jsx`, `src/components/slm/SLMPanel.jsx`

### Preset no longer overrides wavelength
Selecting a hardware preset now only sets resolution, pixel pitch, and bit depth. Wavelength is left unchanged so it can be set independently of the device choice.

**File changed:** `src/store/useSLMStore.js`

### Lens focal length — unit badge moved to the right
The focal length label was `f (mm)`. It is now `f` with a green `mm` badge on the right, consistent with the hardware config unit badges.

**File changed:** `src/components/modes/params/LensParams.jsx`

### Axicon half angle — deg/rad toggle
- Label changed from `half angle (°)` to `half angle`
- A toggleable green button now appears on the right showing the current angle unit: **deg** or **rad**
- Clicking it converts all displayed values (slider position, number input, min/max) between degrees and radians; the stored value remains in degrees
- Slider range changed from 0.1–10° to **−1.5–1.5°** (or the equivalent ±0.02618 rad)
- The number input is **unbounded** — values outside the slider range can be typed freely

**Files changed:** `src/components/modes/params/AxiconParams.jsx`, `src/components/shared/LabelledSlider.jsx`

### LabelledSlider — new unit display props
- Added `unitLabel` prop: renders a static green badge (non-interactive) in the unit slot — used by the Lens focal length
- Added `enableAngleToggle` prop: adds a clickable deg/rad toggle button with full value conversion — used by the Axicon half angle
- Angle conversion: display = stored_deg × π/180 when in rad mode; `fromDisplay` reverses this before writing to store

**File changed:** `src/components/shared/LabelledSlider.jsx`

### Muted text colour lightened globally
All non-editable, non-interactive text was `#6B7A90` (dark grey-blue). Changed to `#A8B8C8` across the entire UI — roughly 50% brighter while remaining visually distinct from the editable-value white (`#E8EDF3`).

**Files changed:** `src/styles/index.css` (CSS variable `--text-muted`), `src/components/shared/SectionHeader.jsx`, `src/components/shared/LabelledSlider.jsx`, `src/components/shared/Tooltip.jsx`, `src/components/slm/SLMConfigSection.jsx`, `src/components/slm/SLMPreview.jsx`, `src/components/slm/SLMDisplayButton.jsx`, `src/components/modes/ModeCard.jsx`, `src/components/modes/ModeWeightSlider.jsx`, `src/components/modes/ModeStack.jsx`, `src/components/layout/SLMTabBar.jsx`, `src/windows/HologramWindow.jsx`

### Hardware Config panel redesign
New SLM instances now start with the "Custom" preset. When any named preset is selected, Pixel Pitch and Bit Depth become read-only. Controls reordered (Preset → Resolution → Pixel pitch → Bit depth → Gamma → Wavelength → Grating θₓ → Grating θᵧ). All input areas share a fixed 160 px width. Units (μm, nm, mrad) displayed as green badges on the right of each input.

**Files changed:** `src/store/useSLMStore.js`, `src/components/slm/SLMConfigSection.jsx`, `src/data/slmPresets.json`

### Mode stack controls pinned to top; new modes prepend
"+ Add Mode" and "Clear Stack" controls moved above all mode cards. New modes appear at the top of the stack instead of the bottom.

**Files changed:** `src/components/modes/ModeStack.jsx`, `src/store/useSLMStore.js`

### State persistence & Clear Stack button
The Zustand store now uses the `persist` middleware to save hardware config and mode stack to `localStorage` under the key `slm-hologram-studio`.

- **Persisted**: `activeSLMId`, and for each SLM — `id`, `name`, `hardware`, `gratingFrequency`, `gamma`, `encodingMethod`, `modes`
- **Excluded** (transient/non-serialisable): `hologramImageData`, `windowRef`, `greyLevels`, `greyWidth`, `greyHeight`, `importedPixels`, `importedWidth`, `importedHeight`, `isImported` — reset to `null`/`false` on every load
- A custom `merge` function restores excluded fields to their null defaults when rehydrating
- `onRehydrateStorage` advances `nextSLMId` past the highest persisted id so new SLMs never collide

A red "Clear Stack" button appears next to "+ Add Mode" whenever the stack is non-empty; hidden otherwise.

**Files changed:** `src/store/useSLMStore.js`, `src/components/modes/ModeStack.jsx`

### Spatial parameters default to mm; radius range from screen size
`LabelledSlider` now initialises to `'mm'` instead of `'px'`. Beam-radius parameters (`w0`, `scale`, `pupilRadius`) have their slider maximum set dynamically to half the largest screen dimension.

**Files changed:** `src/components/shared/LabelledSlider.jsx`, `GaussianParams`, `LGParams`, `HGParams`, `AiryParams`, `InceGaussianParams`, `ParabolicalParams`, `VectorVortexParams`, `ZernikeParams`

### px/mm unit toggle for all spatial parameters
Every spatial parameter (position offsets, beam waist, scale, pupil radius) now has an independent px/mm toggle badge. The underlying stored value is always in pixels; conversion is display-only.

**Files changed:** `src/components/shared/LabelledSlider.jsx`, all 14 mode params files

### x₀/y₀ position controls added to all modes
Every mode now exposes x₀ and y₀ offsets to place the mode centre anywhere on the SLM aperture. Slider range is ±resX/2 and ±resY/2; `unlimitedInput` allows typing beyond the slider range.

**Files changed:** `src/data/tooltips.js`, `src/components/shared/LabelledSlider.jsx`, all 14 mode params files

## 2026-06-19

### Branding & green colour scheme
- Added `favicon.ico` and `logo.png`; TopBar updated with clickable logo linking to `https://lukasscarfe.com`
- Replaced teal accent `#00C9A7` → `#22c55e` (green-500) and purple `#7B61FF` → `#16a34a` (green-700) across all UI files

**Files changed:** `public/favicon.ico`, `public/logo.png`, `index.html`, `src/styles/index.css`, `src/components/layout/TopBar.jsx`, `src/components/layout/SLMTabBar.jsx`, `src/components/modes/ModeSelector.jsx`, `src/components/shared/LabelledSlider.jsx`, `src/components/slm/SLMDisplayButton.jsx`, `src/components/slm/SLMPreview.jsx`, `src/windows/HologramWindow.jsx`
