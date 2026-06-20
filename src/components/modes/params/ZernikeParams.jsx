import { LabelledSlider } from '../../shared/LabelledSlider.jsx';
import { useSLMStore } from '../../../store/useSLMStore.js';

const DEFAULTS = { n: 2, m: 0, amplitude: 1.0, pupilRadius: 100, x0: 0, y0: 0 };

export function ZernikeParams({ slmId, modeIndex, params }) {
  const updateModeParam = useSLMStore((s) => s.updateModeParam);
  const slm = useSLMStore((s) => s.slms.find((sl) => sl.id === slmId));
  const resX = slm?.hardware?.resX ?? 1920;
  const resY = slm?.hardware?.resY ?? 1080;
  const maxR = Math.max(resX, resY) / 2;
  const pixelPitch = slm?.hardware?.pixelPitchMicron ?? 8;
  const p = { ...DEFAULTS, ...params };
  return (
    <div>
      <LabelledSlider label="n" tooltipKey="zernikeN" value={p.n} onChange={(v) => updateModeParam(slmId, modeIndex, 'n', Math.round(v))} min={0} max={10} step={1} />
      <LabelledSlider label="m" tooltipKey="zernikeM" value={p.m} onChange={(v) => updateModeParam(slmId, modeIndex, 'm', Math.round(v))} min={-10} max={10} step={1} />
      <LabelledSlider label="amplitude" value={p.amplitude} onChange={(v) => updateModeParam(slmId, modeIndex, 'amplitude', v)} min={-5} max={5} step={0.1} />
      <LabelledSlider label="pupil R" value={p.pupilRadius} onChange={(v) => updateModeParam(slmId, modeIndex, 'pupilRadius', v)} min={1} max={maxR} step={1} unlimitedInput enableUnitToggle pixelPitch={pixelPitch} />
      <LabelledSlider label="x₀" tooltipKey="positionOffsetX" value={p.x0} onChange={(v) => updateModeParam(slmId, modeIndex, 'x0', v)} min={-resX / 2} max={resX / 2} step={1} unlimitedInput enableUnitToggle pixelPitch={pixelPitch} />
      <LabelledSlider label="y₀" tooltipKey="positionOffsetY" value={p.y0} onChange={(v) => updateModeParam(slmId, modeIndex, 'y0', v)} min={-resY / 2} max={resY / 2} step={1} unlimitedInput enableUnitToggle pixelPitch={pixelPitch} />
    </div>
  );
}
export const zernikeDefaults = DEFAULTS;
