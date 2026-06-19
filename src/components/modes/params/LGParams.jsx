import { LabelledSlider } from '../../shared/LabelledSlider.jsx';
import { useSLMStore } from '../../../store/useSLMStore.js';

const DEFAULTS = { l: 0, p: 0, w0: 100, x0: 0, y0: 0 };

export function LGParams({ slmId, modeIndex, params }) {
  const updateModeParam = useSLMStore((s) => s.updateModeParam);
  const pr = { ...DEFAULTS, ...params };

  return (
    <div>
      <LabelledSlider
        label="l"
        tooltipKey="lgL"
        value={pr.l}
        onChange={(v) => updateModeParam(slmId, modeIndex, 'l', Math.round(v))}
        min={-10}
        max={10}
        step={1}
        data-testid="lg-l-slider"
        labelTestId="lg-l-label"
      />
      <LabelledSlider
        label="p"
        tooltipKey="lgP"
        value={pr.p}
        onChange={(v) => updateModeParam(slmId, modeIndex, 'p', Math.round(v))}
        min={0}
        max={10}
        step={1}
        data-testid="lg-p-slider"
        labelTestId="lg-p-label"
      />
      <LabelledSlider label="w₀" tooltipKey="beamWaist" value={pr.w0} onChange={(v) => updateModeParam(slmId, modeIndex, 'w0', v)} min={1} max={500} step={1} />
      <LabelledSlider label="x₀" value={pr.x0} onChange={(v) => updateModeParam(slmId, modeIndex, 'x0', v)} min={-200} max={200} step={1} />
      <LabelledSlider label="y₀" value={pr.y0} onChange={(v) => updateModeParam(slmId, modeIndex, 'y0', v)} min={-200} max={200} step={1} />
    </div>
  );
}
export const lgDefaults = DEFAULTS;
