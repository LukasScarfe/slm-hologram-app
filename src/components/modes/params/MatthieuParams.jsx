import { LabelledSlider } from '../../shared/LabelledSlider.jsx';
import { useSLMStore } from '../../../store/useSLMStore.js';

const DEFAULTS = { m: 0, q: 1.0, kr: 0.1, x0: 0, y0: 0 };

export function MatthieuParams({ slmId, modeIndex, params }) {
  const updateModeParam = useSLMStore((s) => s.updateModeParam);
  const slm = useSLMStore((s) => s.slms.find((sl) => sl.id === slmId));
  const resX = slm?.hardware?.resX ?? 1920;
  const resY = slm?.hardware?.resY ?? 1080;
  const pixelPitch = slm?.hardware?.pixelPitchMicron ?? 8;
  const p = { ...DEFAULTS, ...params };
  return (
    <div>
      <LabelledSlider
        label="m"
        data-testid="mathieu-m"
        value={p.m}
        onChange={(v) => updateModeParam(slmId, modeIndex, 'm', Math.round(v))}
        min={0}
        max={10}
        step={1}
      />
      <LabelledSlider
        label="q"
        value={p.q}
        onChange={(v) => updateModeParam(slmId, modeIndex, 'q', v)}
        min={0}
        max={10}
        step={0.1}
      />
      <LabelledSlider
        label="kr"
        value={p.kr}
        onChange={(v) => updateModeParam(slmId, modeIndex, 'kr', v)}
        min={0.01}
        max={1}
        step={0.01}
      />
      <LabelledSlider label="x₀" tooltipKey="positionOffsetX" value={p.x0} onChange={(v) => updateModeParam(slmId, modeIndex, 'x0', v)} min={-resX / 2} max={resX / 2} step={1} unlimitedInput enableUnitToggle pixelPitch={pixelPitch} />
      <LabelledSlider label="y₀" tooltipKey="positionOffsetY" value={p.y0} onChange={(v) => updateModeParam(slmId, modeIndex, 'y0', v)} min={-resY / 2} max={resY / 2} step={1} unlimitedInput enableUnitToggle pixelPitch={pixelPitch} />
    </div>
  );
}
export const matthieuDefaults = DEFAULTS;
