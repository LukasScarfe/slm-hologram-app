import { LabelledSlider } from '../../shared/LabelledSlider.jsx';
import { useSLMStore } from '../../../store/useSLMStore.js';

const DEFAULTS = { scale: 30, x0: 0, y0: 0 };

export function AiryParams({ slmId, modeIndex, params }) {
  const updateModeParam = useSLMStore((s) => s.updateModeParam);
  const p = { ...DEFAULTS, ...params };
  return (
    <div>
      <LabelledSlider
        label="scale"
        data-testid="airy-scale"
        value={p.scale}
        onChange={(v) => updateModeParam(slmId, modeIndex, 'scale', v)}
        min={1}
        max={200}
        step={1}
      />
    </div>
  );
}
export const airyDefaults = DEFAULTS;
