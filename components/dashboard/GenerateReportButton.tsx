'use client'

import { useState } from 'react'

interface Report {
  month_in_review: string
  whats_working: string
  whats_to_fix: string
  next_30_days: string
}

const SECTIONS: { key: keyof Report; label: string }[] = [
  { key: 'month_in_review', label: 'Month in Review' },
  { key: 'whats_working',   label: "What's Working" },
  { key: 'whats_to_fix',    label: 'What to Fix' },
  { key: 'next_30_days',    label: 'Next 30 Days' },
]

function Skeleton() {
  return (
    <div style={{
      backgroundColor: '#111111',
      border: '1px solid #1A1A1A',
      borderRadius: 8,
      padding: '20px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      marginTop: 16,
    }}>
      {SECTIONS.map(({ label }) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            width: 120,
            height: 10,
            borderRadius: 4,
            backgroundColor: '#2A2A2A',
            animation: 'pulse 1.4s ease-in-out infinite',
          }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 13, borderRadius: 4, backgroundColor: '#2A2A2A', animation: 'pulse 1.4s ease-in-out infinite' }} />
            <div style={{ height: 13, borderRadius: 4, backgroundColor: '#2A2A2A', animation: 'pulse 1.4s ease-in-out infinite', width: '85%' }} />
            <div style={{ height: 13, borderRadius: 4, backgroundColor: '#2A2A2A', animation: 'pulse 1.4s ease-in-out infinite', width: '60%' }} />
          </div>
        </div>
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>
    </div>
  )
}

function ReportCard({ report }: { report: Report }) {
  return (
    <div style={{
      backgroundColor: '#111111',
      border: '1px solid #1A1A1A',
      borderRadius: 8,
      padding: '20px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      marginTop: 16,
    }}>
      {SECTIONS.map(({ key, label }, i) => (
        <div key={key}>
          {i > 0 && (
            <div style={{ height: 1, backgroundColor: '#1A1A1A', marginBottom: 20 }} />
          )}
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#8A8786',
            fontWeight: 400,
            marginBottom: 8,
          }}>
            {label}
          </div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: '#F5F5F0',
            lineHeight: 1.7,
            margin: 0,
          }}>
            {report[key]}
          </p>
        </div>
      ))}
    </div>
  )
}

export default function GenerateReportButton() {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const res = await fetch('/api/reports/generate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.report) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }
      setReport(data.report)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        disabled={loading}
        onClick={handleClick}
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500,
          fontSize: 14,
          color: '#F5F5F0',
          backgroundColor: '#FF4500',
          border: 'none',
          borderRadius: 8,
          padding: '11px 20px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {loading ? 'Generating…' : report ? 'Regenerate Report' : 'Generate Monthly Report'}
      </button>

      {loading && <Skeleton />}

      {error && !loading && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          color: '#FF4500',
          margin: '12px 0 0',
        }}>
          {error}
        </p>
      )}

      {report && !loading && <ReportCard report={report} />}
    </div>
  )
}
