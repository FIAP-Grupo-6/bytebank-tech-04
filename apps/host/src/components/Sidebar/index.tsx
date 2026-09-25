'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, ArrowLeftRight, CreditCard, Info } from 'lucide-react'
import { AppSidebar } from '@bytebank/ui'

export function Sidebar() {
  const pathname = usePathname()

  // Rotas do host usam next/link (navegação client-side + prefetch automático
  // no viewport). /transactions é outra zona → <a> + Speculation Rules.
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, active: pathname === '/dashboard' },
    { href: '/transactions', label: 'Transações', icon: ArrowLeftRight, active: false, external: true },
    { href: '/cards', label: 'Cartões', icon: CreditCard, active: pathname === '/cards' },
  ]

  const footerItems = [{ href: '/sobre', label: 'Sobre', icon: Info, active: pathname === '/sobre' }]

  return (
    <AppSidebar
      navItems={navItems}
      footerItems={footerItems}
      linkComponent={Link}
      onSignOut={() => signOut({ callbackUrl: '/login' })}
    />
  )
}
