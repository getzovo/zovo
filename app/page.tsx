'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'
import Link from 'next/link'

const EASE = [0.16, 1, 0.3, 1] as const

const STICKERS = [
  { name: '1100 Himself',       bg: '#F5F5F0',    border: 'none',                   color: '#0A0A0A', top: '12%', left: '6%',  rotate: -8,  rate: 0.02  },
  { name: 'Lil Pete',           bg: 'transparent', border: '1px solid #FF4500',      color: '#FF4500', top: '8%',  left: '28%', rotate: 4,   rate: 0.015 },
  { name: 'MGLulSmoke',         bg: 'transparent', border: '1px solid #F5F5F0',      color: '#F5F5F0', top: '10%', left: '55%', rotate: -3,  rate: 0.025 },
  { name: 'Verde Babii',        bg: '#F5F5F0',    border: 'none',                   color: '#0A0A0A', top: '16%', left: '78%', rotate: 7,   rate: 0.018 },
  { name: 'SSrich33',           bg: 'transparent', border: '1px solid #444',         color: '#888',    top: '32%', left: '3%',  rotate: -11, rate: 0.012 },
  { name: 'Mitchell',           bg: '#F5F5F0',    border: 'none',                   color: '#0A0A0A', top: '25%', left: '82%', rotate: 6,   rate: 0.022 },
  { name: 'Larry June',         bg: 'transparent', border: '1px solid #FF4500',      color: '#FF4500', top: '60%', left: '5%',  rotate: -5,  rate: 0.03  },
  { name: 'Babyfxce E',         bg: 'transparent', border: '1px solid #F5F5F0',      color: '#F5F5F0', top: '55%', left: '80%', rotate: 9,   rate: 0.017 },
  { name: 'PayGotti',           bg: '#F5F5F0',    border: 'none',                   color: '#0A0A0A', top: '75%', left: '12%', rotate: 3,   rate: 0.024 },
  { name: 'Boston Real Richey', bg: 'transparent', border: '1px solid #444',         color: '#888',    top: '78%', left: '35%', rotate: -7,  rate: 0.013 },
  { name: '1900 Rugrat',        bg: 'transparent', border: '1px solid #F5F5F0',      color: '#F5F5F0', top: '80%', left: '58%', rotate: 5,   rate: 0.019 },
  { name: 'Lil Yee',            bg: '#F5F5F0',    border: 'none',                   color: '#0A0A0A', top: '74%', left: '82%', rotate: -9,  rate: 0.028 },
  { name: 'OG Peso',            bg: 'transparent', border: '1px solid #FF4500',      color: '#FF4500', top: '42%', left: '2%',  rotate: 10,  rate: 0.016 },
  { name: 'Yungmac',            bg: 'transparent', border: '1px solid #F5F5F0',      color: '#F5F5F0', top: '45%', left: '84%', rotate: -6,  rate: 0.021 },
  { name: '4hunna Rich',        bg: '#F5F5F0',    border: 'none',                   color: '#0A0A0A', top: '30%', left: '20%', rotate: -12, rate: 0.014 },
  { name: 'TreyStackz',         bg: 'transparent', border: '1px solid #444',         color: '#888',    top: '28%', left: '70%', rotate: 8,   rate: 0.026 },
]


const FEATURES = [
  {
    label: '01 / PITCH',
    headline: 'PITCH CURATORS\nIN SECONDS.',
    body: 'AI writes the pitch. You approve it. Sent directly from Zovo to every curator on your list.',
    bg: '#FF4500',
    color: '#F5F5F0',
    sub: 'rgba(245,245,240,0.55)',
  },
  {
    label: '02 / CATALOG',
    headline: 'YOUR CATALOG.\nYOUR PACE.',
    body: 'Full release history, cadence analysis, and AI strategy for your next drop. All in one place.',
    bg: '#F5F5F0',
    color: '#0A0A0A',
    sub: '#888',
  },
  {
    label: '03 / STRATEGY',
    headline: 'MONTHLY STRATEGY\nBRIEF.',
    body: "Every month, Zovo tells you what's working, what to fix, and what to do next.",
    bg: '#0A0A0A',
    color: '#F5F5F0',
    sub: '#555',
  },
  {
    label: '04 / DISTRIBUTION',
    headline: 'DISTRIBUTION.\nDONE.',
    body: 'Submit to every major DSP directly through Zovo. No extra accounts. No middlemen.',
    bg: '#FF4500',
    color: '#F5F5F0',
    sub: 'rgba(245,245,240,0.55)',
  },
]

const wordVar = {
  hidden: { opacity: 0, y: 40 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}
const headlineContainer = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }

