import { LegalPageShell } from '@/components/legal-page-shell'

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      subtitle={`Last updated: ${new Date().toLocaleDateString()}`}
    >
      <section>
        <h2>1. Introduction</h2>
        <p>
          HoodGFX (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This
          Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use
          the HoodGFX platform on Robinhood Chain.
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <p>
          <strong>2.1 Wallet information.</strong> We collect and store wallet addresses when you connect to
          the Platform. This is required for authentication, minting, and Platform functionality.
        </p>
        <p>
          <strong>2.2 Transaction data.</strong> We collect information about activity on the Platform,
          including credit purchases, generation jobs, and minting activity.
        </p>
        <p>
          <strong>2.3 Usage data.</strong> We may collect technical information such as IP address, browser
          type, device information, and how you interact with the Platform.
        </p>
        <p>
          <strong>2.4 Content you create.</strong> We store content you generate or upload, including
          collection art, metadata, prompts, and related assets.
        </p>
        <p>
          <strong>2.5 Contact details.</strong> If you join the whitelist or contact support, we may collect
          optional email or social handles you provide.
        </p>
      </section>

      <section>
        <h2>3. How We Use Information</h2>
        <p>We use collected information to:</p>
        <ul>
          <li>Operate, maintain, and improve the HoodGFX Platform</li>
          <li>Process generations, deployments, and mints</li>
          <li>Manage whitelist access and account features</li>
          <li>Communicate about service updates and support</li>
          <li>Detect fraud, abuse, and security issues</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      <section>
        <h2>4. Sharing of Information</h2>
        <p>
          We do not sell your personal information. We may share information with service providers who help
          operate the Platform (for example hosting, databases, AI providers, and analytics), when required by
          law, or to protect the rights and safety of HoodGFX and its users.
        </p>
        <p>
          Blockchain transactions are public by nature. Wallet addresses and on-chain activity may be visible
          on Robinhood Chain and related explorers.
        </p>
      </section>

      <section>
        <h2>5. Data Retention</h2>
        <p>
          We retain information for as long as needed to provide the Platform, comply with legal requirements,
          resolve disputes, and enforce our agreements. You may request deletion of account data where
          applicable, subject to legal and operational limits.
        </p>
      </section>

      <section>
        <h2>6. Security</h2>
        <p>
          We use reasonable administrative and technical safeguards to protect information. No method of
          transmission or storage is fully secure. You are responsible for safeguarding your wallet and private
          keys.
        </p>
      </section>

      <section>
        <h2>7. Third-Party Services</h2>
        <p>
          The Platform may integrate third-party wallets, AI services, and blockchain infrastructure. Those
          services have their own privacy policies. HoodGFX is not responsible for third-party practices.
        </p>
      </section>

      <section>
        <h2>8. Children</h2>
        <p>
          HoodGFX is not intended for individuals under 18. We do not knowingly collect information from
          children.
        </p>
      </section>

      <section>
        <h2>9. Changes</h2>
        <p>
          We may update this Privacy Policy from time to time. Continued use of the Platform after changes
          means you accept the updated policy.
        </p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>
          For privacy questions, contact HoodGFX through the support channels listed on the Platform.
        </p>
      </section>
    </LegalPageShell>
  )
}
