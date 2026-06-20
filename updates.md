# SLM Hologram Studio — Update Log

## 2026-06-20

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
