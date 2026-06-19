import { LabelledSlider } from '../../shared/LabelledSlider.jsx';
import { useSLMStore } from '../../../store/useSLMStore.js';

const DEFAULTS = { order: 0, w0: 100, x0: 0, y0: 0 };

export function ParabolicalParams({ slmId, modeIndex, params }) {
  const updateModeParam = useSLMStore((s) => s.updateModeParam);
  const p = { ...DEFAULTS, ...params };
  return (
    <div>
      <LabelledSlider
        label="order"
        data-testid="parabolic-order"
        value={p.order}
        onChange={(v) => updateModeParam(slmId, modeIndex, 'order', Math.round(v))}
        min={0}
        max={8}
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
export const parabolicalDefaults = DEFAULTS;
