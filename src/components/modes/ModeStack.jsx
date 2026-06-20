import { useSLMStore } from '../../store/useSLMStore.js';
import { ModeCard } from './ModeCard.jsx';
import { ModeSelector } from './ModeSelector.jsx';

export function ModeStack({ slmId }) {
  const modes = useSLMStore((state) => {
    const slm = state.slms.find((s) => s.id === slmId);
    return slm ? slm.modes : [];
  });
  const isImported = useSLMStore((state) => {
    return state.slms.find((s) => s.id === slmId)?.isImported ?? false;
  });
  const clearModes = useSLMStore((s) => s.clearModes);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        opacity: isImported ? 0.35 : 1,
        pointerEvents: isImported ? 'none' : 'auto',
        transition: 'opacity 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <ModeSelector slmId={slmId} />
          {modes.length > 0 && (
            <button
              onClick={() => clearModes(slmId)}
              style={{
                background: 'transparent',
                color: '#ef4444',
                border: '1px solid #ef4444',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Clear Stack
            </button>
          )}
        </div>
        {modes.map((mode, i) => (
          <ModeCard
            key={i}
            slmId={slmId}
            modeIndex={i}
            mode={mode}
          />
        ))}
      </div>
      {isImported && (
        <div
          data-testid="mode-stack-import-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span style={{
            color: '#6B7A90',
            fontSize: '13px',
            background: '#13181F',
            padding: '4px 12px',
            borderRadius: '4px',
            border: '1px solid #1C2330',
          }}>
            Mode stack inactive — imported hologram is active. Use "Clear Import" to resume.
          </span>
        </div>
      )}
    </div>
  );
}
