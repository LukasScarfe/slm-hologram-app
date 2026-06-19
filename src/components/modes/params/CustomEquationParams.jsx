import { useState, useEffect } from 'react';
import { compile } from 'mathjs';
import { useSLMStore } from '../../../store/useSLMStore.js';

const DEFAULTS = { equation: 'sin(2 * pi * x / 50)', error: null };

export function CustomEquationParams({ slmId, modeIndex, params }) {
  const updateModeParam = useSLMStore((s) => s.updateModeParam);
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
    </div>
  );
}
export const customEquationDefaults = DEFAULTS;
