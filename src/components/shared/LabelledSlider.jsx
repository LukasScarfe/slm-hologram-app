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
  'data-testid': testId,
  'data-tooltip-key': _unused,
  labelTestId,
  numberInputTestId,
  numberInputAriaLabel,
}) {
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
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        data-testid={testId}
        style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, height: '20px' }}
      >
        <Slider.Track style={{ background: '#2a3344', height: '4px', borderRadius: '2px', flex: 1 }}>
          <Slider.Range style={{ background: '#00C9A7', height: '100%', borderRadius: '2px' }} />
        </Slider.Track>
        <Slider.Thumb
          style={{
            display: 'block',
            width: '14px',
            height: '14px',
            background: '#00C9A7',
            borderRadius: '50%',
            cursor: 'pointer',
          }}
          aria-label={label}
        />
      </Slider.Root>
      <NumberInput
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        style={{ width: '64px' }}
        data-testid={numberInputTestId}
        aria-label={numberInputAriaLabel || (label ? `${label} value` : undefined)}
      />
    </div>
  );
}
