import { LabelledSlider } from '../../shared/LabelledSlider.jsx';
import { useSLMStore } from '../../../store/useSLMStore.js';

const DEFAULTS = { charge: 1, w0: 100, x0: 0, y0: 0 };

export function VectorVortexParams({ slmId, modeIndex, params }) {
  const updateModeParam = useSLMStore((s) => s.updateModeParam);
  const p = { ...DEFAULTS, ...params };
  return (
    <div>
      <LabelledSlider
        label="charge"
        data-testid="vector-charge"
        value={p.charge}
        onChange={(v) => updateModeParam(slmId, modeIndex, 'charge', Math.round(v))}
        min={-6}
        max={6}
        step={1}
      />
      <LabelledSlider
        label="w₀"
        value={p.w0}
        onChange={(v) => updateModeParam(slmId, modeIndex, 'w0', v)}
        min={10}
        max={500}
        step={1}
      />
    </div>
  );
}
export const vectorVortexDefaults = DEFAULTS;
