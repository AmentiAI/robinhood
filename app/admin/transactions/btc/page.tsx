import { redirect } from 'next/navigation'

export default function LegacyBtcAdminRedirect() {
  redirect('/admin/rh')
}
