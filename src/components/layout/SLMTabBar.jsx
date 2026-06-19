import { useSLMStore } from '../../store/useSLMStore.js';

const tabBarStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  background: '#13181F',
  borderBottom: '1px solid #1C2330',
  padding: '0 16px',
  flexShrink: 0,
  overflowX: 'auto',
};

const tabStyle = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  background: active ? '#1C2330' : 'transparent',
  borderBottom: active ? '2px solid #00C9A7' : '2px solid transparent',
  color: active ? '#E8EDF3' : '#6B7A90',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: active ? 600 : 400,
  borderTop: 'none',
  borderLeft: 'none',
  borderRight: 'none',
  outline: 'none',
  whiteSpace: 'nowrap',
  userSelect: 'none',
});

const removeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  background: 'transparent',
  color: '#6B7A90',
  border: 'none',
  cursor: 'pointer',
  fontSize: '11px',
  lineHeight: 1,
  padding: 0,
};

const addStyle = {
  marginLeft: '4px',
  padding: '6px 12px',
  background: 'transparent',
  color: '#00C9A7',
  border: '1px solid #00C9A7',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  flexShrink: 0,
};

export function SLMTabBar() {
  const slms = useSLMStore((s) => s.slms);
  const activeSLMId = useSLMStore((s) => s.activeSLMId);
  const setActiveSLM = useSLMStore((s) => s.setActiveSLM);
  const addSLM = useSLMStore((s) => s.addSLM);
  const removeSLM = useSLMStore((s) => s.removeSLM);

  function handleRemove(e, slmId) {
    e.stopPropagation();
    removeSLM(slmId);
  }

  return (
    <div data-testid="slm-tab-bar" style={tabBarStyle}>
      {slms.map((slm, index) => {
        const active = slm.id === activeSLMId;
        return (
          <button
            key={slm.id}
            data-testid={`slm-tab-${index}`}
            style={tabStyle(active)}
            onClick={() => setActiveSLM(slm.id)}
            aria-label={`Switch to ${slm.name}`}
            aria-selected={active}
          >
            {slm.name}
            {slms.length > 1 && (
              <span
                data-testid={`remove-slm-${index}`}
                role="button"
                aria-label={`Remove ${slm.name}`}
                style={removeStyle}
                onClick={(e) => handleRemove(e, slm.id)}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleRemove(e, slm.id); }}
              >
                ×
              </span>
            )}
          </button>
        );
      })}
      <button
        data-testid="add-slm-button"
        style={addStyle}
        onClick={addSLM}
        aria-label="Add new SLM"
      >
        + Add SLM
      </button>
    </div>
  );
}
