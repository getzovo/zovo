type Size = 'sm' | 'md' | 'lg';

const fontSizes: Record<Size, number> = {
  sm: 20,
  md: 28,
  lg: 40,
};

const dotSizes: Record<Size, number> = {
  sm: 4,
  md: 5,
  lg: 7,
};

export default function Wordmark({ size = 'md' }: { size?: Size }) {
  const fontSize = fontSizes[size];
  const dotSize = dotSizes[size];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        fontFamily: "'Fraunces', serif",
        fontWeight: 500,
        fontSize,
        letterSpacing: '-0.03em',
        color: '#111010',
        lineHeight: 1,
      }}
    >
      Zovo
      <span
        style={{
          display: 'inline-block',
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          backgroundColor: '#E8440A',
          marginLeft: 2,
          flexShrink: 0,
          alignSelf: 'flex-end',
          marginBottom: Math.round(fontSize * 0.08),
        }}
      />
    </span>
  );
}
