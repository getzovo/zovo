export default function Wordmark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: '20px', md: '24px', lg: '36px' }

  return (
    <span
      style={{
        fontFamily: 'Fraunces, serif',
        fontWeight: 500,
        letterSpacing: '-0.03em',
        color: '#111010',
        fontSize: sizes[size],
        display: 'inline-flex',
        alignItems: 'baseline',
      }}
    >
      Zovo
      <span
        style={{
          width: '5px',
          height: '5px',
          backgroundColor: '#E8440A',
          borderRadius: '50%',
          display: 'inline-block',
          marginLeft: '1px',
          marginBottom: '2px',
          alignSelf: 'flex-end',
        }}
      />
    </span>
  )
}
