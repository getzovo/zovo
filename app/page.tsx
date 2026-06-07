'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'
import Link from 'next/link'

const BB  = "'Bebas Neue', sans-serif"
const DM  = "'DM Sans', sans-serif"
const DMM = "'DM Mono', monospace"
const EASE = [0.16, 1, 0.3, 1] as const

const PROBLEMS = [
  { lbl: 'FOR ARTISTS',  body: "You're releasing music, pitching curators, and chasing distribution across 5+ disconnected apps. No intelligence. No direction. Just chaos." },
  { lbl: 'FOR MANAGERS', body: "You're managing your roster over text threads, spreadsheets, and gut feeling. No visibility. No leverage. No system." },
  { lbl: 'FOR LABELS',   body: "You have no real-time view of what your managers are doing or how your roster is actually performing. You're flying blind." },
]

const ARTIST_FEATS = [
  { t: 'AI PITCH GENERATOR',     b: 'Generate personalized curator pitches in seconds. 500+ curators. Send directly from Zovo.' },
  { t: 'RELEASE RUNWAY PLANNER', b: 'Know exactly when to drop your next release based on your cadence. AI-powered timing recommendations.' },
  { t: 'MUSIC DISTRIBUTION',     b: 'Submit your releases for distribution. We handle delivery to all major DSPs.' },
  { t: 'MONTHLY GROWTH REPORT',  b: "AI-written monthly analysis of your career. What's working, what's not, what to do next." },
]

const MANAGER_FEATS = [
  { t: 'ROSTER DASHBOARD',     b: 'Every artist on your roster in one view. Health scores, release cadence, pitch activity — all live.' },
  { t: 'BULK PITCH ENGINE',    b: 'Pitch multiple artists to a curator in one session. AI generates personalized pitches for each artist automatically.' },
  { t: 'ARTIST HEALTH SCORES', b: '0–100 score for every artist based on release consistency, pitch activity, catalog growth, and more.' },
  { t: 'ROSTER INTELLIGENCE',  b: "Weekly AI brief analyzing your full roster. Who's on pace, who's falling behind, what to do this week." },
]

const LABEL_FEATS = [
  { t: 'LABEL ANALYTICS',      b: 'Aggregate stats across your entire roster. Total releases, health scores, activity — one view.' },
  { t: 'MANAGER PERFORMANCE',  b: 'See which managers are most active, highest pitch response rates, fastest-growing rosters.' },
  { t: 'MULTI-ROSTER VIEW',    b: 'Drill from label → manager → artist in three clicks. Full visibility at every level.' },
  { t: 'RELEASE COORDINATION', b: 'AI detects when roster artists are dropping in the same window and flags conflicts automatically.' },
]

const AI_CARDS = [
  { compare: 'SPOTIFY FOR ARTISTS', action: 'tells you what happened.', zovo: 'ZOVO tells you what to do next.' },
  { compare: 'SUBMITTHUB',          action: 'sends your pitch.',         zovo: 'ZOVO writes it, targets the right curator, and tracks the response.' },
  { compare: 'A SPREADSHEET',       action: 'tracks your roster.',       zovo: 'ZOVO analyzes it and tells you which artist needs attention this week.' },
]

const PRICING = [
  { name: 'FREE',    price: '$0',      desc: 'For artists getting started',              feats: ['3 pitches/month', 'Catalog overview', 'Monthly snapshot'],                                    type: 'artist',  popular: false },
  { name: 'ARTIST',  price: '$29/mo',  desc: 'For artists releasing consistently',        feats: ['Unlimited pitches', 'Runway planner', 'Distribution', 'Full reports'],                       type: 'artist',  popular: true  },
  { name: 'PRO',     price: '$149/mo', desc: 'For artists treating music as a business',  feats: ['Everything in Artist', 'Royalty aggregator', 'Sync licensing', 'Weekly briefs'],            type: 'artist',  popular: false },
  { name: 'MANAGER', price: '$199/mo', desc: 'For managers running a roster',             feats: ['Up to 10 artists', 'Pro access for all', 'Roster intelligence', 'Bulk pitch'],              type: 'manager', popular: false },
  { name: 'LABEL',   price: '$499/mo', desc: 'For labels running an operation',           feats: ['Up to 50 artists', 'Label analytics', 'Manager performance', 'Multi-roster view'],         type: 'label',   popular: false },
]

