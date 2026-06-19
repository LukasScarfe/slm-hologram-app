export function SectionHeader({ children }) {
  return (
    <h3 style={{
      color: '#6B7A90',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      margin: '0 0 8px',
    }}>
      {children}
    </h3>
  );
}
