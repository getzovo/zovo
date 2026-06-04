import Wordmark from '@/components/wordmark';

export default function Dashboard() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--warm-white)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '40px 24px',
    }}>
      <div style={{ marginBottom: 40 }}>
        <Wordmark size="md" />
      </div>

      <h1 style={{
        fontFamily: "'Fraunces', serif",
        fontWeight: 500,
        fontSize: 36,
        letterSpacing: '-0.03em',
        color: 'var(--ink)',
        lineHeight: 1.2,
        margin: '0 0 12px',
      }}>
        Dashboard
      </h1>

      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 16,
        color: 'var(--ink-muted)',
      }}>
        Coming soon.
      </p>
    </div>
  );
}
