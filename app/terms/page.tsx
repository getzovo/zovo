import Link from 'next/link'

export const metadata = { title: 'Terms of Service — Zovo' }

const DM  = "'DM Sans', sans-serif"
const DMM = "'DM Mono', monospace"
const BB  = "'Bebas Neue', sans-serif"

export default function TermsPage() {
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
          TERMS OF SERVICE
        </h1>
        <p style={{ fontFamily: DMM, fontSize: 11, color: '#555', marginBottom: 64 }}>
          Last updated: June 2026
        </p>

        <Section title="1. Acceptance of Terms">
          By accessing or using Zovo at getzovo.app, you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree, do not use Zovo. These Terms apply to all users, including free and paid subscribers. Cole Ventures Group LLC (&quot;we,&quot; &quot;us,&quot; or &quot;Zovo&quot;) reserves the right to update these Terms at any time.
        </Section>

        <Section title="2. Eligibility">
          You must be at least 18 years old to use Zovo. By using the service, you represent that you are 18 or older and have the legal capacity to enter into a binding agreement.
        </Section>

        <Section title="3. Subscription Plans">
          <p style={{ marginBottom: 16 }}>Zovo offers the following subscription tiers:</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#888' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #222' }}>
                <th style={{ padding: '10px 0', textAlign: 'left', color: '#F5F5F0' }}>Plan</th>
                <th style={{ padding: '10px 0', textAlign: 'left', color: '#F5F5F0' }}>Price</th>
                <th style={{ padding: '10px 0', textAlign: 'left', color: '#F5F5F0' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Free', '$0 / mo', 'Basic access, limited pitches per month'],
                ['Artist', '$29 / mo', 'Full pitching, catalog, and monthly strategy brief'],
                ['Pro', '$149 / mo', 'Everything in Artist plus distribution and priority support'],
              ].map(([plan, price, desc]) => (
                <tr key={plan} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '12px 0', color: '#F5F5F0' }}>{plan}</td>
                  <td style={{ padding: '12px 0', whiteSpace: 'nowrap' }}>{price}</td>
                  <td style={{ padding: '12px 0' }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: 16 }}>
            Plan features and pricing may change. We will provide at least 30 days&apos; notice of any price increases to existing subscribers.
          </p>
        </Section>

        <Section title="4. Payment and Billing">
          All payments are processed by Stripe. By subscribing to a paid plan, you authorize us to charge your payment method on a recurring basis at the then-current rate. Billing occurs at the start of each billing period. You are responsible for all applicable taxes. If your payment fails, we may suspend your account until payment is resolved.
        </Section>

        <Section title="5. Refund Policy">
          <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
            <li><strong style={{ color: '#F5F5F0' }}>Monthly plans:</strong> No refunds. You may cancel at any time and retain access through the end of your current billing period.</li>
            <li><strong style={{ color: '#F5F5F0' }}>Annual plans:</strong> Prorated refunds are available within the first 30 days. After 30 days, no refunds are issued.</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            To request a refund or cancel your subscription, email admin@getzovo.app or use the account settings page.
          </p>
        </Section>

        <Section title="6. Acceptable Use">
          <p style={{ marginBottom: 12 }}>You agree not to:</p>
          <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
            <li>Use Zovo for any unlawful purpose or in violation of any applicable law</li>
            <li>Attempt to gain unauthorized access to any part of the service or its systems</li>
            <li>Reverse-engineer, decompile, or disassemble any part of the service</li>
            <li>Use automated means to scrape, crawl, or extract data from the platform</li>
            <li>Impersonate another person or entity</li>
            <li>Submit false, misleading, or harmful content through the platform</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            We reserve the right to suspend or terminate accounts that violate these provisions.
          </p>
        </Section>

        <Section title="7. Intellectual Property">
          Zovo and all associated content, branding, and technology are owned by Cole Ventures Group LLC. Your account data and uploaded content remain yours. You grant us a limited license to use your content solely to provide the service. We do not claim ownership of your music, metadata, or artist materials.
        </Section>

        <Section title="8. Third-Party Services">
          Zovo integrates with Spotify, Stripe, Supabase, Resend, and other third-party services. Your use of those services is subject to their respective terms. We are not responsible for the actions or availability of third-party platforms.
        </Section>

        <Section title="9. Disclaimers">
          Zovo is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied. We do not warrant that the service will be uninterrupted, error-free, or free of viruses. AI-generated content (pitch drafts, strategy briefs) is provided as a starting point and should be reviewed before use. We make no guarantees about placement outcomes, streaming results, or business outcomes.
        </Section>

        <Section title="10. Limitation of Liability">
          To the fullest extent permitted by law, Cole Ventures Group LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of or inability to use the service. Our total liability to you for any claim arising out of or relating to these Terms or the service shall not exceed the amount you paid us in the 12 months preceding the claim.
        </Section>

        <Section title="11. Termination">
          You may delete your account at any time. We may suspend or terminate your account if you violate these Terms, if required by law, or at our discretion with 30 days&apos; notice. Upon termination, your right to use the service ceases immediately. Provisions that by their nature should survive termination will do so.
        </Section>

        <Section title="12. Governing Law">
          These Terms are governed by the laws of the State of California, without regard to its conflict of law provisions. Any disputes shall be resolved in the state or federal courts located in San Francisco County, California.
        </Section>

        <Section title="13. Contact">
          <p>
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
