# SLM Hologram Studio — What's New

## 2026-06-21
- **Hologram preview larger.** Default preview width increased to 720 px to better match the height of the config panels.
- **Hardware Config controls fit properly.** Input widths reduced so Preset, Resolution, and Bit Depth no longer overflow the panel. All controls now stretch to the right edge of their bubble, aligned with the Hologram Parameters panel.
- **No-grating hologram encoding changed.** Without a carrier grating, holograms are now amplitude-encoded (grey = A × max) so a Gaussian beam reaches full grey level 255. Bolduc/carrier encoding is only used when a grating is applied.
- **Rename SLM tabs.** Double-click any tab to give it a custom name. Tab names default to the selected preset name.
- **Mode nicknames.** Double-click a mode card title to add a nickname. The type name appears as a small grey suffix so the mode type is still visible.

## 2026-06-20
- **Hardware Config simplified.** Now shows only Preset, Resolution, Pixel Pitch, and Bit Depth.
- **New "Hologram Parameters" panel** with Wavelength (nm/THz toggle), Gamma (bit/% toggle), Grating θₓ and θᵧ (mrad/Hz toggle), and Hologram Shift X/Y sliders (mm/px toggle). The shift moves all modes together on the SLM.
- **Display controls in one row.** Screen selector, Send to Display, Export, and Import are now side by side.
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
