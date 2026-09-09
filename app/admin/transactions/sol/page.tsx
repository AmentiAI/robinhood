import { redirect } from 'next/navigation'

/** Legacy path — ETH credit payments live here */
export default function EthPaymentsRedirectFromSol() {
  redirect('/admin/transactions/eth')
}
