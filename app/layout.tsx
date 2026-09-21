import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import { Providers } from '@/components/providers'
import { LayoutWrapper } from '@/components/layout-wrapper'
import { AuthRedirect } from '@/components/auth-redirect'
import { SonnerToaster } from '@/components/sonner-toaster'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://hoodgfx.com'),
  title: 'HoodGFX - AI-Powered NFT Creator on Robinhood Chain',
  description:
    'Join the HoodGFX whitelist. Create and mint unique NFT collections on Robinhood Chain.',
  icons: {
    icon: '/hoodgfx-hero.png',
    apple: '/hoodgfx-hero.png',
  },
  openGraph: {
    title: 'HoodGFX',
    description: 'Join the HoodGFX whitelist — the ultimate NFT creation platform on Robinhood Chain.',
    url: 'https://hoodgfx.com',
    siteName: 'HoodGFX',
    images: [
      {
        url: '/hoodgfx-hero.png',
        width: 1200,
        height: 1200,
        alt: 'HoodGFX',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HoodGFX',
    description: 'Join the HoodGFX whitelist — the ultimate NFT creation platform on Robinhood Chain.',
    images: ['/hoodgfx-hero.png'],
    creator: '@Hood_GFX_',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head />
      <body className={`font-sans antialiased min-h-screen`} suppressHydrationWarning>
        <noscript>
          <div style={{ padding: '20px', textAlign: 'center', color: 'white', background: 'red' }}>
            JavaScript is required for this application to work. Please enable JavaScript.
          </div>
        </noscript>
        <Providers>
          <Suspense fallback={null}>
            <AuthRedirect>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
              <SonnerToaster />
            </AuthRedirect>
          </Suspense>
        </Providers>
      </body>
    </html>
  )
}
