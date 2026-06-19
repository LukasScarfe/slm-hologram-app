export function TopBar() {
  return (
    <header
      style={{
        background: '#13181F',
        borderBottom: '1px solid #1C2330',
        padding: '0 24px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      <span style={{ color: '#00C9A7', fontWeight: 700, fontSize: '15px', letterSpacing: '0.02em' }}>
        ◈ SLM Hologram Studio
      </span>
    </header>
  );
}
