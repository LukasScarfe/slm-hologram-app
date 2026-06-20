import { LabelledSlider } from '../../shared/LabelledSlider.jsx';
import { useSLMStore } from '../../../store/useSLMStore.js';

const DEFAULTS = { l: 1, x0: 0, y0: 0 };

export function SpiralPhaseParams({ slmId, modeIndex, params }) {
  const updateModeParam = useSLMStore((s) => s.updateModeParam);
  const slm = useSLMStore((s) => s.slms.find((sl) => sl.id === slmId));
  const resX = slm?.hardware?.resX ?? 1920;
  const resY = slm?.hardware?.resY ?? 1080;
  const pixelPitch = slm?.hardware?.pixelPitchMicron ?? 8;
  const p = { ...DEFAULTS, ...params };
  return (
    <div>
      <LabelledSlider
        label="l"
        data-testid="spiral-l"
        value={p.l}
        onChange={(v) => updateModeParam(slmId, modeIndex, 'l', Math.round(v))}
        min={-10}
        max={10}
        step={1}
      />
      <LabelledSlider label="x₀" tooltipKey="positionOffsetX" value={p.x0} onChange={(v) => updateModeParam(slmId, modeIndex, 'x0', v)} min={-resX / 2} max={resX / 2} step={1} unlimitedInput enableUnitToggle pixelPitch={pixelPitch} />
      <LabelledSlider label="y₀" tooltipKey="positionOffsetY" value={p.y0} onChange={(v) => updateModeParam(slmId, modeIndex, 'y0', v)} min={-resY / 2} max={resY / 2} step={1} unlimitedInput enableUnitToggle pixelPitch={pixelPitch} />
    </div>
  );
}
export const spiralPhaseDefaults = DEFAULTS;
