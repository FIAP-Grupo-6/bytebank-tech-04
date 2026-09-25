'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Paperclip,
  Eye,
  Download,
  X,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setPage } from '@/store/slices/filtersSlice'
import { useDeleteTransactionMutation, useListTransactionsQuery, errorMessage } from '@/store/api/transactionsApi'
import {
  selectPaginatedTransactions,
  selectTotalPages,
  selectCurrentPage,
} from '@/store/selectors'
import { Alert, Card, CardContent, Modal } from '@bytebank/ui'
import type { Transaction } from '@bytebank/domain'
import { formatAbsoluteBRL, formatBRL } from '@/lib/format'
import { isDataUri, isSafeImageDataUri, getMimeType, getDownloadName } from '@/lib/file'

// ─── ConfirmDeleteDialog ─────────────────────────────────────────────────────

function ConfirmDeleteDialog({
  onConfirm,
  onCancel,
  isDeleting,
}: {
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}) {
  return (
    <Modal onClose={onCancel} aria-labelledby="confirm-delete-title">
      <div className="relative bg-card border border-border rounded-lg p-6 w-full max-w-sm mx-4 z-10 shadow-xl">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" aria-hidden="true" />
          </div>
          <div>
            <h3 id="confirm-delete-title" className="text-base font-semibold text-foreground mb-1">
              Excluir transação
            </h3>
            <p className="text-sm text-muted-foreground">
              Tem certeza? Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors font-semibold disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── FilePreviewModal ────────────────────────────────────────────────────────

function FilePreviewModal({ dataUri, onClose }: { dataUri: string; onClose: () => void }) {
  const mimeType = getMimeType(dataUri)
  const downloadName = getDownloadName(mimeType)

  return (
    <Modal
      onClose={onClose}
      aria-label="Visualizar imagem"
      className="p-4"
      overlayClassName="bg-black/80"
    >
      <div className="relative bg-card border border-border rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col z-10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Paperclip className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            Visualizar imagem
          </div>
          <div className="flex items-center gap-1">
            <a
              href={dataUri}
              download={downloadName}
              aria-label="Baixar imagem"
              title="Baixar"
              className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Imagem */}
        <div className="flex-1 overflow-auto p-4 min-h-0 flex items-center justify-center">
          <img
            src={dataUri}
            alt="Imagem anexada à transação"
            className="max-w-full h-auto rounded-lg"
            style={{ maxHeight: 'calc(90vh - 80px)' }}
          />
        </div>
      </div>
    </Modal>
  )
}

const DELETE_KEY = 'delete-transaction'

// ─── TransactionRow ──────────────────────────────────────────────────────────

function TransactionRow({
  transaction,
  onEdit,
  onPreview,
}: {
  transaction: Transaction
  onEdit: (t: Transaction) => void
  onPreview: (dataUri: string) => void
}) {
  const isCredit = transaction.type === 'Credit'
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  // fixedCacheKey compartilha o estado da mutation com a lista, que exibe o erro
  // mesmo depois que esta linha foi removida (otimisticamente) e desmontada.
  const [deleteTransaction, { isLoading: isDeleting }] = useDeleteTransactionMutation({ fixedCacheKey: DELETE_KEY })
  // Linha otimista (ainda sem id definitivo do servidor)
  const isPending = transaction.id.startsWith('temp-')

  // Só renderiza anexos que sejam imagens raster (nunca SVG/HTML) — defesa contra XSS armazenado
  const hasImage = !!transaction.anexo && isSafeImageDataUri(transaction.anexo)
  const hasTextAnexo = !!transaction.anexo && !isDataUri(transaction.anexo)

  const handleDelete = async () => {
    // Remoção otimista: a linha some na hora; volta sozinha se o BFF/API falhar
    setShowDeleteDialog(false)
    await deleteTransaction(transaction.id)
  }

  return (
    <>
      <div
        role="row"
        aria-busy={isPending || undefined}
        className={`flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors group ${isPending ? 'opacity-60' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            aria-hidden="true"
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              isCredit ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
            }`}
          >
            {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {isCredit ? 'Crédito' : 'Débito'}
              {transaction.from && (
                <span className="text-muted-foreground font-normal">
                  {' · '}
                  {transaction.from}
                  {transaction.to && ` › ${transaction.to}`}
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                <time dateTime={transaction.date}>
                  {format(new Date(transaction.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </time>
              </p>
              {hasTextAnexo && (
                <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={transaction.anexo}>
                  · {transaction.anexo}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <p
            className={`text-sm font-semibold tabular-nums ${isCredit ? 'text-success' : 'text-destructive'}`}
            aria-label={`${isCredit ? 'Entrada' : 'Saída'} de ${formatAbsoluteBRL(transaction.value)}`}
          >
            {formatBRL(transaction.value)}
          </p>

          {/* Botão de preview — visível quando tem imagem */}
          {hasImage && (
            <button
              onClick={() => onPreview(transaction.anexo!)}
              aria-label="Visualizar imagem"
              title="Ver imagem"
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Ações de edição/exclusão — aparecem no hover */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(transaction)}
              disabled={isPending}
              aria-label="Editar transação"
              title="Editar"
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              disabled={isPending}
              aria-label="Excluir transação"
              title="Excluir"
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {showDeleteDialog && (
        <ConfirmDeleteDialog
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
          isDeleting={isDeleting}
        />
      )}
    </>
  )
}

// ─── TransactionList ─────────────────────────────────────────────────────────

interface TransactionListProps {
  onEdit: (t: Transaction) => void
}

export function TransactionList({ onEdit }: TransactionListProps) {
  const dispatch = useAppDispatch()
  // Assina o cache do RTK Query (já hidratado no SSR). isLoading só é true sem dado em cache.
  const { isLoading, isError, error } = useListTransactionsQuery()
  const transactions = useAppSelector(selectPaginatedTransactions)
  const currentPage = useAppSelector(selectCurrentPage)
  const totalPages = useAppSelector(selectTotalPages)
  const [previewUri, setPreviewUri] = useState<string | null>(null)
  const [, { error: deleteError, reset: resetDeleteError }] = useDeleteTransactionMutation({ fixedCacheKey: DELETE_KEY })

  const deleteAlert = deleteError ? (
    <Alert tone="error">
      {errorMessage(deleteError, 'Não foi possível excluir a transação')}. A transação foi restaurada.{' '}
      <button className="underline" onClick={resetDeleteError}>
        Fechar
      </button>
    </Alert>
  ) : null

  if (isError && transactions.length === 0) {
    return <Alert tone="error">{errorMessage(error, 'Erro ao carregar transações')}</Alert>
  }

  if (isLoading) {
    return (
      <Card aria-busy="true" aria-label="Carregando transações">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <>
      {deleteAlert}
      <Card role="status">
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground text-sm">Nenhuma transação encontrada.</p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Tente ajustar os filtros ou adicione uma nova transação.
          </p>
        </CardContent>
      </Card>
      </>
    )
  }

  return (
    <>
      {deleteAlert}
      <Card role="table" aria-label="Lista de transações">
        <CardContent className="p-0">
          <div className="divide-y divide-border px-2">
            {transactions.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                onEdit={onEdit}
                onPreview={setPreviewUri}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav aria-label="Paginação" className="flex items-center justify-between px-4 py-3 border-t border-border">
              <button
                onClick={() => dispatch(setPage(currentPage - 1))}
                disabled={currentPage === 1}
                aria-label="Página anterior"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              <div className="flex items-center gap-1" role="list">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1
                  return (
                    <button
                      key={page}
                      onClick={() => dispatch(setPage(page))}
                      aria-label={`Ir para página ${page}`}
                      aria-current={page === currentPage ? 'page' : undefined}
                      className={`w-8 h-8 text-xs rounded-lg font-medium transition-colors ${
                        page === currentPage
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => dispatch(setPage(currentPage + 1))}
                disabled={currentPage === totalPages}
                aria-label="Próxima página"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </button>
            </nav>
          )}
        </CardContent>
      </Card>

      {previewUri && (
        <FilePreviewModal dataUri={previewUri} onClose={() => setPreviewUri(null)} />
      )}
    </>
  )
}
