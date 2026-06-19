import { LabelledSlider } from '../../shared/LabelledSlider.jsx';
import { useSLMStore } from '../../../store/useSLMStore.js';

const DEFAULTS = { l: 1, x0: 0, y0: 0 };

export function SpiralPhaseParams({ slmId, modeIndex, params }) {
  const updateModeParam = useSLMStore((s) => s.updateModeParam);
  const p = { ...DEFAULTS, ...params };
  return (
    <div>
      <LabelledSlider
        label="l"
        data-testid="spiral-l"
        value={p.l}
        onChange={(v) => updateModeParam(slmId, modeIndex, 'l', Math.round(v))}
        min={-10}
        max={10}
        step={1}
      />
    </div>
  );
}
export const spiralPhaseDefaults = DEFAULTS;
