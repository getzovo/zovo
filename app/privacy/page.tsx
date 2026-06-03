import Link from 'next/link'
import Wordmark from '@/components/Wordmark'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-6" style={{ borderTop: '1px solid #E2DED8' }}>
      <h2 className="text-xl mb-3" style={{ fontFamily: 'Fraunces, serif' }}>{title}</h2>
      <div className="text-sm leading-relaxed" style={{ color: '#3d3c3c' }}>{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: '#FAF8F5', minHeight: '100vh' }}>
      <nav className="sticky top-0 z-10 flex items-center justify-between px-8 py-4" style={{ backgroundColor: '#FAF8F5', borderBottom: '1px solid #E2DED8' }}>
        <Link href="/"><Wordmark /></Link>
        <Link href="/dashboard" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#111010' }}>Dashboard →</Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <p className="label mb-2">Legal</p>
        <h1 className="text-5xl mb-2" style={{ fontFamily: 'Fraunces, serif', letterSpacing: '-0.03em' }}>Privacy Policy</h1>
        <p className="label mb-8" style={{ color: '#8A8786' }}>Last updated June 2, 2026 · Cole Ventures Group LLC</p>

        <Section title="Overview">
          <p>Zovo (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is operated by Cole Ventures Group LLC, a California limited liability company doing business as Zovo. This Privacy Policy explains how we collect, use, and protect your information when you use our platform at getzovo.app.</p>
        </Section>

        <Section title="What We Collect">
          <ul className="space-y-2">
            <li><span style={{ color: '#E8440A' }}>—</span> <strong>Account information:</strong> Your email address and password when you create an account.</li>
            <li><span style={{ color: '#E8440A' }}>—</span> <strong>Spotify data:</strong> With your authorization, we access your Spotify account data including recently played tracks, playback state, top artists, and profile information.</li>
            <li><span style={{ color: '#E8440A' }}>—</span> <strong>Usage data:</strong> Pages visited, features used, and actions taken within the platform.</li>
            <li><span style={{ color: '#E8440A' }}>—</span> <strong>Payment information:</strong> Processed securely by Stripe. We do not store credit card numbers.</li>
            <li><span style={{ color: '#E8440A' }}>—</span> <strong>Support communications:</strong> Messages you send to our support team.</li>
          </ul>
        </Section>

        <Section title="How We Use Your Information">
          <ul className="space-y-2">
            <li><span style={{ color: '#E8440A' }}>—</span> To provide and improve the Zovo platform and features</li>
            <li><span style={{ color: '#E8440A' }}>—</span> To display your Spotify catalog and listening history on your dashboard</li>
            <li><span style={{ color: '#E8440A' }}>—</span> To generate AI-powered pitch emails personalized to your music</li>
            <li><span style={{ color: '#E8440A' }}>—</span> To process payments and manage your subscription</li>
            <li><span style={{ color: '#E8440A' }}>—</span> To send transactional emails (receipts, account notifications)</li>
          </ul>
        </Section>

        <Section title="Spotify Data Practices">
          <p className="mb-3">We access your Spotify data only through OAuth scopes you explicitly authorize. Specifically:</p>
          <ul className="space-y-2">
            <li><span style={{ color: '#E8440A' }}>—</span> We do not sell or transfer your Spotify data to third parties.</li>
            <li><span style={{ color: '#E8440A' }}>—</span> We do not use your Spotify data to train AI models or for advertising.</li>
            <li><span style={{ color: '#E8440A' }}>—</span> You can revoke Zovo&apos;s Spotify access at any time via your Spotify account settings.</li>
            <li><span style={{ color: '#E8440A' }}>—</span> Spotify tokens are deleted within 30 days of account deletion.</li>
          </ul>
        </Section>

        <Section title="How We Share Information">
          <p>We do not sell your personal information. We share data only with service providers necessary to operate Zovo: Supabase (database), Stripe (payments), Resend (email delivery), and Anthropic (AI pitch generation). Each provider processes data only as directed by us.</p>
        </Section>

        <Section title="Data Retention">
          <p>We retain your data for as long as your account is active. If you delete your account, we delete your personal data within 30 days, except where required by law.</p>
        </Section>

        <Section title="Security">
          <p>We use industry-standard security practices including encrypted connections (HTTPS), hashed passwords, and row-level security on our database. No system is perfectly secure, and we cannot guarantee absolute security.</p>
        </Section>

        <Section title="Your Rights">
          <p>You may access, correct, or delete your personal data at any time by contacting us at support@getzovo.app or through the Settings page in your account.</p>
        </Section>

        <Section title="Children&apos;s Privacy">
          <p>Zovo is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13.</p>
        </Section>

        <Section title="Changes to This Policy">
          <p>We may update this policy periodically. We will notify you of significant changes via email or a notice in the platform.</p>
        </Section>

        <Section title="Contact">
          <p>For privacy questions, contact us at <a href="mailto:support@getzovo.app" style={{ color: '#E8440A' }}>support@getzovo.app</a>. Cole Ventures Group LLC, EIN 42-2880704, California.</p>
        </Section>
      </main>

      <footer className="px-8 py-6 flex items-center justify-between" style={{ borderTop: '1px solid #E2DED8' }}>
        <Wordmark size="sm" />
        <div className="flex items-center gap-4 text-sm" style={{ color: '#8A8786' }}>
          <Link href="/terms" style={{ color: '#8A8786' }}>Terms</Link>
          <a href="mailto:support@getzovo.app" style={{ color: '#8A8786' }}>support@getzovo.app</a>
        </div>
      </footer>
    </div>
  )
}
