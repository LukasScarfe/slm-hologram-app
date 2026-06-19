import { LabelledSlider } from '../../shared/LabelledSlider.jsx';
import { useSLMStore } from '../../../store/useSLMStore.js';

const DEFAULTS = { halfAngleDeg: 1.0, x0: 0, y0: 0 };

export function AxiconParams({ slmId, modeIndex, params }) {
  const updateModeParam = useSLMStore((s) => s.updateModeParam);
  const p = { ...DEFAULTS, ...params };
  return (
    <div>
      <LabelledSlider
        label="half angle (°)"
        data-testid="axicon-angle"
        value={p.halfAngleDeg}
        onChange={(v) => updateModeParam(slmId, modeIndex, 'halfAngleDeg', v)}
        min={0.1}
        max={10}
        step={0.1}
      />
    </div>
  );
}
export const axiconDefaults = DEFAULTS;
