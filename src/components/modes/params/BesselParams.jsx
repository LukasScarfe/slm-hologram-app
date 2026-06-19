import { LabelledSlider } from '../../shared/LabelledSlider.jsx';
import { useSLMStore } from '../../../store/useSLMStore.js';

const DEFAULTS = { n: 0, kr: 0.1, x0: 0, y0: 0 };

export function BesselParams({ slmId, modeIndex, params }) {
  const updateModeParam = useSLMStore((s) => s.updateModeParam);
  const p = { ...DEFAULTS, ...params };
  return (
    <div>
      <LabelledSlider label="n" value={p.n} onChange={(v) => updateModeParam(slmId, modeIndex, 'n', Math.round(v))} min={-5} max={5} step={1} />
      <LabelledSlider label="kᵣ" value={p.kr} onChange={(v) => updateModeParam(slmId, modeIndex, 'kr', v)} min={0.01} max={1} step={0.01} />
    </div>
  );
}
export const besselDefaults = DEFAULTS;
