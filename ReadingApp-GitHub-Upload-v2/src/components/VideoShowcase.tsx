export default function VideoShowcase() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(244,114,182,0.1) 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      padding: '1rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '0.5rem'
    }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'white', letterSpacing: '0.01em' }}>
          Shraddha Children Academy, Kottivakkam
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          English Department Organised
        </div>
      </div>
      <span style={{
        background: 'rgba(139,92,246,0.2)',
        border: '1px solid rgba(139,92,246,0.4)',
        color: '#c084fc',
        borderRadius: '100px',
        padding: '0.3rem 0.9rem',
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.05em'
      }}>
        AI Reading Assessment
      </span>
    </div>
  );
}
