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
        {modes.map((mode, i) => (
          <ModeCard
            key={i}
            slmId={slmId}
            modeIndex={i}
            mode={mode}
          />
        ))}
        <div style={{ marginTop: '8px' }}>
          <ModeSelector slmId={slmId} />
        </div>
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
