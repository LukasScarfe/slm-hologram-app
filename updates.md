# SLM Hologram Studio — Update Log

## 2026-06-20 — Add Mode Controls Pinned to Top; New Modes Prepend

- "+ Add Mode" and "Clear Stack" controls moved to the top of the mode stack, above all mode cards, so they are always accessible without scrolling
- New modes are now prepended to the top of the stack instead of appended to the bottom

**Files changed:** `src/components/modes/ModeStack.jsx`, `src/store/useSLMStore.js`

## 2026-06-20 — State Persistence & Clear Stack Button

### State persistence across page refreshes
The Zustand store now uses the `persist` middleware (`zustand/middleware`) to save hardware config and mode stack to `localStorage` under the key `slm-hologram-studio`.

- **Persisted**: `activeSLMId`, and for each SLM — `id`, `name`, `hardware`, `gratingFrequency`, `gamma`, `encodingMethod`, `modes`
- **Excluded** (transient/non-serialisable): `hologramImageData`, `windowRef`, `greyLevels`, `greyWidth`, `greyHeight`, `importedPixels`, `importedWidth`, `importedHeight`, `isImported` — these are reset to `null`/`false` on every load
- A custom `merge` function restores excluded fields to their null defaults when rehydrating, preventing undefined field access
- `onRehydrateStorage` advances `nextSLMId` past the highest persisted SLM id so new SLMs never collide with persisted ones

**File changed:** `src/store/useSLMStore.js`

### Clear Stack button
A red "Clear Stack" button now appears next to the "+ Add Mode" dropdown whenever the mode stack contains at least one mode. Clicking it removes all modes from the active SLM's stack in one action.

- New `clearModes(slmId)` action added to the store
- Button is hidden when the stack is empty

**Files changed:** `src/store/useSLMStore.js`, `src/components/modes/ModeStack.jsx`

## 2026-06-20 — Unit Default mm; Radius Slider Range from Screen Resolution

### Default unit
- `LabelledSlider` now initialises `unit` to `'mm'` instead of `'px'` — all spatial parameters open in mm mode by default

### Radius parameter slider range
Parameters representing a physical radius (`w0`, `scale`, `pupilRadius`) now have their slider maximum set dynamically to `Math.max(resX, resY) / 2` (half the largest screen dimension), read from the SLM hardware config at runtime. For a 1920×1080 SLM this gives a 960 px / 7.68 mm upper bound. The number text box for these parameters has no upper limit (`unlimitedInput`).

**Files updated:** `GaussianParams`, `LGParams`, `HGParams`, `AiryParams`, `InceGaussianParams`, `ParabolicalParams`, `VectorVortexParams`, `ZernikeParams`

## 2026-06-20 — px/mm Unit Toggle for Spatial Parameters

### Overview
Every spatial parameter across all mode types now has an independent px/mm toggle button. Clicking the badge next to a parameter's number input switches that parameter's display between pixels and millimetres. The underlying stored value is always in pixels; conversion is display-only and uses the SLM pixel pitch from hardware config.

### Design
- Toggle state is per-slider (each `LabelledSlider` instance manages its own `unit` state independently)
- Values are stored in pixels in Zustand; the slider, number input, and min/max all convert on the fly
- When `unlimitedInput` is also set (x₀, y₀), the number input accepts any value in whichever unit is active
- Parameters that are dimensionless, angular, or frequency-based (l, p, n, m, charge, order, halfAngleDeg, kr, q, eccentricity, amplitude) do not receive the toggle

### Changes

**`src/components/shared/LabelledSlider.jsx`**
- Added `enableUnitToggle` boolean prop and `pixelPitch` prop (µm)
- When both are set, a clickable `px`/`mm` badge renders after the number input
- All displayed values (slider position, number input, min, max, step) convert to mm when active
- `fromDisplay` converts the user's input back to pixels before calling `onChange`

**All 14 mode params files** (`GaussianParams`, `LGParams`, `HGParams`, `BesselParams`, `AiryParams`, `AxiconParams`, `SpiralPhaseParams`, `LensParams`, `InceGaussianParams`, `MatthieuParams`, `ParabolicalParams`, `VectorVortexParams`, `ZernikeParams`, `CustomEquationParams`)
- Now read `pixelPitchMicron` from the SLM hardware config alongside `resX`/`resY`
- Spatial parameters receive `enableUnitToggle pixelPitch={pixelPitch}`:
  - `w0` (beam waist) — Gaussian, LG, HG, InceGaussian, Parabolical, VectorVortex
  - `x0`, `y0` (position offsets) — all modes
  - `scale` — AiryBeam
  - `pupilRadius` — Zernike
