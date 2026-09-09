"use client"

import { useEvmWallet } from "@/lib/wallet/evm-wallet-context"
import type { Hex } from 'viem'

interface WalletContextType {
  isConnected: boolean
  currentAddress: string | null
  paymentAddress: string | null
  paymentPublicKey: string | null
  publicKey: string | null
  client: any
  isVerified: boolean
  isVerifying: boolean
  isLiveConnection: boolean
  verifyWallet: () => Promise<boolean>
  /** EIP-191 personal_sign — accepts string or Uint8Array (decoded as utf-8) */
  signMessage: ((message: string | Uint8Array) => Promise<Hex | Uint8Array>) | null
  signPsbt: (psbtBase64: string, autoFinalize?: boolean, broadcast?: boolean) => Promise<any>
  connect: (provider?: any) => Promise<void>
  disconnect: () => void
}

export function useWallet(): WalletContextType {
  const evm = useEvmWallet()

  const signMessage = evm.signMessage
    ? async (message: string | Uint8Array) => {
        const text =
          typeof message === 'string'
            ? message
            : new TextDecoder().decode(message)
        return evm.signMessage!(text)
      }
    : null

  return {
    isConnected: evm.isConnected,
    currentAddress: evm.address,
    paymentAddress: evm.address,
    paymentPublicKey: evm.address,
    publicKey: evm.address,
    client: null,
    isVerified: evm.isVerified,
    isVerifying: evm.isVerifying,
    isLiveConnection: evm.isConnected,
    verifyWallet: evm.verifyWallet,
    signMessage,
    signPsbt: async () => {
      throw new Error("PSBTs are not supported on Robinhood Chain")
    },
    connect: async () => {
      await evm.connect()
    },
    disconnect: () => {
      void evm.disconnect()
    },
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
