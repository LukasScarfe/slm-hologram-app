import { useState } from 'react';
import { useHologramWindow } from '../../hooks/useHologramWindow.js';
import { useScreens } from '../../hooks/useScreens.js';

const baseBtn = {
  border: 'none',
  borderRadius: '4px',
  padding: '6px 14px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
};

const sendBtn   = { ...baseBtn, background: '#22c55e', color: '#0B0E14' };
const closeBtn  = { ...baseBtn, background: '#FF5C5C', color: '#fff' };
const activateBtn = { ...baseBtn, background: '#16a34a', color: '#fff' };

const selectStyle = {
  background: '#1C2330',
  color: '#E8EDF3',
  border: '1px solid #2a3344',
  borderRadius: '4px',
  padding: '4px 8px',
  fontSize: '13px',
  cursor: 'pointer',
};

const hintStyle = {
  fontSize: '11px',
  color: '#6B7A90',
  fontFamily: 'Inter, sans-serif',
  marginTop: '4px',
};

export function SLMDisplayButton({ slmId }) {
  const { isOpen, openWindow, closeWindow, focusWindow } = useHologramWindow(slmId);
  const { screens, refresh } = useScreens();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activating, setActivating] = useState(false);

  function handleSend() {
    const screen = screens[selectedIdx] ?? screens[0];
    openWindow(screen);
    window.focus();
  }

  function handleActivate() {
    focusWindow();
    setActivating(true);
    // Reset hint after a moment
    setTimeout(() => setActivating(false), 4000);
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Screen picker */}
        <select
          data-testid="screen-select"
          value={selectedIdx}
          onChange={(e) => setSelectedIdx(Number(e.target.value))}
          onClick={refresh}
          style={selectStyle}
          aria-label="Target screen for hologram display"
        >
          {screens.length === 0 && <option value={0}>Primary Screen</option>}
          {screens.map((s, i) => (
            <option key={i} value={i}>{s.label}</option>
          ))}
        </select>

        {isOpen ? (
          <>
            <button
              data-testid="activate-fullscreen-button"
              onClick={handleActivate}
              style={activateBtn}
              aria-label="Focus display window so next keypress enters fullscreen"
            >
              ⛶ Activate Fullscreen
            </button>
            <button
              data-testid="close-display-button"
              onClick={closeWindow}
              style={closeBtn}
              aria-label="Close hologram display window"
            >
              ✕ Close Display
            </button>
          </>
        ) : (
          <button
            data-testid="send-to-display-button"
            onClick={handleSend}
            style={sendBtn}
            aria-label="Send hologram to display"
          >
            ▸ Send to Display
          </button>
        )}
      </div>

      {isOpen && (
        <p style={hintStyle}>
          {activating
            ? '⌨ Display window focused — press any key to enter fullscreen'
            : 'Click "Activate Fullscreen", then press any key on your keyboard'}
        </p>
      )}
    </div>
  );
}
