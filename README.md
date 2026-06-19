# SLM Hologram Studio

A browser-based tool for optical physics researchers to design, preview, and display spatial light modulator (SLM) holograms in real time — no server required.

Implements the exact Bolduc et al. (2013) single-phase-only encoding method, which reproduces both the amplitude and phase of the desired field with zero error.

## Features

- **14 optical mode types** — Gaussian, Laguerre-Gaussian, Hermite-Gaussian, Bessel, Airy, Ince-Gaussian, Mathieu, Parabolic, Vector Vortex, Axicon, Spiral Phase, Lens, Zernike, and Custom Equation
- **Real-time hologram preview** — four view modes: Hologram, Field (HSV), Intensity, Phase
- **Multi-SLM support** — independent mode stacks, parameters, and display windows per SLM
- **Pop-out full-screen display** — send holograms to a secondary monitor via the Window Management API
- **Export/Import** — PNG (8-bit & 16-bit), TIFF (32-bit), BMP, CSV, NPY, Raw Binary, ZIP

## Usage

### Running locally

```
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

1. Select an SLM hardware preset (or configure custom parameters).
2. Add one or more optical mode layers using **+ Add Mode**.
3. Adjust mode parameters and weights — the hologram preview updates in real time.
4. Click **▸ Send to Display** to open the hologram on a secondary monitor.
5. Use **Export** to download the hologram in your preferred file format.

### Running tests

```
# Unit tests (physics library)
npx vitest run tests/unit/

# End-to-end tests (UI + export/import)
npx playwright test
```

### Building for production

```
npm run build
```

The built app is in `dist/`, served at the `/slm-hologram-app/` base path.

### Deploying to GitHub Pages

```
npm run deploy
```

## Physics reference

Bolduc, N., Bent, N., Santamato, E., Karimi, E., & Boyd, R. W. (2013).  
*Exact solution to simultaneous intensity and phase encryption with a single phase-only hologram.*  
**Optics Letters, 38**(18), 3546–3549.

## Technology

React 19 · Vite · Zustand · Tailwind CSS · Radix UI · WebGL 2 (OffscreenCanvas) · math.js · Playwright · Vitest
