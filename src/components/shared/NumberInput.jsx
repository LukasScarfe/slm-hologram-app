import { useState, useEffect } from 'react';

export function NumberInput({ value, onChange, min, max, step = 1, 'data-testid': testId, style, ...props }) {
  const [localVal, setLocalVal] = useState(String(value));

  useEffect(() => {
    setLocalVal(String(value));
  }, [value]);

  function commit(raw) {
    let num = parseFloat(raw);
    if (isNaN(num)) return;
    if (min !== undefined) num = Math.max(min, num);
    if (max !== undefined) num = Math.min(max, num);
    onChange(num);
    setLocalVal(String(num));
  }

  return (
    <input
      type="number"
      value={localVal}
      min={min}
      max={max}
      step={step}
      data-testid={testId}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') commit(e.target.value); }}
      style={{
        background: '#1C2330',
        color: '#E8EDF3',
        border: '1px solid #2a3344',
        borderRadius: '4px',
        padding: '4px 8px',
        fontSize: '13px',
        width: '72px',
        ...style,
      }}
      {...props}
    />
  );
}
