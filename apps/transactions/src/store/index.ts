import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import type { Transaction } from '@bytebank/domain'
import filtersReducer from './slices/filtersSlice'
import { transactionsApi } from './api/transactionsApi'

/**
 * Factory de store (uma por árvore React). Recebe o extrato já buscado no
 * servidor (SSR) e o grava no cache do RTK Query ANTES do primeiro render:
 * a lista aparece pronta, sem spinner e sem uma segunda requisição.
 */
export function makeStore(preloadedTransactions?: Transaction[]) {
  const store = configureStore({
    reducer: {
      transactionFilters: filtersReducer,
      [transactionsApi.reducerPath]: transactionsApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(transactionsApi.middleware),
  })

  if (preloadedTransactions) {
    // upsertQueryEntries é SÍNCRONO (upsertQueryData é um thunk assíncrono):
    // o dado já está no cache no primeiro render — o HTML do servidor e a
    // hidratação no browser ficam idênticos.
    store.dispatch(
      transactionsApi.util.upsertQueryEntries([
        { endpointName: 'listTransactions', arg: undefined, value: preloadedTransactions },
      ])
    )
  }

  return store
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']

/** Liga refetchOnFocus/refetchOnReconnect aos eventos do browser. Retorna o unsubscribe. */
export const bindBrowserListeners = (store: AppStore) => setupListeners(store.dispatch)
