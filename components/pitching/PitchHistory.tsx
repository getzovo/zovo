import { createServerSupabaseClient } from '@/lib/supabase-server'

type StatusKey = 'draft' | 'sent' | 'opened' | 'replied'

const STATUS_LABEL: Record<StatusKey, string> = {
  draft: 'Draft',
  sent: 'Sent',
  opened: 'Opened',
  replied: 'Replied',
}

const STATUS_STYLE: Record<StatusKey, React.CSSProperties> = {
  draft: {
    color: 'var(--ink-muted)',
    backgroundColor: 'var(--off-white)',
    border: '1px solid var(--border)',
  },
  sent: {
    color: '#fff',
    backgroundColor: 'var(--accent)',
    border: '1px solid var(--accent)',
  },
  opened: {
    color: '#1d4ed8',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
  },
  replied: {
    color: '#15803d',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
  },
}

function StatusBadge({ status }: { status: string }) {
  const key = (STATUS_LABEL[status as StatusKey] ? status : 'draft') as StatusKey
  return (
    <span style={{
      ...STATUS_STYLE[key],
      fontFamily: "'DM Mono', monospace",
      fontSize: 10,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      borderRadius: 4,
      padding: '3px 8px',
      display: 'inline-block',
      whiteSpace: 'nowrap',
    }}>
      {STATUS_LABEL[key]}
    </span>
  )
}

export default async function PitchHistory() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: pitches } = await supabase
    .from('pitches')
    .select('id, release_name, status, created_at, curators(name, playlist_name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ marginTop: 56 }}>
      <h2 style={{
        fontFamily: "'Fraunces', serif",
        fontWeight: 500,
        fontSize: 22,
        letterSpacing: '-0.02em',
        color: 'var(--ink)',
        margin: '0 0 20px',
      }}>
        Pitch History
      </h2>

      {!pitches?.length ? (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: 'var(--ink-muted)',
          margin: 0,
        }}>
          Your sent pitches will appear here.
        </p>
      ) : (
        <div style={{
          border: '1px solid var(--border)',
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
          }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--off-white)' }}>
                {(['Release', 'Curator', 'Status', 'Date'] as const).map((col) => (
                  <th key={col} style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-muted)',
                    fontWeight: 400,
                    textAlign: 'left',
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pitches.map((pitch, i) => {
                const curator = Array.isArray(pitch.curators) ? pitch.curators[0] : pitch.curators
                const date = new Date(pitch.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })
                return (
                  <tr
                    key={pitch.id}
                    style={{
                      borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                      backgroundColor: 'var(--warm-white)',
                    }}
                  >
                    <td style={{ padding: '12px 16px', color: 'var(--ink)', fontWeight: 500 }}>
                      {pitch.release_name}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--ink-muted)' }}>
                      {curator ? (
                        <span>
                          {curator.name}
                          <span style={{ color: 'var(--border)', margin: '0 6px' }}>·</span>
                          <span style={{ fontSize: 13 }}>{curator.playlist_name}</span>
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={pitch.status ?? 'draft'} />
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                      {date}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
