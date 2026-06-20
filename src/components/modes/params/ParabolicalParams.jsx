import { LabelledSlider } from '../../shared/LabelledSlider.jsx';
import { useSLMStore } from '../../../store/useSLMStore.js';

const DEFAULTS = { order: 0, w0: 100, x0: 0, y0: 0 };

export function ParabolicalParams({ slmId, modeIndex, params }) {
  const updateModeParam = useSLMStore((s) => s.updateModeParam);
  const slm = useSLMStore((s) => s.slms.find((sl) => sl.id === slmId));
  const resX = slm?.hardware?.resX ?? 1920;
  const resY = slm?.hardware?.resY ?? 1080;
  const maxR = Math.max(resX, resY) / 2;
  const pixelPitch = slm?.hardware?.pixelPitchMicron ?? 8;
  const p = { ...DEFAULTS, ...params };
  return (
    <div>
      <LabelledSlider
        label="order"
        data-testid="parabolic-order"
        value={p.order}
        onChange={(v) => updateModeParam(slmId, modeIndex, 'order', Math.round(v))}
        min={0}
        max={8}
        step={1}
      />
      <LabelledSlider
        label="w₀"
        value={p.w0}
        onChange={(v) => updateModeParam(slmId, modeIndex, 'w0', v)}
        min={10}
        max={maxR}
        step={1}
        unlimitedInput
        enableUnitToggle
        pixelPitch={pixelPitch}
      />
      <LabelledSlider label="x₀" tooltipKey="positionOffsetX" value={p.x0} onChange={(v) => updateModeParam(slmId, modeIndex, 'x0', v)} min={-resX / 2} max={resX / 2} step={1} unlimitedInput enableUnitToggle pixelPitch={pixelPitch} />
      <LabelledSlider label="y₀" tooltipKey="positionOffsetY" value={p.y0} onChange={(v) => updateModeParam(slmId, modeIndex, 'y0', v)} min={-resY / 2} max={resY / 2} step={1} unlimitedInput enableUnitToggle pixelPitch={pixelPitch} />
    </div>
  );
}
export const parabolicalDefaults = DEFAULTS;