const wordVar = {
  hidden: { opacity: 0, y: 40 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}
const headlineContainer = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }

function FeatureCard({ t, b, theme }: { t: string; b: string; theme: 'dark' | 'light' | 'fire' }) {
  const bg     = theme === 'dark' ? '#111111' : theme === 'fire' ? 'rgba(0,0,0,0.15)' : '#E8E6E2'
  const border = theme === 'dark' ? '#1A1A1A' : theme === 'fire' ? 'rgba(255,255,255,0.15)' : '#D0D0CC'
  const tc     = theme === 'dark' ? '#F5F5F0' : theme === 'fire' ? '#F5F5F0' : '#0A0A0A'
  const bc     = theme === 'dark' ? '#8A8786' : theme === 'fire' ? 'rgba(255,255,255,0.7)' : '#8A8786'
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '18px 20px', flex: 1, minWidth: 180 }}>
      <p style={{ fontFamily: BB, fontSize: 15, letterSpacing: '0.04em', color: tc, margin: '0 0 6px' }}>{t}</p>
      <p style={{ fontFamily: DM, fontSize: 13, color: bc, margin: 0, lineHeight: 1.6 }}>{b}</p>
    </div>
  )
}

const ctaLink: React.CSSProperties = {
  display: 'inline-block', fontFamily: DMM, fontSize: 12, letterSpacing: '0.1em',
  textTransform: 'uppercase', backgroundColor: '#FF4500', color: '#F5F5F0',
  padding: '11px 28px', borderRadius: 999, textDecoration: 'none',
}

