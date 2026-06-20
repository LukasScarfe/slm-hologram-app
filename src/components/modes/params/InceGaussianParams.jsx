import { LabelledSlider } from '../../shared/LabelledSlider.jsx';
import { useSLMStore } from '../../../store/useSLMStore.js';

const DEFAULTS = { p: 2, m: 0, w0: 100, eccentricity: 1.0, x0: 0, y0: 0 };

export function InceGaussianParams({ slmId, modeIndex, params }) {
  const updateModeParam = useSLMStore((s) => s.updateModeParam);
  const slm = useSLMStore((s) => s.slms.find((sl) => sl.id === slmId));
  const resX = slm?.hardware?.resX ?? 1920;
  const resY = slm?.hardware?.resY ?? 1080;
  const maxR = Math.max(resX, resY) / 2;
  const pixelPitch = slm?.hardware?.pixelPitchMicron ?? 8;
  const pr = { ...DEFAULTS, ...params };
  return (
    <div>
      <LabelledSlider
        label="p"
        data-testid="ince-p"
        value={pr.p}
        onChange={(v) => updateModeParam(slmId, modeIndex, 'p', Math.round(v))}
        min={0}
        max={10}
        step={1}
      />
      <LabelledSlider
        label="m"
        data-testid="ince-m"
        value={pr.m}
        onChange={(v) => updateModeParam(slmId, modeIndex, 'm', Math.round(v))}
        min={0}
        max={10}
        step={1}
      />
      <LabelledSlider
        label="w₀"
        value={pr.w0}
        onChange={(v) => updateModeParam(slmId, modeIndex, 'w0', v)}
        min={10}
        max={maxR}
        step={1}
        unlimitedInput
        enableUnitToggle
        pixelPitch={pixelPitch}
      />
      <LabelledSlider
        label="eccentricity"
        value={pr.eccentricity}
        onChange={(v) => updateModeParam(slmId, modeIndex, 'eccentricity', v)}
        min={0.1}
        max={5}
        step={0.1}
      />
      <LabelledSlider label="x₀" tooltipKey="positionOffsetX" value={pr.x0} onChange={(v) => updateModeParam(slmId, modeIndex, 'x0', v)} min={-resX / 2} max={resX / 2} step={1} unlimitedInput enableUnitToggle pixelPitch={pixelPitch} />
      <LabelledSlider label="y₀" tooltipKey="positionOffsetY" value={pr.y0} onChange={(v) => updateModeParam(slmId, modeIndex, 'y0', v)} min={-resY / 2} max={resY / 2} step={1} unlimitedInput enableUnitToggle pixelPitch={pixelPitch} />
    </div>
  );
}
export const inceGaussianDefaults = DEFAULTS;
