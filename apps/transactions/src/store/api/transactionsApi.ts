import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Transaction, TransactionInput } from '@bytebank/domain'

/**
 * ─── STATE MANAGEMENT: RTK Query (estado de servidor) ──────────────────────
 *
 * Substitui os thunks manuais da Fase 2 (fetch + refresh + token no Redux):
 * - cache por endpoint com deduplicação de requisições concorrentes;
 * - invalidação por TAGS (create/update/delete invalidam a lista);
 * - atualizações OTIMISTAS com rollback automático em caso de erro;
 * - refetch ao voltar o foco/reconectar (setupListeners no store);
 * - o browser só conhece o BFF (mesma origem) — nada de token ou URL da API.
 */

/** basePath da zona: o BFF vive em /transactions/api/bff */
const BFF_BASE_URL = '/transactions/api/bff'

export interface ApiErrorBody {
  message?: string
  errors?: { field: string; message: string }[]
}

export const transactionsApi = createApi({
  reducerPath: 'transactionsApi',
  baseQuery: fetchBaseQuery({ baseUrl: BFF_BASE_URL, credentials: 'same-origin' }),
  tagTypes: ['Transaction'],
  keepUnusedDataFor: 300,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: (build) => ({
    listTransactions: build.query<Transaction[], void>({
      query: () => 'transactions',
      transformResponse: (res: { items: Transaction[] }) => res.items,
      providesTags: (items = []) => [
        { type: 'Transaction', id: 'LIST' },
        ...items.map((t) => ({ type: 'Transaction' as const, id: t.id })),
      ],
    }),

    createTransaction: build.mutation<Transaction, TransactionInput>({
      query: (body) => ({ url: 'transactions', method: 'POST', body }),
      /** Otimista: a linha aparece na hora com id temporário; o servidor confirma depois. */
      async onQueryStarted(input, { dispatch, queryFulfilled }) {
        const tempId = `temp-${Date.now()}`
        const patch = dispatch(
          transactionsApi.util.updateQueryData('listTransactions', undefined, (draft) => {
            draft.unshift({
              ...input,
              id: tempId,
              accountId: '',
              value: input.type === 'Debit' ? -Math.abs(input.value) : Math.abs(input.value),
              date: new Date().toISOString(),
            })
          })
        )
        try {
          const { data } = await queryFulfilled
          dispatch(
            transactionsApi.util.updateQueryData('listTransactions', undefined, (draft) => {
              const i = draft.findIndex((t) => t.id === tempId)
              if (i !== -1) draft[i] = data
            })
          )
        } catch {
          patch.undo()
        }
      },
      invalidatesTags: [{ type: 'Transaction', id: 'LIST' }],
    }),

    updateTransaction: build.mutation<Transaction, { id: string; input: TransactionInput }>({
      query: ({ id, input }) => ({ url: `transactions/${encodeURIComponent(id)}`, method: 'PUT', body: input }),
      async onQueryStarted({ id, input }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          transactionsApi.util.updateQueryData('listTransactions', undefined, (draft) => {
            const t = draft.find((x) => x.id === id)
            if (t) Object.assign(t, input, { value: input.type === 'Debit' ? -Math.abs(input.value) : Math.abs(input.value) })
          })
        )
        queryFulfilled.catch(patch.undo)
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Transaction', id }],
    }),

    deleteTransaction: build.mutation<void, string>({
      query: (id) => ({ url: `transactions/${encodeURIComponent(id)}`, method: 'DELETE' }),
      /** Otimista: some da lista imediatamente; volta se a API falhar. */
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          transactionsApi.util.updateQueryData('listTransactions', undefined, (draft) =>
            draft.filter((t) => t.id !== id)
          )
        )
        queryFulfilled.catch(patch.undo)
      },
      invalidatesTags: [{ type: 'Transaction', id: 'LIST' }],
    }),
  }),
})

export const {
  useListTransactionsQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} = transactionsApi

/** Extrai a mensagem amigável de um erro do RTK Query/BFF. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: ApiErrorBody }).data
    if (data?.message) return data.message
  }
  if (error && typeof error === 'object' && 'status' in error && (error as { status: unknown }).status === 'FETCH_ERROR') {
    return 'Sem conexão com o servidor. Verifique sua internet.'
  }
  return fallback
}
