'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createWagmiConfig } from '@/lib/robinhood/wagmi-config'
import { EvmWalletProvider } from '@/lib/wallet/evm-wallet-context'
import { ProfileProvider } from '@/lib/profile/useProfile'
import { CreditsProvider } from '@/lib/credits-context'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const config = useMemo(() => createWagmiConfig(), [])

  // Always mount EvmWalletProvider — ProfileProvider/useWallet depend on it.
  // Wagmi config uses ssr: true for hydration safety.
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <EvmWalletProvider>
          <CreditsProvider>
            <ProfileProvider>{children}</ProfileProvider>
          </CreditsProvider>
        </EvmWalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
