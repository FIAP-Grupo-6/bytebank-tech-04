'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Provider } from 'react-redux'
import { Plus, WifiOff } from 'lucide-react'
import { Button, Alert } from '@bytebank/ui'
import type { Transaction } from '@bytebank/domain'
import { bindBrowserListeners, makeStore } from '@/store'
import { TransactionFilters } from '@/components/TransactionFilters'
import { TransactionList } from '@/components/TransactionList'
import { connectivity$ } from '@/presentation/reactive/connectivity'
import { useObservableValue } from '@/presentation/reactive/hooks'

/**
 * ─── LAZY LOADING + PRÉ-CARREGAMENTO ────────────────────────────────────────
 * O modal (react-hook-form, zod, combobox, upload) só é necessário quando o
 * usuário vai criar/editar. Ele sai do bundle inicial e é pré-carregado:
 *  - no hover/foco do botão "Nova transação" (intenção explícita);
 *  - em idle, logo após a página ficar interativa (requestIdleCallback),
 *    para que o botão "Editar" de qualquer linha também abra sem espera.
 */
const loadModal = () => import('@/components/TransactionModal').then((m) => m.TransactionModal)
const TransactionModal = dynamic(loadModal, { ssr: false })
const preloadModal = () => void loadModal()

function usePreloadWhenIdle(preload: () => void) {
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(preload, { timeout: 3000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(preload, 1500)
    return () => clearTimeout(id)
  }, [preload])
}

function TransactionPageContent() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  // Programação reativa: estado de conexão como stream (online/offline)
  const isOnline = useObservableValue(connectivity$, true)

  usePreloadWhenIdle(preloadModal)

  const openCreate = () => {
    setEditingTransaction(null)
    setIsModalOpen(true)
  }

  const openEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTransaction(null)
  }

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Transações</h1>
          <p className="text-sm text-muted-foreground">Histórico completo da sua conta</p>
        </div>
        <Button
          onClick={openCreate}
          onMouseEnter={preloadModal}
          onFocus={preloadModal}
          disabled={!isOnline}
          aria-label="Abrir formulário de nova transação"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Nova transação
        </Button>
      </div>

      {!isOnline && (
        <Alert tone="info">
          <span className="inline-flex items-center gap-2">
            <WifiOff className="w-4 h-4" aria-hidden="true" />
            Você está offline. Exibindo os dados em cache — novas transações ficam disponíveis ao reconectar.
          </span>
        </Alert>
      )}

      <TransactionFilters />
      <TransactionList onEdit={openEdit} />

      {isModalOpen && (
        <TransactionModal
          key={editingTransaction?.id ?? 'create'}
          isOpen={isModalOpen}
          onClose={closeModal}
          editTransaction={editingTransaction}
        />
      )}
    </div>
  )
}

interface TransactionPageProps {
  /** Extrato buscado no servidor (SSR) — hidrata o cache do RTK Query */
  initialTransactions: Transaction[]
}

export function TransactionPage({ initialTransactions }: TransactionPageProps) {
  // Uma store por árvore (nunca singleton de módulo — ver store/index.ts)
  const [store] = useState(() => makeStore(initialTransactions))
  useEffect(() => bindBrowserListeners(store), [store])

  return (
    <Provider store={store}>
      <TransactionPageContent />
    </Provider>
  )
}
