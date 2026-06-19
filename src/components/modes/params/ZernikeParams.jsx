import { LabelledSlider } from '../../shared/LabelledSlider.jsx';
import { useSLMStore } from '../../../store/useSLMStore.js';

const DEFAULTS = { n: 2, m: 0, amplitude: 1.0, pupilRadius: 100 };

export function ZernikeParams({ slmId, modeIndex, params }) {
  const updateModeParam = useSLMStore((s) => s.updateModeParam);
  const p = { ...DEFAULTS, ...params };
  return (
    <div>
      <LabelledSlider label="n" tooltipKey="zernikeN" value={p.n} onChange={(v) => updateModeParam(slmId, modeIndex, 'n', Math.round(v))} min={0} max={10} step={1} />
      <LabelledSlider label="m" tooltipKey="zernikeM" value={p.m} onChange={(v) => updateModeParam(slmId, modeIndex, 'm', Math.round(v))} min={-10} max={10} step={1} />
      <LabelledSlider label="amplitude" value={p.amplitude} onChange={(v) => updateModeParam(slmId, modeIndex, 'amplitude', v)} min={-5} max={5} step={0.1} />
      <LabelledSlider label="pupil R" value={p.pupilRadius} onChange={(v) => updateModeParam(slmId, modeIndex, 'pupilRadius', v)} min={1} max={500} step={1} />
    </div>
  );
}
export const zernikeDefaults = DEFAULTS;
