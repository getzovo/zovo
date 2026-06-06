import Link from 'next/link'

export const metadata = { title: 'Privacy Policy — Zovo' }

const DM  = "'DM Sans', sans-serif"
const DMM = "'DM Mono', monospace"
const BB  = "'Bebas Neue', sans-serif"

export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: '#0A0A0A', color: '#F5F5F0', minHeight: '100vh', fontFamily: DM }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px 120px' }}>

        <div style={{ marginBottom: 64 }}>
          <Link href="/" style={{ fontFamily: BB, fontSize: 22, color: '#F5F5F0', textDecoration: 'none', letterSpacing: '0.04em' }}>
            ZOVO<span style={{ color: '#FF4500' }}>.</span>
          </Link>
        </div>

        <p style={{ fontFamily: DMM, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', marginBottom: 16 }}>
          Legal
        </p>
        <h1 style={{ fontFamily: BB, fontSize: 'clamp(48px, 8vw, 80px)', color: '#F5F5F0', lineHeight: 0.95, marginBottom: 16, letterSpacing: '0.02em' }}>
          PRIVACY POLICY
        </h1>
        <p style={{ fontFamily: DMM, fontSize: 11, color: '#555', marginBottom: 64 }}>
          Last updated: June 2026
        </p>

        <Section title="1. Overview">
          This Privacy Policy describes how Cole Ventures Group LLC (&quot;Zovo,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, and shares information about you when you use Zovo at getzovo.app. By using Zovo, you agree to the practices described here.
        </Section>

        <Section title="2. Information We Collect">
          <Subsection title="Account information">
            When you create an account, we collect your name and email address. If you sign up via a third-party OAuth provider, we receive basic profile information from that provider.
          </Subsection>
          <Subsection title="Spotify data">
            When you connect your Spotify account, we receive OAuth access and refresh tokens and the artist/catalog data you authorize us to read — including artist stats, track history, and streaming metrics. We use this data only to power Zovo&apos;s features and never sell it.
          </Subsection>
          <Subsection title="Payment information">
            Payments are processed by Stripe. We do not store your card number or banking details. We retain a Stripe customer ID and subscription status.
          </Subsection>
          <Subsection title="Usage data">
            We collect standard server logs and usage events — pages visited, features used, errors encountered — to operate and improve the service. This data is not linked to your identity for advertising purposes.
          </Subsection>
          <Subsection title="Communications">
            If you join the waitlist or contact us, we store your email address to respond and to send you product updates. You can unsubscribe at any time.
          </Subsection>
        </Section>

        <Section title="3. How We Use Your Information">
          <ul style={{ paddingLeft: 20, lineHeight: 1.9, color: '#888' }}>
            <li>To create and manage your Zovo account</li>
            <li>To deliver the core product features (pitching, catalog, strategy briefs, distribution)</li>
            <li>To process payments and manage your subscription</li>
            <li>To send transactional emails (receipts, account notifications) via Resend</li>
            <li>To analyze usage patterns and improve the product</li>
            <li>To comply with legal obligations</li>
          </ul>
          <p style={{ color: '#888', marginTop: 16 }}>
            We do not use your data for behavioral advertising and we do not sell your personal information to third parties.
          </p>
        </Section>

        <Section title="4. Third-Party Services">
          <p style={{ color: '#888', marginBottom: 16 }}>
            Zovo integrates with the following third-party services. Each has its own privacy policy.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: DMM, fontSize: 12, color: '#888' }}>
            <tbody>
              {[
                ['Spotify', 'Artist data and OAuth authentication'],
                ['Stripe', 'Payment processing and subscription management'],
                ['Supabase', 'Database, authentication, and file storage'],
                ['Resend', 'Transactional email delivery'],
                ['Vercel', 'Hosting and serverless infrastructure'],
                ['Anthropic', 'AI-generated pitch drafts and strategy briefs'],
              ].map(([service, purpose]) => (
                <tr key={service} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '12px 0', width: '30%', color: '#F5F5F0' }}>{service}</td>
                  <td style={{ padding: '12px 0' }}>{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="5. Data Retention">
          We retain your account data for as long as your account is active. Spotify tokens are refreshed automatically and deleted when you disconnect Spotify or delete your account. Payment records are retained as required by applicable law. You may request deletion of your account and associated data at any time by emailing admin@getzovo.app.
        </Section>

        <Section title="6. Security">
          We use industry-standard practices to protect your data, including encrypted connections (TLS), secure credential storage via Supabase, and access controls. No system is perfectly secure; if you believe your account has been compromised, contact us immediately.
        </Section>

        <Section title="7. Your Rights">
          Depending on your location, you may have the right to access, correct, or delete your personal data, or to object to or restrict certain processing. To exercise any of these rights, email us at admin@getzovo.app. We will respond within 30 days.
        </Section>

        <Section title="8. Children">
          Zovo is not directed to children under 13. We do not knowingly collect personal information from anyone under 13. If you believe a child has provided us with personal information, contact us and we will delete it.
        </Section>

        <Section title="9. Changes to This Policy">
          We may update this policy from time to time. Material changes will be communicated by updating the &quot;Last updated&quot; date above and, where appropriate, by email notification.
        </Section>

        <Section title="10. Contact">
          <p style={{ color: '#888' }}>
            Cole Ventures Group LLC<br />
            San Francisco, CA<br />
            <a href="mailto:admin@getzovo.app" style={{ color: '#FF4500', textDecoration: 'none' }}>admin@getzovo.app</a>
          </p>
        </Section>

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <h2 style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#F5F5F0', marginBottom: 16, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {title}
      </h2>
      <div style={{ fontSize: 15, lineHeight: 1.8, color: '#888' }}>
        {children}
      </div>
    </div>
  )
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ color: '#F5F5F0', marginBottom: 4, fontSize: 14 }}>{title}</p>
      <p>{children}</p>
    </div>
  )
}
