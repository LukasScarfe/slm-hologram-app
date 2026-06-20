# SLM Hologram Studio — What's New

## 2026-06-20
- **Preset no longer changes wavelength.** Switching presets only updates resolution, pixel pitch, and bit depth — wavelength stays as you set it.
- **Lens:** focal length unit badge moved to the right in green, matching the rest of the UI.
- **Axicon:** half-angle slider now runs −1.5 to 1.5°, number input is unbounded, and a toggleable **deg/rad** button appears on the right.
- **Labels lightened:** all non-editable text is noticeably lighter — closer to white.
- **Hardware Config redesigned:** default preset is now "Custom". Pixel Pitch and Bit Depth lock to read-only when a named preset is selected. Controls reordered for clarity. All inputs are the same width. Units (μm, nm, mrad) shown as green badges on the right.
- **Mode stack:** "+ Add Mode" and "Clear Stack" controls pinned to the top. New modes appear at the top of the stack.
- **State saved across refreshes:** hardware config and mode stack persist in the browser. A "Clear Stack" button appears when the stack is not empty.
- **Spatial parameters default to mm.** Beam-radius sliders scale their maximum to the SLM screen size.
- **px/mm toggle on all spatial parameters.** Click the badge next to any position or size control to switch between pixels and millimetres.
- **x₀/y₀ position controls added to all modes.** Every mode can now be centred anywhere on the SLM aperture.

## 2026-06-19
- **Branding:** logo and favicon added. Colour scheme switched from teal to green.
