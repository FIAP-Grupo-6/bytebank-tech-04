'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Settings } from 'lucide-react'
import { Alert } from '@bytebank/ui'
import type { DashboardSettings } from '@bytebank/domain'
import { useDashboardSettings } from './useDashboardSettings'
import { SavingsGoalCard } from './SavingsGoalCard'
import { SpendingAlertCard } from './SpendingAlertCard'

/**
 * Lazy loading + pré-carregamento por intenção: o modal de personalização
 * não entra no bundle inicial. O chunk começa a baixar no hover/foco do
 * botão, então no clique ele normalmente já está em cache.
 */
const loadCustomizer = () => import('./CustomizerModal').then((m) => m.CustomizerModal)
const CustomizerModal = dynamic(loadCustomizer, { ssr: false })
const preloadCustomizer = () => void loadCustomizer()

interface DashboardWidgetsProps {
  balance: number
  currentMonthDebit: number
  initialSettings: DashboardSettings
}

export function DashboardWidgets({ balance, currentMonthDebit, initialSettings }: DashboardWidgetsProps) {
  const { settings, save, saveFailed } = useDashboardSettings(initialSettings)
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const [focusWidget, setFocusWidget] = useState<'savingsGoal' | 'spendingAlert' | null>(null)

  const anyEnabled = settings.savingsGoal.enabled || settings.spendingAlert.enabled

  const openCustomizer = (widget?: 'savingsGoal' | 'spendingAlert') => {
    setFocusWidget(widget ?? null)
    setCustomizerOpen(true)
  }

  const intentHandlers = { onMouseEnter: preloadCustomizer, onFocus: preloadCustomizer, onTouchStart: preloadCustomizer }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Widgets</h2>
          <p className="text-xs text-muted-foreground">
            {anyEnabled ? 'Seus indicadores personalizados' : 'Nenhum widget ativado ainda'}
          </p>
        </div>
        <button
          onClick={() => openCustomizer()}
          {...intentHandlers}
          aria-label="Personalizar dashboard"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors"
        >
          <Settings className="w-3.5 h-3.5" aria-hidden="true" />
          Personalizar
        </button>
      </div>

      {saveFailed && <Alert tone="error">Não foi possível salvar suas preferências. As alterações foram desfeitas.</Alert>}

      {anyEnabled ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {settings.savingsGoal.enabled && (
            <SavingsGoalCard balance={balance} config={settings.savingsGoal} onEdit={() => openCustomizer('savingsGoal')} />
          )}
          {settings.spendingAlert.enabled && (
            <SpendingAlertCard
              spent={currentMonthDebit}
              config={settings.spendingAlert}
              onEdit={() => openCustomizer('spendingAlert')}
            />
          )}
        </div>
      ) : (
        <button
          onClick={() => openCustomizer()}
          {...intentHandlers}
          className="w-full p-6 rounded-lg border border-dashed border-border text-center hover:border-ring hover:bg-muted/30 transition-colors group"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Settings className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Adicionar widgets
            </p>
            <p className="text-xs text-muted-foreground/60">Metas de economia, alertas de gastos e mais</p>
          </div>
        </button>
      )}

      {customizerOpen && (
        <CustomizerModal
          settings={settings}
          onSave={save}
          onClose={() => {
            setCustomizerOpen(false)
            setFocusWidget(null)
          }}
          focusWidget={focusWidget}
        />
      )}
    </>
  )
}
