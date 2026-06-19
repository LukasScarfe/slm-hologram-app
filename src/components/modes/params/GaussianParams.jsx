import { LabelledSlider } from '../../shared/LabelledSlider.jsx';
import { useSLMStore } from '../../../store/useSLMStore.js';

const DEFAULTS = { w0: 100, x0: 0, y0: 0 };

export function GaussianParams({ slmId, modeIndex, params }) {
  const updateModeParam = useSLMStore((s) => s.updateModeParam);
  const p = { ...DEFAULTS, ...params };

  return (
    <div>
      <LabelledSlider label="w₀" tooltipKey="beamWaist" value={p.w0} onChange={(v) => updateModeParam(slmId, modeIndex, 'w0', v)} min={1} max={500} step={1} />
      <LabelledSlider label="x₀" value={p.x0} onChange={(v) => updateModeParam(slmId, modeIndex, 'x0', v)} min={-200} max={200} step={1} />
      <LabelledSlider label="y₀" value={p.y0} onChange={(v) => updateModeParam(slmId, modeIndex, 'y0', v)} min={-200} max={200} step={1} />
    </div>
  );
}
export const gaussianDefaults = DEFAULTS;
