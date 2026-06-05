'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView, type Variants } from 'framer-motion'
import Link from 'next/link'
import Wordmark from '@/components/wordmark'

// ── Animation variants ────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut', duration: 0.5 } },
}

const staggerGrid = (delay = 0.1): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: delay } },
})

// ── Static data ───────────────────────────────────────────────────────────────

const TOOLS = ['Spotify for Artists', 'SubmitHub', 'DistroKid', 'A spreadsheet', 'Your email']

const FEATURES = [
  {
    title: 'Pitch curators in seconds.',
    body: 'Generate personalized curator pitches based on your release and their playlist taste. Send directly from Zovo — no copy-paste.',
  },
  {
    title: 'Your catalog, your pace, your next move.',
    body: 'See your full release history, release cadence, and catalog depth — with AI analysis that tells you what it means for your next drop.',
  },
  {
    title: 'A monthly strategy brief, built for your career.',
    body: "Every month, Zovo analyzes your catalog and tells you what's working, what to fix, and exactly what to focus on for the next 30 days.",
  },
  {
    title: 'Submit your music for distribution.',
    body: 'Get your releases to every major DSP. Submit directly through Zovo — no extra accounts, no extra fees on the Artist plan.',
  },
]

const PLANS = [
  {
    name: 'Free', price: '$0', note: 'forever', featured: false, cta: 'Get started free',
    features: ['Catalog overview', 'Recently played', '3 AI pitches/month', 'Monthly snapshot report'],
  },
  {
    name: 'Artist', price: '$29', note: '/month', featured: true, cta: 'Get Artist',
    features: ['Everything in Free', 'Unlimited AI pitches', 'Integrated email sending', '500+ curator database', 'Full AI growth report', 'Release runway planner', '2 distributions/month'],
  },
  {
    name: 'Pro', price: '$149', note: '/month', featured: false, cta: 'Get Pro',
    features: ['Everything in Artist', 'Multi-platform catalog sync', 'Royalty aggregator', 'Weekly AI strategy briefs', 'Content repurposing engine', 'Sync licensing tools', 'Unlimited distributions'],
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const problemRef = useRef<HTMLElement>(null)
  const inView = useInView(problemRef, { once: true, amount: 0.3 })

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <motion.div
      className="min-h-screen bg-warm-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >

      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={scrolled ? { backdropFilter: 'blur(12px)', backgroundColor: 'rgba(250,248,245,0.85)', borderBottom: '1px solid #E2DED8' } : {}}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Wordmark size="md" />
          <div className="flex items-center gap-4">
            <Link href="/login" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8A8786' }} className="hover:text-ink transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, backgroundColor: '#E8440A', color: '#fff', padding: '8px 18px', borderRadius: 8 }}
              className="hover:opacity-90 transition-opacity"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-36 pb-28 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <motion.h1
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, letterSpacing: '-0.03em', color: '#111010' }}
            className="text-5xl md:text-6xl leading-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            Your AI music career manager.
          </motion.h1>

          <motion.p
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: '#8A8786', lineHeight: 1.7 }}
            className="max-w-xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
          >
            Zovo replaces the 5+ tools independent artists juggle — pitching, distribution, growth strategy, and more — in one platform that doesn&apos;t just show you numbers. It tells you what to do with them.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
          >
            <Link
              href="/signup"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 16, backgroundColor: '#111010', color: '#fff', padding: '14px 32px', borderRadius: 8, display: 'inline-block' }}
              className="hover:opacity-90 transition-opacity"
            >
              Get early access — it&apos;s free
            </Link>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8786', marginTop: 20 }}>
              Early access open now. Be among the first artists on the platform.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Problem ── */}
      <section ref={problemRef} className="py-24 px-6" style={{ backgroundColor: '#F2EFEA' }}>
        <div className="max-w-4xl mx-auto">
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8786', marginBottom: 20 }}>
            The Problem
          </p>
          <h2
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, letterSpacing: '-0.03em', color: '#111010', lineHeight: 1.2, marginBottom: 40 }}
            className="text-4xl md:text-5xl"
          >
            You&apos;re running a music career out of five different tabs.
          </h2>

          <div className="flex flex-wrap gap-3 mb-10">
            {TOOLS.map((tool, i) => (
              <div key={tool} className="relative inline-block">
                <motion.span
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8A8786', backgroundColor: '#fff', border: '1px solid #E2DED8', padding: '8px 18px', borderRadius: 999, display: 'inline-block', position: 'relative' }}
                  initial={{ opacity: 0, x: -12 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
                >
                  {tool}
                </motion.span>
                <motion.span
                  style={{ position: 'absolute', left: 18, right: 18, height: 1.5, backgroundColor: '#8A8786', top: '50%', transformOrigin: 'left', display: 'block' }}
                  initial={{ scaleX: 0 }}
                  animate={inView ? { scaleX: 1 } : {}}
                  transition={{ delay: TOOLS.length * 0.08 + 0.25 + i * 0.18, duration: 0.35, ease: 'easeOut' }}
                />
              </div>
            ))}
          </div>

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: '#8A8786', lineHeight: 1.7, maxWidth: 560 }}>
            None of them talk to each other — and none of them tell you what to do next.
          </p>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8786', marginBottom: 20 }}>
              What Zovo Does
            </p>
            <h2
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, letterSpacing: '-0.03em', color: '#111010', lineHeight: 1.2 }}
              className="text-4xl md:text-5xl"
            >
              Everything your career needs.<br />One place.
            </h2>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            variants={staggerGrid(0.1)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
          >
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                style={{ backgroundColor: '#F2EFEA', border: '1px solid #E2DED8', borderRadius: 12, padding: 32 }}
              >
                <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 20, color: '#111010', letterSpacing: '-0.02em', marginBottom: 12 }}>
                  {f.title}
                </h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8A8786', lineHeight: 1.7 }}>
                  {f.body}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-24 px-6" style={{ backgroundColor: '#F2EFEA' }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8786', marginBottom: 20 }}>
              Pricing
            </p>
            <h2
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, letterSpacing: '-0.03em', color: '#111010', lineHeight: 1.2 }}
              className="text-4xl md:text-5xl"
            >
              Start free. Upgrade when you&apos;re ready.
            </h2>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start"
            variants={staggerGrid(0.1)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
          >
            {PLANS.map((plan) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                style={{
                  backgroundColor: '#fff',
                  border: plan.featured ? '2px solid #E8440A' : '1px solid #E2DED8',
                  borderRadius: 12,
                  padding: 32,
                  position: 'relative',
                  boxShadow: plan.featured ? '0 8px 32px rgba(232,68,10,0.12)' : 'none',
                }}
              >
                {plan.featured && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: '#E8440A', color: '#fff',
                    fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
                    padding: '4px 12px', borderRadius: 4, whiteSpace: 'nowrap',
                  }}>
                    Most Popular
                  </div>
                )}
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8786', marginBottom: 12 }}>
                  {plan.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
                  <span style={{ fontFamily: "'Fraunces', serif", fontSize: 40, fontWeight: 500, color: '#111010', letterSpacing: '-0.03em' }}>{plan.price}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#8A8786' }}>{plan.note}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#8A8786', paddingLeft: 14, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: '#E8440A' }}>·</span>{f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="block text-center hover:opacity-90 transition-opacity"
                  style={{
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 14, borderRadius: 8, padding: '11px 0',
                    backgroundColor: plan.featured ? '#111010' : 'transparent',
                    color: plan.featured ? '#fff' : '#111010',
                    border: plan.featured ? 'none' : '1px solid #E2DED8',
                  }}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-6 text-center" style={{ backgroundColor: '#E8440A' }}>
        <div className="max-w-2xl mx-auto">
          <h2
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.2, marginBottom: 20 }}
            className="text-4xl md:text-5xl"
          >
            Built for independent artists. Launching now.
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: 'rgba(255,255,255,0.82)', lineHeight: 1.7, marginBottom: 40 }}>
            Zovo is in early access. Join now and be among the first artists to use the platform — free to start, no credit card required.
          </p>
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ display: 'inline-block' }}
          >
            <Link
              href="/signup"
              className="hover:opacity-90 transition-opacity"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 16, backgroundColor: '#fff', color: '#111010', padding: '14px 32px', borderRadius: 8, display: 'inline-block' }}
            >
              Claim your free account
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6" style={{ borderTop: '1px solid #E2DED8' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Wordmark size="sm" />
          <div className="flex items-center gap-8">
            {['Features', 'Pricing', 'Privacy', 'Terms'].map((l) => (
              <a key={l} href="#" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8786' }} className="hover:text-ink transition-colors">
                {l}
              </a>
            ))}
          </div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8786' }}>
            © 2026 Cole Ventures Group LLC · Zovo
          </p>
        </div>
      </footer>

    </motion.div>
  )
}
