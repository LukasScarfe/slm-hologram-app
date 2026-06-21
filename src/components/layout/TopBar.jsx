import logoUrl from '/logo.png';

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
      <a
        href="https://lukasscarfe.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
        }}
      >
        <img
          src={logoUrl}
          alt="Logo"
          style={{ height: '28px', width: 'auto' }}
        />
        <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '15px', letterSpacing: '0.02em' }}>
          SLM Hologram Studio
        </span>
      </a>
    </header>
  );
}