export default function Home() {
  const [mouse, setMouse]       = useState({ x: 0, y: 0 })
  const [isTouch, setIsTouch]   = useState(false)
  const [email, setEmail]       = useState('')
  const [status, setStatus]     = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [s2Active, setS2Active] = useState(false)

  const heroCorners   = useRef<HTMLDivElement>(null)
  const cornersTop    = useRef<HTMLDivElement>(null)
  const cornersBottom = useRef<HTMLDivElement>(null)
  const s1            = useRef<HTMLElement>(null)
  const s2          = useRef<HTMLElement>(null)
  const s2Content   = useRef<HTMLDivElement>(null)
  const s3Overlay   = useRef<HTMLDivElement>(null)
  const s4 = useRef<HTMLElement>(null)
  const s5 = useRef<HTMLElement>(null)
  const s6 = useRef<HTMLElement>(null)
  const s7 = useRef<HTMLElement>(null)
  const s8 = useRef<HTMLElement>(null)

  const featureRefs = [s4, s5, s6, s7]

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis({ duration: 1.2 })
    const rafFn = (time: number) => lenis.raf(time * 1000)
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(rafFn)
    gsap.ticker.lagSmoothing(0)

    const ctx = gsap.context(() => {
      // S2 pin: 300vh total
      // blurProg completes at progress 0.5 (150vh), slideProg completes at ~0.58 (175vh)
      // progress 0.58→1.0 (~125vh) is the S3 hold period before pin releases
      ScrollTrigger.create({
        trigger: s2.current,
        start: 'center center',
        end: '+=300%',
        pin: true,
        pinSpacing: true,
        scrub: true,
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

      // S8: pin only, no blur
      const el = s8.current
      if (el) {
        ScrollTrigger.create({
          trigger: el,
          start: 'top top',
          end: '+=200%',
          pin: true,
          pinSpacing: true,
        })
      }

      // Corner colors: top corners fire at 'top top', bottom corners fire earlier at 'top bottom'
      const setTop    = (c: string) => { if (cornersTop.current)    cornersTop.current.style.color    = c }
      const setBottom = (c: string) => { if (cornersBottom.current) cornersBottom.current.style.color = c }
      // S5 (#F5F5F0 bg) → black
      ScrollTrigger.create({ trigger: s5.current, start: 'top top',
        onEnter: () => setTop('#0A0A0A'),    onLeaveBack: () => setTop('#F5F5F0') })
      ScrollTrigger.create({ trigger: s5.current, start: 'top bottom',
        onEnter: () => setBottom('#0A0A0A'), onLeaveBack: () => setBottom('#F5F5F0') })
      // S6 (#0A0A0A bg) → white
      ScrollTrigger.create({ trigger: s6.current, start: 'top top',
        onEnter: () => setTop('#F5F5F0'),    onLeaveBack: () => setTop('#0A0A0A') })
      ScrollTrigger.create({ trigger: s6.current, start: 'top bottom',
        onEnter: () => setBottom('#F5F5F0'), onLeaveBack: () => setBottom('#0A0A0A') })
      // S7 (#FF4500 bg) → black
      ScrollTrigger.create({ trigger: s7.current, start: 'top top',
        onEnter: () => setTop('#0A0A0A'),    onLeaveBack: () => setTop('#F5F5F0') })
      ScrollTrigger.create({ trigger: s7.current, start: 'top bottom',
        onEnter: () => setBottom('#0A0A0A'), onLeaveBack: () => setBottom('#F5F5F0') })
      // S8 (#F5F5F0 bg) → black (stays black; leaveBack returns to S7's black)
      ScrollTrigger.create({ trigger: s8.current, start: 'top top',
        onEnter: () => setTop('#0A0A0A'),    onLeaveBack: () => setTop('#0A0A0A') })
      ScrollTrigger.create({ trigger: s8.current, start: 'top bottom',
        onEnter: () => setBottom('#0A0A0A'), onLeaveBack: () => setBottom('#0A0A0A') })

      // Framer Motion trigger for S2 words (fires before S2 pin starts)
      ScrollTrigger.create({
        trigger: s2.current,
        start: 'top 80%',
        onEnter:     () => setS2Active(true),
        onLeaveBack: () => setS2Active(false),
      })
    })

    return () => {
      ctx.revert()
      lenis.destroy()
      gsap.ticker.remove(rafFn)
    }
  }, [])

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  useEffect(() => {
    if (isTouch) return
    const fn = (e: MouseEvent) => {
      setMouse({ x: e.clientX - window.innerWidth / 2, y: e.clientY - window.innerHeight / 2 })
    }
    window.addEventListener('mousemove', fn)
    return () => window.removeEventListener('mousemove', fn)
  }, [isTouch])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStatus(res.ok || res.status === 409 ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const BB  = "'Bebas Neue', sans-serif"
  const DM  = "'DM Sans', sans-serif"
  const DMM = "'DM Mono', monospace"

  return (
    <div style={{ backgroundColor: '#0A0A0A', color: '#F5F5F0' }}>

      {/* ── Corner navigation — top and bottom groups have independent color refs ── */}
      <div ref={heroCorners} style={{ position: 'fixed', inset: 0, zIndex: 99, pointerEvents: 'none' }}>
        <div ref={cornersTop} style={{ color: '#F5F5F0' }}>
          <span style={{
            position: 'absolute', top: 24, left: 24,
            fontFamily: DMM, fontSize: 11, letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            FOR INDEPENDENT ARTISTS
          </span>
          <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto' }}>
            <Link href="/login" style={{
              fontFamily: DMM, fontSize: 11, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'inherit',
              textDecoration: 'none',
            }}>
              LOGIN
            </Link>
            <Link href="/signup" style={{
              fontFamily: DMM, fontSize: 11, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: '#F5F5F0',
              textDecoration: 'none', backgroundColor: '#FF4500',
              borderRadius: 999, padding: '5px 14px',
            }}>
              SIGN UP
            </Link>
          </div>
        </div>
        <div ref={cornersBottom} style={{ color: '#F5F5F0' }}>
          <span style={{
            position: 'absolute', bottom: 24, left: 24,
            fontFamily: DMM, fontSize: 11, letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            ZOVO — 2026
          </span>
          <span style={{
            position: 'absolute', bottom: 24, right: 24,
            fontFamily: DMM, fontSize: 11, letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            SAN FRANCISCO, CA
          </span>
        </div>
      </div>

      {/* ── S1: Hero — normal flow, no pin ── */}
      <section ref={s1} style={{
        height: '100vh', position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#0A0A0A',
      }}>
        <h1 style={{
          fontFamily: BB,
          fontSize: 'clamp(80px, 18vw, 160px)',
          color: '#F5F5F0', lineHeight: 1, position: 'relative', zIndex: 2,
          userSelect: 'none', letterSpacing: '0.04em', margin: 0,
        }}>
          ZOVO<span style={{ color: '#FF4500' }}>.</span>
        </h1>

        {STICKERS.map((s) => (
          <span key={s.name} style={{
            position: 'absolute', top: s.top, left: s.left, zIndex: 1,
            transform: `translateX(${mouse.x * s.rate}px) translateY(${mouse.y * s.rate}px) rotate(${s.rotate}deg)`,
            transition: 'transform 0.1s ease-out',
            fontFamily: DM, fontSize: 12, fontWeight: 500,
            padding: '5px 14px', borderRadius: 20,
            backgroundColor: s.bg, border: s.border, color: s.color,
            whiteSpace: 'nowrap', pointerEvents: 'none',
          }}>
            {s.name}
          </span>
        ))}

        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          fontFamily: DMM, fontSize: 10, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: '#444',
        }}>
          scroll
          <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
            <path d="M6 1v13M1 10l5 5 5-5" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* ── S2: STOP RUNNING — pins 300vh; S3 slides up from below during blur-out ── */}
      <section ref={s2} style={{
        height: '100vh', position: 'relative',
        backgroundColor: '#0A0A0A',
      }}>
        {/* S2 main content — blur + opacity applied here so overlay is unaffected */}
        <div ref={s2Content} style={{
          position: 'relative', zIndex: 0,
          height: '100%', padding: '0 24px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          willChange: 'filter, opacity',
        }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%', textAlign: 'left' }}>
            <motion.div
              variants={headlineContainer}
              initial="hidden"
              animate={s2Active ? 'show' : 'hidden'}
              style={{ marginBottom: 40 }}
            >
              {(['STOP RUNNING', 'YOUR CAREER OUT OF', 'FIVE TABS'] as const).map((line) => (
                <motion.div key={line} variants={wordVar} style={{
                  fontFamily: BB, fontSize: 'clamp(60px, 9vw, 140px)',
                  color: '#F5F5F0', lineHeight: 0.9,
                  display: 'block', whiteSpace: 'nowrap',
                }}>
                  {line}
                </motion.div>
              ))}
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={s2Active ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.75, ease: EASE }}
              style={{ fontFamily: DM, fontSize: 18, color: '#888', lineHeight: 1.7, maxWidth: 600, margin: 0 }}
            >
              Spotify for Artists. SubmitHub. DistroKid. A spreadsheet. Your email.{' '}
              None of them talk to each other.
            </motion.p>
          </div>
        </div>

        {/* S3 overlay — slides up from below as S2 blurs out */}
        <div ref={s3Overlay} style={{
          position: 'absolute', inset: 0, zIndex: 2, padding: '0 24px',
          display: 'flex', alignItems: 'center',
          transform: 'translateY(100vh)', pointerEvents: 'none',
        }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%', textAlign: 'left' }}>
            <p style={{ fontFamily: DMM, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#444', marginBottom: 32 }}>
              The platform
            </p>
            <h2 style={{
              fontFamily: BB,
              fontSize: 'clamp(56px, 10vw, 120px)',
              color: '#F5F5F0', lineHeight: 0.95, margin: '0 0 32px',
              letterSpacing: '0.02em',
            }}>
              WHAT ZOVO DOES<br />FOR <span style={{ color: '#FF4500' }}>YOUR CAREER</span>
            </h2>
            <p style={{ fontFamily: DM, fontSize: 18, color: '#555', lineHeight: 1.7, maxWidth: 580, margin: 0 }}>
              One dashboard. Every tool you need to pitch, release, and grow —
              without the admin spiral.
            </p>
          </div>
        </div>
      </section>

      {/* ── S4–S7: Feature sections — negative margin closes the 100vh gap left by S2's pinSpacing ── */}
      <div style={{ marginTop: '-100vh', overflow: 'clip' }}>
        {FEATURES.map((f, i) => (
          <section key={f.label} ref={featureRefs[i]} style={{
            height: '100vh', padding: '0 24px',
            backgroundColor: f.bg,
            position: 'sticky', top: 0,
            borderRadius: '12px 12px 0 0',
            display: 'flex', alignItems: 'center',
          }}>
            <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
              <p style={{ fontFamily: DMM, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: f.sub, marginBottom: 40 }}>
                {f.label}
              </p>
              <h2 style={{
                fontFamily: BB,
                fontSize: 'clamp(64px, 12vw, 140px)',
                color: f.color, lineHeight: 0.9, margin: '0 0 40px',
                letterSpacing: '0.02em', whiteSpace: 'pre-line',
              }}>
                {f.headline}
              </h2>
              <p style={{ fontFamily: DM, fontSize: 20, color: f.sub, lineHeight: 1.6, maxWidth: 520, margin: 0 }}>
                {f.body}
              </p>
            </div>
          </section>
        ))}
      </div>

      {/* ── S8: GET IN EARLY ── */}
      <section ref={s8} style={{
        height: '100vh', padding: '0 24px',
        backgroundColor: '#F5F5F0', willChange: 'filter, opacity',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto', width: '100%' }}>
          <p style={{ fontFamily: DMM, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', marginBottom: 24 }}>
            Early access
          </p>
          <h2 style={{
            fontFamily: BB,
            fontSize: 'clamp(72px, 14vw, 140px)',
            color: '#0A0A0A', lineHeight: 0.9, marginBottom: 24,
            letterSpacing: '0.02em',
          }}>
            GET IN<br />EARLY.
          </h2>
          <p style={{ fontFamily: DM, fontSize: 18, color: '#444', lineHeight: 1.7, marginBottom: 48 }}>
            Zovo is in early access. Free to start. Built for independent artists.
          </p>

          {status === 'done' ? (
            <p style={{ fontFamily: BB, fontSize: 36, color: '#FF4500', letterSpacing: '0.04em', margin: 0 }}>
              You&apos;re in.
            </p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your email"
                  required
                  className="beta-input"
                  style={{
                    width: '100%', background: 'transparent',
                    border: 'none', borderBottom: '1px solid #0A0A0A',
                    outline: 'none', borderRadius: 0,
                    fontFamily: DMM, fontSize: 15,
                    color: '#0A0A0A', padding: '10px 0',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  fontFamily: DMM, fontSize: 12,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  backgroundColor: '#0A0A0A', color: '#F5F5F0',
                  padding: '11px 24px', border: 'none',
                  cursor: 'pointer', borderRadius: 0, whiteSpace: 'nowrap',
                }}
              >
                {status === 'loading' ? '...' : 'JOIN THE BETA'}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p style={{ fontFamily: DMM, fontSize: 12, color: '#FF4500', marginTop: 12 }}>
              Something went wrong. Try again.
            </p>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #222', padding: '32px 24px', backgroundColor: '#0A0A0A' }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>
          <span style={{ fontFamily: BB, fontSize: 18, color: '#444', letterSpacing: '0.04em' }}>
            ZOVO<span style={{ color: '#FF4500' }}>.</span>
          </span>
          <div style={{ display: 'flex', gap: 24 }}>
            {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Sign in', '/login']].map(([label, href]) => (
              <a key={label} href={href} style={{ fontFamily: DMM, fontSize: 12, color: '#444', textDecoration: 'none' }}>
                {label}
              </a>
            ))}
          </div>
          <p style={{ fontFamily: DMM, fontSize: 12, color: '#444', margin: 0 }}>
            © 2026 Cole Ventures Group LLC
          </p>
        </div>
      </footer>

    </div>
  )
}
