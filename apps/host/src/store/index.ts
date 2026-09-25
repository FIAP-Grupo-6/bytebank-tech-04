import { configureStore } from '@reduxjs/toolkit'
import { settingsApi } from './api/settingsApi'

/**
 * Store criada POR REQUISIÇÃO/ÁRVORE (factory), não como singleton de
 * módulo: no App Router o mesmo módulo é reutilizado entre requisições no
 * servidor, e um store global poderia vazar estado de um usuário para outro
 * durante o SSR.
 */
export const makeStore = () =>
  configureStore({
    reducer: { [settingsApi.reducerPath]: settingsApi.reducer },
    middleware: (getDefault) => getDefault().concat(settingsApi.middleware),
  })

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
