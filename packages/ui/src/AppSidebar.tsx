'use client'

import { LogOut, LucideIcon, Menu, X } from 'lucide-react'
import { useState, type ElementType } from 'react'
import clsx from 'clsx'
import { Logo } from './Logo'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  active?: boolean
  /**
   * `true` quando o destino pertence a OUTRA zona (outro app Next.js):
   * usa <a> nativo (navegação completa). Rotas da mesma zona usam o
   * `linkComponent` (ex.: next/link), ganhando navegação client-side e prefetch.
   */
  external?: boolean
}

export interface AppSidebarProps {
  navItems: NavItem[]
  footerItems?: NavItem[]
  onSignOut: () => void
  /** Componente de link da zona atual (ex.: next/link). Padrão: <a>. */
  linkComponent?: ElementType
}

export function AppSidebar({ navItems, footerItems, onSignOut, linkComponent }: AppSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const linkFor = (item: NavItem): ElementType =>
    item.external || !linkComponent ? 'a' : linkComponent

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between bg-sidebar px-4 py-3 border-b border-border/40">
        <Logo size="sm" textClassName="text-foreground" />
        <button
          onClick={() => setMobileOpen((value) => !value)}
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileOpen}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={clsx(
          'bg-sidebar flex flex-col z-40 border-r border-border/30',
          'md:static md:translate-x-0 md:h-full md:flex',
          'md:w-16',
          'lg:w-56',
          'fixed top-0 left-0 h-full w-56 transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo lg */}
        <div className="px-5 py-5 hidden lg:flex">
          <Logo size="md" textClassName="text-foreground" />
        </div>

        {/* Logo md */}
        <div className="py-5 hidden md:flex lg:hidden justify-center">
          <Logo withText={false} size="md" />
        </div>

        {/* Logo mobile drawer */}
        <div className="px-5 py-5 flex md:hidden">
          <Logo size="md" textClassName="text-foreground" />
        </div>

        <nav aria-label="Navegação principal" className="flex-1 px-2 space-y-1 pt-2 lg:pt-0">
          {navItems.map((item) => {
            const Icon = item.icon
            const ItemLink = linkFor(item)
            return (
              <ItemLink
                key={item.href}
                href={item.href}
                aria-current={item.active ? 'page' : undefined}
                title={item.label}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  'md:justify-center lg:justify-start',
                  item.active
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span className="md:hidden lg:block">{item.label}</span>
              </ItemLink>
            )
          })}
        </nav>

        {/* Footer items + logout */}
        <div className="px-2 py-4 border-t border-border/30 space-y-1">
          {footerItems?.map((item) => {
            const Icon = item.icon
            const ItemLink = linkFor(item)
            return (
              <ItemLink
                key={item.href}
                href={item.href}
                aria-current={item.active ? 'page' : undefined}
                title={item.label}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  'md:justify-center lg:justify-start',
                  item.active
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span className="md:hidden lg:block">{item.label}</span>
              </ItemLink>
            )
          })}
          <button
            onClick={onSignOut}
            title="Sair"
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium transition-colors',
              'md:justify-center lg:justify-start',
              'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="md:hidden lg:block">Sair</span>
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
