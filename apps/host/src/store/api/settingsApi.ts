import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { DashboardSettings } from '@bytebank/domain'

/**
 * RTK Query — preferências do dashboard via BFF (/api/settings).
 * - Cache normalizado por endpoint/tag, com deduplicação de requisições.
 * - Atualização OTIMISTA: a UI muda na hora; se o servidor recusar, o
 *   patch é desfeito automaticamente (rollback).
 */
export const settingsApi = createApi({
  reducerPath: 'settingsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'same-origin' }),
  tagTypes: ['Settings'],
  keepUnusedDataFor: 300,
  endpoints: (build) => ({
    getSettings: build.query<DashboardSettings, void>({
      query: () => 'settings',
      providesTags: ['Settings'],
    }),
    saveSettings: build.mutation<DashboardSettings, DashboardSettings>({
      query: (body) => ({ url: 'settings', method: 'PUT', body }),
      async onQueryStarted(draft, { dispatch, queryFulfilled }) {
        const patch = dispatch(settingsApi.util.updateQueryData('getSettings', undefined, () => draft))
        try {
          const { data } = await queryFulfilled
          // O servidor normaliza os valores (regras do domínio) — prevalece a versão dele.
          dispatch(settingsApi.util.upsertQueryData('getSettings', undefined, data))
        } catch {
          patch.undo()
        }
      },
    }),
  }),
})

export const { useGetSettingsQuery, useSaveSettingsMutation } = settingsApi
