'use client'

import { signOutViaHost } from '@/lib/sign-out'
import { LayoutDashboard, ArrowLeftRight, CreditCard, Info } from 'lucide-react'
import { AppSidebar } from '@bytebank/ui'

// Todos os destinos (exceto a própria página) pertencem ao host → <a> nativo.
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, active: false, external: true },
  { href: '/transactions', label: 'Transações', icon: ArrowLeftRight, active: true, external: true },
  { href: '/cards', label: 'Cartões', icon: CreditCard, active: false, external: true },
]

const footerItems = [{ href: '/sobre', label: 'Sobre', icon: Info, active: false, external: true }]

export function Sidebar() {
  return (
    <AppSidebar
      navItems={navItems}
      footerItems={footerItems}
      onSignOut={() => signOutViaHost('/login')}
    />
  )
}
