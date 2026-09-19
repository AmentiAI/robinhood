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
  title: 'HoodGFX - AI-Powered NFT Creator on Robinhood Chain',
  description: 'HoodGFX - Create and mint unique NFT collections on Robinhood Chain using AI-powered generation.',
  icons: {
    icon: '/hoodgfx-hero.png',
    apple: '/hoodgfx-hero.png',
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
