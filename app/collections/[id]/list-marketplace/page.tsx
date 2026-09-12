import { redirect } from 'next/navigation'

/** Legacy BTC/credits collection marketplace — redirected to RH NFT marketplace */
export default function LegacyCollectionMarketplaceRedirect() {
  redirect('/marketplace')
}