- Non-spatial parameters (indices, angles, frequencies, ratios) are unchanged

## 2026-06-20 — x₀/y₀ Position Controls for All Modes

### Overview
Every mode type now exposes x₀ and y₀ position offset controls, allowing the mode centre to be placed anywhere on the SLM aperture.

### Changes

**`src/data/tooltips.js`**
- Added `positionOffsetX` tooltip: describes the horizontal pixel shift x₀
- Added `positionOffsetY` tooltip: describes the vertical pixel shift y₀

**`src/components/shared/LabelledSlider.jsx`**
- Added `unlimitedInput` boolean prop. When `true`, the embedded `NumberInput` receives no `min`/`max` constraints, allowing the user to type any number while the slider thumb remains clamped to its range.

**`src/components/modes/params/GaussianParams.jsx`**
**`src/components/modes/params/LGParams.jsx`**
**`src/components/modes/params/LensParams.jsx`**
- Updated existing x₀/y₀ sliders: slider range changed from ±200 to ±resX/2 / ±resY/2 (read from the SLM hardware config at runtime)
- Added `tooltipKey="positionOffsetX/Y"` and `unlimitedInput` to x₀/y₀ sliders

**`src/components/modes/params/HGParams.jsx`**
**`src/components/modes/params/BesselParams.jsx`**
**`src/components/modes/params/AiryParams.jsx`**
**`src/components/modes/params/AxiconParams.jsx`**
**`src/components/modes/params/SpiralPhaseParams.jsx`**
**`src/components/modes/params/InceGaussianParams.jsx`**
**`src/components/modes/params/MatthieuParams.jsx`**
**`src/components/modes/params/ParabolicalParams.jsx`**
**`src/components/modes/params/VectorVortexParams.jsx`**
- Added x₀ and y₀ `LabelledSlider` controls (these params existed in DEFAULTS and physics but had no UI)
- Slider range: −resX/2 to +resX/2 for x₀, −resY/2 to +resY/2 for y₀ (e.g. ±960 / ±540 for a 1920×1080 SLM)
- Tooltip on hover via `positionOffsetX` / `positionOffsetY` keys
- `unlimitedInput` allows typing values outside the slider range

**`src/components/modes/params/ZernikeParams.jsx`**
**`src/components/modes/params/CustomEquationParams.jsx`**
- Added `x0: 0, y0: 0` to DEFAULTS (physics already supported these parameters)
- Added x₀/y₀ sliders with the same range (±resX/2, ±resY/2), tooltip, and unlimited input as above

## 2026-06-19 — Branding & Green Colour Scheme

### Favicon
- Added `favicon.ico` to `slm-hologram-app/public/`
- Updated `index.html` to reference the new `.ico` file (replaces previous `favicon.svg`)

### Logo header (TopBar)
- Added `logo.png` to `slm-hologram-app/public/`
- Replaced the plain text brand in `TopBar.jsx` with a clickable logo + text combo:
  - Logo image (`logo.png`, 28 px tall) links to `https://lukasscarfe.com` (opens in new tab)
  - "SLM Hologram Studio" text displayed to the right of the logo

### Green colour scheme
- Replaced teal accent `#00C9A7` → `#22c55e` (green-500) across all UI files:
  - `src/styles/index.css` (`--accent` CSS variable)
  - `src/components/layout/TopBar.jsx`
  - `src/components/layout/SLMTabBar.jsx` (active tab underline + Add SLM button)
  - `src/components/modes/ModeSelector.jsx` (mode dropdown border)
  - `src/components/shared/LabelledSlider.jsx` (slider track fill + thumb)
  - `src/components/slm/SLMDisplayButton.jsx` ("Send to Display" button)
  - `src/components/slm/SLMPreview.jsx` (active view-mode button)
  - `src/windows/HologramWindow.jsx` (fullscreen SVG icon)
- Replaced purple secondary accent `#7B61FF` → `#16a34a` (green-700):
  - `src/styles/index.css` (`--accent-warm` CSS variable)
  - `src/components/slm/SLMDisplayButton.jsx` ("Activate Fullscreen" button)
