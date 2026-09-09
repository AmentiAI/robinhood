'use client'

import { createContext, useContext, useMemo, ReactNode } from 'react'
import { useEvmWallet } from '@/lib/wallet/evm-wallet-context'

interface ActiveWalletContextType {
  activeWalletAddress: string | null
  activeWalletConnected: boolean
  activeWalletType: 'eth' | null
  activeWalletVerified: boolean

  eth: {
    isConnected: boolean
    address: string | null
    isVerified: boolean
    isVerifying: boolean
    verifyWallet: () => Promise<boolean>
    connect: () => Promise<boolean>
    disconnect: () => Promise<void>
    sendTransaction: (to: string, amount: number) => Promise<string>
    getBalance: () => Promise<number>
  }

  /** @deprecated alias for eth */
  sol: ActiveWalletContextType['eth']
}

const ActiveWalletContext = createContext<ActiveWalletContextType | undefined>(undefined)

export function ActiveWalletProvider({ children }: { children: ReactNode }) {
  const evm = useEvmWallet()

  const { activeWalletAddress, activeWalletConnected, activeWalletType, activeWalletVerified } = useMemo(() => {
    if (evm.address && evm.isConnected) {
      return {
        activeWalletAddress: evm.address,
        activeWalletConnected: true,
        activeWalletType: 'eth' as const,
        activeWalletVerified: evm.isVerified,
      }
    }

    return {
      activeWalletAddress: null,
      activeWalletConnected: false,
      activeWalletType: null,
      activeWalletVerified: false,
    }
  }, [evm.address, evm.isConnected, evm.isVerified])

  const eth = {
    isConnected: evm.isConnected,
    address: evm.address,
    isVerified: evm.isVerified,
    isVerifying: evm.isVerifying,
    verifyWallet: evm.verifyWallet,
    connect: evm.connect,
    disconnect: evm.disconnect,
    sendTransaction: evm.sendTransaction,
    getBalance: evm.getBalance,
  }

  const value: ActiveWalletContextType = {
    activeWalletAddress,
    activeWalletConnected,
    activeWalletType,
    activeWalletVerified,
    eth,
    sol: eth,
  }

  return (
    <ActiveWalletContext.Provider value={value}>
      {children}
    </ActiveWalletContext.Provider>
  )
}

export function useActiveWallet() {
  const context = useContext(ActiveWalletContext)
  if (context === undefined) {
    throw new Error('useActiveWallet must be used within an ActiveWalletProvider')
  }
  return context
}