export default function Home() {
  const [s2Active, setS2Active] = useState(false)

  const cornersTop    = useRef<HTMLDivElement>(null)
  const cornersBottom = useRef<HTMLDivElement>(null)
  const s2            = useRef<HTMLElement>(null)
  const s2Content     = useRef<HTMLDivElement>(null)
  const s3Overlay     = useRef<HTMLDivElement>(null)
  const s4 = useRef<HTMLElement>(null)
  const s5 = useRef<HTMLElement>(null)
  const s6 = useRef<HTMLElement>(null)
  const s7 = useRef<HTMLElement>(null)
  const s8 = useRef<HTMLElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const lenis = new Lenis({ duration: 1.2 })
    const rafFn = (time: number) => lenis.raf(time * 1000)
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(rafFn)
    gsap.ticker.lagSmoothing(0)

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: s2.current, start: 'center center', end: '+=300%',
        pin: true, pinSpacing: true, scrub: true,
        onUpdate: (self) => {
          const blurProg  = Math.min(1, self.progress * 2)
          const slideProg = Math.max(0, Math.min(1, (self.progress - 0.25) * 3))
          if (s2Content.current) {
            s2Content.current.style.filter  = `blur(${(blurProg * 8).toFixed(1)}px)`
            s2Content.current.style.opacity = String((1 - blurProg * 0.94).toFixed(3))
          }
          if (s3Overlay.current) {
            s3Overlay.current.style.transform = `translateY(${((1 - slideProg) * 100).toFixed(2)}vh)`
          }
        },
      })

      if (s8.current) {
        ScrollTrigger.create({ trigger: s8.current, start: 'top top', end: '+=200%', pin: true, pinSpacing: true })
      }

      const setTop    = (c: string) => { if (cornersTop.current)    cornersTop.current.style.color    = c }
      const setBottom = (c: string) => { if (cornersBottom.current) cornersBottom.current.style.color = c }

      ScrollTrigger.create({ trigger: s5.current, start: 'top top',    onEnter: () => setTop('#0A0A0A'),    onLeaveBack: () => setTop('#F5F5F0') })
      ScrollTrigger.create({ trigger: s5.current, start: 'top bottom', onEnter: () => setBottom('#0A0A0A'), onLeaveBack: () => setBottom('#F5F5F0') })
      ScrollTrigger.create({ trigger: s6.current, start: 'top top',    onEnter: () => setTop('#F5F5F0'),    onLeaveBack: () => setTop('#0A0A0A') })
      ScrollTrigger.create({ trigger: s6.current, start: 'top bottom', onEnter: () => setBottom('#F5F5F0'), onLeaveBack: () => setBottom('#0A0A0A') })
      ScrollTrigger.create({ trigger: s7.current, start: 'top top',    onEnter: () => setTop('#F5F5F0'),    onLeaveBack: () => setTop('#F5F5F0') })
      ScrollTrigger.create({ trigger: s7.current, start: 'top bottom', onEnter: () => setBottom('#F5F5F0'), onLeaveBack: () => setBottom('#F5F5F0') })
      ScrollTrigger.create({ trigger: s8.current, start: 'top top',    onEnter: () => setTop('#F5F5F0'),    onLeaveBack: () => setTop('#F5F5F0') })
      ScrollTrigger.create({ trigger: s8.current, start: 'top bottom', onEnter: () => setBottom('#F5F5F0'), onLeaveBack: () => setBottom('#F5F5F0') })

      ScrollTrigger.create({
        trigger: s2.current, start: 'top 80%',
        onEnter: () => setS2Active(true), onLeaveBack: () => setS2Active(false),
      })
    })

    return () => { ctx.revert(); lenis.destroy(); gsap.ticker.remove(rafFn) }
  }, [])

  return (
    <div style={{ backgroundColor: '#0A0A0A', color: '#F5F5F0' }}>

      {/* Fixed corners */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 99, pointerEvents: 'none' }}>
        <div ref={cornersTop} style={{ color: '#F5F5F0' }}>
          <span style={{ position: 'absolute', top: 24, left: 24, fontFamily: DMM, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            FOR INDEPENDENT MUSIC
          </span>
          <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto' }}>
            <Link href="/login" style={{ fontFamily: DMM, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'inherit', textDecoration: 'none' }}>LOGIN</Link>
            <Link href="/signup" style={{ fontFamily: DMM, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#F5F5F0', textDecoration: 'none', backgroundColor: '#FF4500', borderRadius: 999, padding: '5px 14px' }}>SIGN UP</Link>
          </div>
        </div>
        <div ref={cornersBottom} style={{ color: '#F5F5F0' }}>
          <span style={{ position: 'absolute', bottom: 24, left: 24, fontFamily: DMM, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>ZOVO — 2026</span>
          <span style={{ position: 'absolute', bottom: 24, right: 24, fontFamily: DMM, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>SAN FRANCISCO, CA</span>
        </div>
      </div>

      {/* S1: Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0A0A', padding: '80px 24px 60px' }}>
        <h1 style={{ fontFamily: BB, fontSize: 'clamp(64px, 13vw, 160px)', color: '#F5F5F0', lineHeight: 0.9, textAlign: 'center', letterSpacing: '0.02em', margin: '0 0 28px', userSelect: 'none' }}>
          ZOVO RUNS<br />INDEPENDENT MUSIC<span style={{ color: '#FF4500' }}>.</span>
        </h1>
        <p style={{ fontFamily: DM, fontSize: 18, color: '#8A8786', textAlign: 'center', maxWidth: 560, lineHeight: 1.7, margin: '0 0 48px' }}>
          The platform independent artists, managers, and labels use to pitch, distribute, plan releases, and grow — powered by AI.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: 820, marginBottom: 40 }}>
          {([
            { lbl: "I'M AN ARTIST",  desc: 'Manage your music career',    href: '/signup?type=artist'  },
            { lbl: "I'M A MANAGER",  desc: 'Manage your roster',          href: '/signup?type=manager' },
            { lbl: "I'M A LABEL",    desc: 'Run your label operation',     href: '/signup?type=label'   },
          ] as const).map(({ lbl, desc, href }) => (
            <Link key={lbl} href={href} style={{ textDecoration: 'none', flex: 1, minWidth: 220 }}>
              <div
                style={{ background: '#111111', border: '1px solid #1A1A1A', borderRadius: 12, padding: '22px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#FF4500'; el.style.boxShadow = '0 0 24px rgba(255,69,0,0.12)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#1A1A1A'; el.style.boxShadow = 'none' }}
              >
                <div>
                  <div style={{ fontFamily: BB, fontSize: 20, letterSpacing: '0.04em', color: '#F5F5F0', marginBottom: 4 }}>{lbl}</div>
                  <div style={{ fontFamily: DM, fontSize: 13, color: '#8A8786' }}>{desc}</div>
                </div>
                <span style={{ color: '#FF4500', fontSize: 20, marginLeft: 12 }}>→</span>
              </div>
            </Link>
          ))}
        </div>
        <span style={{ fontFamily: DMM, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#444' }}>
          NO CREDIT CARD REQUIRED · FREE TO START
        </span>
      </section>

      {/* S2: The Problem — pins 300vh; S3 slides up from below */}
      <section ref={s2} style={{ height: '100vh', position: 'relative', backgroundColor: '#0A0A0A' }}>
        <div ref={s2Content} style={{ position: 'relative', zIndex: 0, height: '100%', padding: '0 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', willChange: 'filter, opacity' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
            <p style={{ fontFamily: DMM, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#444', marginBottom: 24 }}>THE PROBLEM</p>
            <motion.div variants={headlineContainer} initial="hidden" animate={s2Active ? 'show' : 'hidden'} style={{ marginBottom: 48 }}>
              {(['INDEPENDENT MUSIC IS', 'RUN ON BROKEN TOOLS.'] as const).map(line => (
                <motion.div key={line} variants={wordVar} style={{ fontFamily: BB, fontSize: 'clamp(52px, 8vw, 120px)', color: '#F5F5F0', lineHeight: 0.92, display: 'block' }}>{line}</motion.div>
              ))}
            </motion.div>
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              {PROBLEMS.map(({ lbl, body }) => (
                <div key={lbl} style={{ flex: 1, minWidth: 220 }}>
                  <p style={{ fontFamily: DMM, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FF4500', marginBottom: 12 }}>{lbl}</p>
                  <p style={{ fontFamily: DM, fontSize: 15, color: '#8A8786', lineHeight: 1.7, margin: 0 }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* S3 overlay — slides up as S2 blurs out */}
        <div ref={s3Overlay} style={{ position: 'absolute', inset: 0, zIndex: 2, padding: '0 24px', display: 'flex', alignItems: 'center', transform: 'translateY(100vh)', pointerEvents: 'none' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
            <p style={{ fontFamily: DMM, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#444', marginBottom: 32 }}>THE PLATFORM</p>
            <h2 style={{ fontFamily: BB, fontSize: 'clamp(56px, 10vw, 120px)', color: '#F5F5F0', lineHeight: 0.95, margin: '0 0 32px', letterSpacing: '0.02em' }}>
              ONE PLATFORM.<br />EVERY TOOL<br /><span style={{ color: '#FF4500' }}>YOU NEED.</span>
            </h2>
            <p style={{ fontFamily: DM, fontSize: 18, color: '#555', lineHeight: 1.7, maxWidth: 540, margin: 0 }}>
              Pitch, distribute, plan, and grow — with AI that tells you what to do next.
            </p>
          </div>
        </div>
      </section>

      {/* Sticky stack: Artists → Managers → Labels → AI Layer */}
      <div style={{ marginTop: '-100vh', overflow: 'clip' }}>

        {/* S4: For Artists — Ink */}
        <section ref={s4} style={{ height: '100vh', padding: '0 24px', backgroundColor: '#0A0A0A', position: 'sticky', top: 0, borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
            <p style={{ fontFamily: DMM, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#444', marginBottom: 14 }}>FOR ARTISTS</p>
            <h2 style={{ fontFamily: BB, fontSize: 'clamp(40px, 6.5vw, 96px)', color: '#F5F5F0', lineHeight: 0.92, margin: '0 0 8px', letterSpacing: '0.02em' }}>YOUR AI MUSIC<br />CAREER MANAGER.</h2>
            <p style={{ fontFamily: DM, fontSize: 15, color: '#8A8786', margin: '0 0 20px' }}>Stop juggling tools. Start building your career.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              {ARTIST_FEATS.map(f => <FeatureCard key={f.t} t={f.t} b={f.b} theme="dark" />)}
            </div>
            <Link href="/signup?type=artist" style={ctaLink}>START FREE</Link>
          </div>
        </section>

        {/* S5: For Managers — White */}
        <section ref={s5} style={{ height: '100vh', padding: '0 24px', backgroundColor: '#F5F5F0', position: 'sticky', top: 0, borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
            <p style={{ fontFamily: DMM, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8786', marginBottom: 14 }}>FOR MANAGERS</p>
            <h2 style={{ fontFamily: BB, fontSize: 'clamp(40px, 6.5vw, 96px)', color: '#0A0A0A', lineHeight: 0.92, margin: '0 0 8px', letterSpacing: '0.02em' }}>YOUR ENTIRE ROSTER.<br />ONE DASHBOARD.</h2>
            <p style={{ fontFamily: DM, fontSize: 15, color: '#8A8786', margin: '0 0 20px' }}>Stop managing over text. Start managing with data.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              {MANAGER_FEATS.map(f => <FeatureCard key={f.t} t={f.t} b={f.b} theme="light" />)}
            </div>
            <Link href="/signup?type=manager" style={ctaLink}>GET MANAGER PLAN</Link>
          </div>
        </section>

        {/* S6: For Labels — Fire */}
        <section ref={s6} style={{ height: '100vh', padding: '0 24px', backgroundColor: '#FF4500', position: 'sticky', top: 0, borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
            <p style={{ fontFamily: DMM, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>FOR LABELS</p>
            <h2 style={{ fontFamily: BB, fontSize: 'clamp(40px, 6.5vw, 96px)', color: '#F5F5F0', lineHeight: 0.92, margin: '0 0 8px', letterSpacing: '0.02em' }}>FULL VISIBILITY INTO<br />YOUR OPERATION.</h2>
            <p style={{ fontFamily: DM, fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: '0 0 20px' }}>Know what every manager and every artist is doing. Always.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              {LABEL_FEATS.map(f => <FeatureCard key={f.t} t={f.t} b={f.b} theme="fire" />)}
            </div>
            <Link href="/signup?type=label" style={{ ...ctaLink, backgroundColor: '#0A0A0A', color: '#F5F5F0' }}>GET LABEL PLAN</Link>
          </div>
        </section>

        {/* S7: AI Layer — Ink */}
        <section ref={s7} style={{ height: '100vh', padding: '0 24px', backgroundColor: '#0A0A0A', position: 'sticky', top: 0, borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
            <p style={{ fontFamily: DMM, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#444', marginBottom: 14 }}>POWERED BY AI</p>
            <h2 style={{ fontFamily: BB, fontSize: 'clamp(48px, 8vw, 110px)', color: '#F5F5F0', lineHeight: 0.92, margin: '0 0 8px', letterSpacing: '0.02em' }}>ZOVO DOESN&apos;T<br />JUST SHOW YOU DATA.</h2>
            <p style={{ fontFamily: BB, fontSize: 'clamp(32px, 5vw, 72px)', color: '#8A8786', margin: '0 0 32px', lineHeight: 0.95, letterSpacing: '0.02em' }}>IT TELLS YOU WHAT TO DO WITH IT.</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {AI_CARDS.map(({ compare, action, zovo }) => (
                <div key={compare} style={{ flex: 1, minWidth: 240, background: '#111111', border: '1px solid #1A1A1A', borderRadius: 10, padding: '20px 22px' }}>
                  <p style={{ fontFamily: DM, fontSize: 15, color: '#8A8786', lineHeight: 1.7, margin: 0 }}>
                    <span style={{ fontFamily: DM, fontSize: 15, fontWeight: 600, color: '#F5F5F0' }}>{compare}</span>{' '}{action}{' '}
                    <span style={{ fontFamily: DM, fontSize: 15, color: '#FF4500', fontWeight: 600 }}>{zovo}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Pricing */}
      <section style={{ backgroundColor: '#F5F5F0', padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p style={{ fontFamily: DMM, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8786', marginBottom: 16 }}>PRICING</p>
          <h2 style={{ fontFamily: BB, fontSize: 'clamp(56px, 10vw, 120px)', color: '#0A0A0A', lineHeight: 0.9, margin: '0 0 56px', letterSpacing: '0.02em' }}>BUILT FOR<br />EVERY LEVEL.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10 }}>
            {PRICING.map(({ name, price, desc, feats, type, popular }) => (
              <div key={name} style={{ background: '#FFFFFF', border: popular ? '1px solid #FF4500' : '1px solid #E8E8E4', borderRadius: 12, padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
                {popular && (
                  <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: '#FF4500', color: '#F5F5F0', fontFamily: DMM, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4, whiteSpace: 'nowrap' }}>Most popular</div>
                )}
                <div>
                  <div style={{ fontFamily: BB, fontSize: 20, letterSpacing: '0.04em', color: '#0A0A0A', marginBottom: 2 }}>{name}</div>
                  <div style={{ fontFamily: BB, fontSize: 28, letterSpacing: '0.02em', color: '#0A0A0A', lineHeight: 1, marginBottom: 4 }}>{price}</div>
                  <div style={{ fontFamily: DM, fontSize: 12, color: '#8A8786', lineHeight: 1.4 }}>{desc}</div>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
                  {feats.map(f => (
                    <li key={f} style={{ fontFamily: DM, fontSize: 12, color: '#555', paddingLeft: 12, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: '#FF4500' }}>·</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href={`/signup?type=${type}`} style={{ display: 'block', textAlign: 'center', fontFamily: DMM, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', backgroundColor: popular ? '#FF4500' : 'rgba(0,0,0,0.04)', color: popular ? '#F5F5F0' : '#555', border: popular ? 'none' : '1px solid #E0E0E0', padding: '10px 8px', borderRadius: 8, textDecoration: 'none' }}>
                  GET STARTED
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* S8: Final CTA — pins 200vh */}
      <section ref={s8} style={{ height: '100vh', padding: '0 24px', backgroundColor: '#FF4500', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 700, width: '100%', textAlign: 'center' }}>
          <h2 style={{ fontFamily: BB, fontSize: 'clamp(48px, 9vw, 120px)', color: '#F5F5F0', lineHeight: 0.92, margin: '0 0 24px', letterSpacing: '0.02em' }}>
            READY TO RUN YOUR<br />MUSIC LIKE A BUSINESS?
          </h2>
          <p style={{ fontFamily: DM, fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: '0 0 40px' }}>
            Be one of the first independent artists, managers, and labels to run their music on Zovo.
          </p>
          <Link href="/signup" style={{ ...ctaLink, backgroundColor: '#0A0A0A', fontSize: 13, padding: '16px 48px', display: 'inline-block', marginBottom: 24 }}>GET STARTED FREE</Link>
          <p style={{ fontFamily: DMM, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            NO CREDIT CARD REQUIRED · FREE FOREVER · CANCEL ANYTIME
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #222', padding: '32px 24px', backgroundColor: '#0A0A0A' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontFamily: BB, fontSize: 18, color: '#444', letterSpacing: '0.04em' }}>ZOVO<span style={{ color: '#FF4500' }}>.</span></span>
          <div style={{ display: 'flex', gap: 24 }}>
            {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Sign in', '/login']].map(([label, href]) => (
              <a key={label} href={href} style={{ fontFamily: DMM, fontSize: 12, color: '#444', textDecoration: 'none' }}>{label}</a>
            ))}
          </div>
          <p style={{ fontFamily: DMM, fontSize: 12, color: '#444', margin: 0 }}>© 2026 Cole Ventures Group LLC</p>
        </div>
      </footer>

    </div>
  )
}
