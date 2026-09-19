import { LegalPageShell } from '@/components/legal-page-shell'

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Terms and Conditions"
      subtitle={`Last updated: ${new Date().toLocaleDateString()}`}
    >
      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using HoodGFX (the &quot;Platform&quot;), you agree to these Terms and Conditions
          (&quot;Terms&quot;). If you do not agree, do not use the Platform. Continued use after updates means
          you accept the revised Terms.
        </p>
      </section>

      <section>
        <h2>2. The Platform</h2>
        <p>
          HoodGFX is an NFT creation and launch studio on Robinhood Chain. Features may include AI-assisted
          generation, collection tools, marketing utilities (such as Sticker Maker and Video Maker), credits,
          minting, and related services. Features may change, be limited, or be unavailable at any time.
        </p>
      </section>

      <section>
        <h2>3. Eligibility</h2>
        <p>
          You must be at least 18 years old and able to form a binding contract. You are responsible for
          complying with laws that apply to you, including those governing digital assets and blockchain use.
        </p>
      </section>

      <section>
        <h2>4. Accounts and Wallets</h2>
        <p>
          Access may require connecting a compatible wallet. You are solely responsible for your wallet,
          private keys, seed phrases, and all activity under your address. HoodGFX never asks for your private
          keys and is not liable for lost access, compromised wallets, or unauthorized transactions.
        </p>
      </section>

      <section>
        <h2>5. Credits and Payments</h2>
        <p>
          Some features require credits or on-chain payments. Fees, credit costs, and payment methods may
          change. Blockchain transactions are generally irreversible. Unless required by law, payments and
          credit purchases are final.
        </p>
      </section>

      <section>
        <h2>6. User Content and NFTs</h2>
        <p>
          You retain rights in original content you provide, subject to licenses needed for HoodGFX to operate
          the Platform (including storing, processing, displaying, and minting related assets). You represent
          that you have rights to all prompts, images, and materials you submit, and that your use does not
          infringe others&apos; rights.
        </p>
        <p>
          Minting an NFT does not guarantee ownership of underlying intellectual property beyond what is
          expressly granted on-chain or in writing. Digital assets may have no value and can lose value.
        </p>
      </section>

      <section>
        <h2>7. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Platform for illegal, fraudulent, or abusive activity</li>
          <li>Attempt to disrupt, reverse engineer, or overload the Platform</li>
          <li>Upload infringing, harmful, or prohibited content</li>
          <li>Misrepresent identity, ownership, or affiliation</li>
          <li>Bypass access controls, rate limits, or whitelist restrictions</li>
        </ul>
        <p>HoodGFX may suspend or terminate access for violations, risk, or operational reasons.</p>
      </section>

      <section>
        <h2>8. AI and Generated Output</h2>
        <p>
          Generative tools may produce unexpected, inaccurate, or non-unique results. HoodGFX does not
          guarantee originality, fitness for a particular purpose, or uninterrupted availability of AI
          features. You are responsible for reviewing outputs before minting or publishing.
        </p>
      </section>

      <section>
        <h2>9. Blockchain Risk</h2>
        <p>
          Blockchain networks involve risks including volatility, congestion, failed transactions, smart
          contract bugs, and irreversible transfers. HoodGFX does not control Robinhood Chain or third-party
          wallets and is not liable for network failures or user error.
        </p>
      </section>

      <section>
        <h2>10. Intellectual Property</h2>
        <p>
          The HoodGFX name, logos, product design, software, and Platform materials are owned by HoodGFX or
          its licensors. You may not copy, modify, or redistribute Platform materials except as allowed by
          these Terms or with prior written permission.
        </p>
      </section>

      <section>
        <h2>11. Disclaimers</h2>
        <p>
          THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
          EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
          NON-INFRINGEMENT. HOODGFX DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, SECURE, OR
          ERROR-FREE.
        </p>
      </section>

      <section>
        <h2>12. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, HOODGFX AND ITS AFFILIATES ARE NOT LIABLE FOR INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, DIGITAL
          ASSETS, OR GOODWILL, ARISING FROM YOUR USE OF THE PLATFORM. OUR TOTAL LIABILITY FOR ANY CLAIM
          RELATED TO THE PLATFORM IS LIMITED TO THE AMOUNTS YOU PAID TO HOODGFX FOR THE SERVICE IN THE THREE
          MONTHS BEFORE THE CLAIM, OR USD $100, WHICHEVER IS GREATER.
        </p>
      </section>

      <section>
        <h2>13. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless HoodGFX from claims arising out of your content, your use
          of the Platform, your NFTs or collections, or your violation of these Terms or applicable law.
        </p>
      </section>

      <section>
        <h2>14. Changes and Termination</h2>
        <p>
          We may modify or discontinue any part of the Platform at any time. We may suspend or terminate
          access without notice if we believe you violated these Terms or create risk for the Platform or other
          users.
        </p>
      </section>

      <section>
        <h2>15. Contact</h2>
        <p>
          Questions about these Terms can be sent through HoodGFX support channels on the Platform.
        </p>
      </section>
    </LegalPageShell>
  )
}