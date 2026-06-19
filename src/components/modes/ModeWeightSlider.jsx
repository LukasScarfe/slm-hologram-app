import { LabelledSlider } from '../shared/LabelledSlider.jsx';
import { NumberInput } from '../shared/NumberInput.jsx';
import { Tooltip } from '../shared/Tooltip.jsx';
import { useSLMStore } from '../../store/useSLMStore.js';

export function ModeWeightSlider({ slmId, modeIndex, weight, phaseOffset }) {
  const updateModeWeight = useSLMStore((s) => s.updateModeWeight);
  const updateModePhaseOffset = useSLMStore((s) => s.updateModePhaseOffset);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Tooltip tooltipKey="modeWeight">
          <span
            data-testid="mode-weight-label"
            data-tooltip-key="modeWeight"
            style={{ color: '#6B7A90', fontSize: '13px', minWidth: '60px' }}
          >
            Weight
          </span>
        </Tooltip>
        <LabelledSlider
          label=""
          numberInputAriaLabel="Mode weight"
          value={weight}
          onChange={(v) => updateModeWeight(slmId, modeIndex, v)}
          min={0}
          max={1}
          step={0.01}
          data-testid="mode-weight-slider"
          numberInputTestId="mode-weight-input"
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Tooltip tooltipKey="modePhaseOffset">
          <span
            data-tooltip-key="modePhaseOffset"
            style={{ color: '#6B7A90', fontSize: '13px', minWidth: '60px' }}
          >
            Δφ (rad)
          </span>
        </Tooltip>
        <NumberInput
          data-testid="mode-phase-offset"
          value={phaseOffset}
          onChange={(v) => updateModePhaseOffset(slmId, modeIndex, v)}
          min={-6.2832}
          max={6.2832}
          step={0.01}
          style={{ width: '80px' }}
          aria-label="Phase offset"
        />
      </div>
    </div>
  );
}
