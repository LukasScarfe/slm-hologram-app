import { LabelledSlider } from '../../shared/LabelledSlider.jsx';
import { useSLMStore } from '../../../store/useSLMStore.js';

const DEFAULTS = { focalLengthMm: 500, x0: 0, y0: 0 };

export function LensParams({ slmId, modeIndex, params }) {
  const updateModeParam = useSLMStore((s) => s.updateModeParam);
  const p = { ...DEFAULTS, ...params };
  return (
    <div>
      <LabelledSlider label="f (mm)" tooltipKey="lensFocalLength" value={p.focalLengthMm} onChange={(v) => updateModeParam(slmId, modeIndex, 'focalLengthMm', v)} min={-5000} max={5000} step={10} />
      <LabelledSlider label="x₀" value={p.x0} onChange={(v) => updateModeParam(slmId, modeIndex, 'x0', v)} min={-200} max={200} step={1} />
      <LabelledSlider label="y₀" value={p.y0} onChange={(v) => updateModeParam(slmId, modeIndex, 'y0', v)} min={-200} max={200} step={1} />
    </div>
  );
}
export const lensDefaults = DEFAULTS;
