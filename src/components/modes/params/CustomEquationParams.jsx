import { useState, useEffect } from 'react';
import { compile } from 'mathjs';
import { LabelledSlider } from '../../shared/LabelledSlider.jsx';
import { useSLMStore } from '../../../store/useSLMStore.js';

const DEFAULTS = { equation: 'sin(2 * pi * x / 50)', error: null, x0: 0, y0: 0 };

export function CustomEquationParams({ slmId, modeIndex, params }) {
  const updateModeParam = useSLMStore((s) => s.updateModeParam);
  const slm = useSLMStore((s) => s.slms.find((sl) => sl.id === slmId));
  const resX = slm?.hardware?.resX ?? 1920;
  const resY = slm?.hardware?.resY ?? 1080;
  const pixelPitch = slm?.hardware?.pixelPitchMicron ?? 8;
  const p = { ...DEFAULTS, ...params };
  const [localEq, setLocalEq] = useState(p.equation || '');

  useEffect(() => {
    setLocalEq(p.equation || '');
  }, [p.equation]);

  function commit(eq) {
    try {
      compile(eq);
      updateModeParam(slmId, modeIndex, 'error', null);
    } catch (err) {
      updateModeParam(slmId, modeIndex, 'error', String(err.message ?? err));
    }
    updateModeParam(slmId, modeIndex, 'equation', eq);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <textarea
        data-testid="custom-equation-input"
        value={localEq}
        onChange={(e) => setLocalEq(e.target.value)}
        onBlur={() => commit(localEq)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(localEq); } }}
        rows={2}
        placeholder="e.g. sin(2 * pi * x / 50) * exp(-r^2 / w0^2)"
        aria-label="Custom equation"
        style={{
          background: '#0B0E14',
          color: '#E8EDF3',
          border: '1px solid #2a3344',
          borderRadius: '4px',
          padding: '8px',
          fontSize: '13px',
          fontFamily: 'monospace',
          resize: 'vertical',
        }}
      />
      {p.error && (
        <span
          data-testid="equation-error"
          style={{ color: '#FF5C5C', fontSize: '12px' }}
        >
          {p.error}
        </span>
      )}
      <LabelledSlider label="x₀" tooltipKey="positionOffsetX" value={p.x0} onChange={(v) => updateModeParam(slmId, modeIndex, 'x0', v)} min={-resX / 2} max={resX / 2} step={1} unlimitedInput enableUnitToggle pixelPitch={pixelPitch} />
      <LabelledSlider label="y₀" tooltipKey="positionOffsetY" value={p.y0} onChange={(v) => updateModeParam(slmId, modeIndex, 'y0', v)} min={-resY / 2} max={resY / 2} step={1} unlimitedInput enableUnitToggle pixelPitch={pixelPitch} />
    </div>
  );
}
export const customEquationDefaults = DEFAULTS;
