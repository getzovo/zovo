'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import RunwayPlanner from './RunwayPlanner'

interface StatCardData {
  label: string
  value: string
  subtext: string
}

interface Props {
  greeting: string
  dateHeader: string
  hasArtistId: boolean
  cards: StatCardData[]
  fullCatalog: { name: string; release_date: string }[]
  tier: string | null
}

function isNumeric(val: string): boolean {
  return val !== '--' && val.trim() !== '' && !isNaN(Number(val))
}

function AnimatedValue({ value }: { value: string }) {
  const numeric = isNumeric(value)
  const target = numeric ? Number(value) : 0
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!numeric) return
    const duration = 800
    const start = performance.now()
    let raf: number

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const valueStyle: React.CSSProperties = {
    fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
    fontWeight: 400,
    fontSize: 32,
    letterSpacing: '0.02em',
    color: '#F5F5F0',
    lineHeight: 1,
    marginBottom: 6,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  if (numeric) {
    return <div style={valueStyle}>{count}</div>
  }

  return (
    <motion.div
      style={valueStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      {value}
    </motion.div>
  )
}

function StatCard({ label, value, subtext, delay }: StatCardData & { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      style={{
        backgroundColor: '#111111',
        border: '1px solid #1A1A1A',
        borderRadius: 8,
        padding: 20,
      }}
    >
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#8A8786',
        marginBottom: 8,
      }}>
        {label}
      </div>
      <AnimatedValue value={value} />
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#8A8786',
      }}>
        {subtext}
      </div>
    </motion.div>
  )
}

export default function DashboardClient({
  greeting,
  dateHeader,
  hasArtistId,
  cards,
  fullCatalog,
  tier,
}: Props) {
  return (
    <>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#8A8786',
        marginBottom: 10,
      }}>
        {dateHeader}
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
          fontWeight: 400,
          fontSize: 40,
          letterSpacing: '0.02em',
          color: '#F5F5F0',
          lineHeight: 1.1,
          margin: '0 0 32px',
        }}
      >
        {greeting}.
      </motion.h1>

      <AnimatePresence>
        {!hasArtistId ? (
          <motion.div
            key="no-artist"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{ textAlign: 'center', padding: '40px 0' }}
          >
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: '#8A8786',
              margin: '0 0 6px',
            }}>
              Add your Spotify artist URL to see your catalog stats
            </p>
            <Link
              href="/dashboard/settings"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: '#F5F5F0',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              Go to Settings →
            </Link>
          </motion.div>
        ) : (
          <motion.div key="has-artist">
            <div className="stat-grid" style={{ marginBottom: 20 }}>
              {cards.map((card, i) => (
                <StatCard key={card.label} {...card} delay={i * 0.1} />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
            >
              <RunwayPlanner releases={fullCatalog} tier={tier} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
