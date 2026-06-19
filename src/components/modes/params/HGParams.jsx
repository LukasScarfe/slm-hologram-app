import { LabelledSlider } from '../../shared/LabelledSlider.jsx';
import { useSLMStore } from '../../../store/useSLMStore.js';

const DEFAULTS = { m: 1, n: 0, w0: 100, x0: 0, y0: 0 };

export function HGParams({ slmId, modeIndex, params }) {
  const updateModeParam = useSLMStore((s) => s.updateModeParam);
  const p = { ...DEFAULTS, ...params };
  return (
    <div>
      <LabelledSlider label="m" value={p.m} onChange={(v) => updateModeParam(slmId, modeIndex, 'm', Math.round(v))} min={0} max={10} step={1} />
      <LabelledSlider label="n" value={p.n} onChange={(v) => updateModeParam(slmId, modeIndex, 'n', Math.round(v))} min={0} max={10} step={1} />
      <LabelledSlider label="w₀" tooltipKey="beamWaist" value={p.w0} onChange={(v) => updateModeParam(slmId, modeIndex, 'w0', v)} min={1} max={500} step={1} />
    </div>
  );
}
export const hgDefaults = DEFAULTS;
