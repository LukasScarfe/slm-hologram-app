import { useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Tooltip } from './Tooltip.jsx';
import { NumberInput } from './NumberInput.jsx';

export function LabelledSlider({
  label,
  tooltipKey,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  unlimitedInput = false,
  enableUnitToggle = false,
  pixelPitch,
  'data-testid': testId,
  'data-tooltip-key': _unused,
  labelTestId,
  numberInputTestId,
  numberInputAriaLabel,
}) {
  const [unit, setUnit] = useState('mm');

  const pitchMm = pixelPitch ? pixelPitch / 1000 : null;
  const inMm = enableUnitToggle && unit === 'mm' && pitchMm != null;

  const toDisplay = (px) => inMm ? parseFloat((px * pitchMm).toFixed(4)) : px;
  const fromDisplay = (d) => inMm ? d / pitchMm : d;

  const displayValue = toDisplay(value);
  const displayMin = toDisplay(min);
  const displayMax = toDisplay(max);
  const displayStep = inMm ? parseFloat((step * pitchMm).toPrecision(4)) : step;

  const labelEl = (
    <span
      data-testid={labelTestId}
      data-tooltip-key={tooltipKey}
      style={{ color: '#6B7A90', fontSize: '13px', minWidth: '32px', display: 'inline-block' }}
    >
      {label}
    </span>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
      {tooltipKey ? <Tooltip tooltipKey={tooltipKey}>{labelEl}</Tooltip> : labelEl}
      <Slider.Root
        value={[displayValue]}
        onValueChange={([v]) => onChange(fromDisplay(v))}
        min={displayMin}
        max={displayMax}
        step={displayStep}
        data-testid={testId}
        style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, height: '20px' }}
      >
        <Slider.Track style={{ background: '#2a3344', height: '4px', borderRadius: '2px', flex: 1 }}>
          <Slider.Range style={{ background: '#22c55e', height: '100%', borderRadius: '2px' }} />
        </Slider.Track>
        <Slider.Thumb
          style={{
            display: 'block',
            width: '14px',
            height: '14px',
            background: '#22c55e',
            borderRadius: '50%',
            cursor: 'pointer',
          }}
          aria-label={label}
        />
      </Slider.Root>
      <NumberInput
        value={displayValue}
        onChange={(v) => onChange(fromDisplay(v))}
        min={unlimitedInput ? undefined : displayMin}
        max={unlimitedInput ? undefined : displayMax}
        step={displayStep}
        style={{ width: '90px', flexShrink: 0 }}
        data-testid={numberInputTestId}
        aria-label={numberInputAriaLabel || (label ? `${label} value` : undefined)}
      />
      <div style={{ width: '36px', flexShrink: 0 }}>
        {enableUnitToggle && pixelPitch && (
          <button
            onClick={() => setUnit((u) => (u === 'px' ? 'mm' : 'px'))}
            style={{
              background: 'transparent',
              color: unit === 'mm' ? '#22c55e' : '#6B7A90',
              border: `1px solid ${unit === 'mm' ? '#22c55e' : '#2a3344'}`,
              borderRadius: '4px',
              padding: '1px 5px',
              fontSize: '11px',
              cursor: 'pointer',
              width: '100%',
              lineHeight: '16px',
            }}
          >
            {unit}
          </button>
        )}
      </div>
    </div>
  );
}
