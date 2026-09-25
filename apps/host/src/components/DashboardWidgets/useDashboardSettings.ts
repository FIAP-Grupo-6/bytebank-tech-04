'use client'

import { useEffect, useState } from 'react'
import { normalizeDashboardSettings, type DashboardSettings } from '@bytebank/domain'
import { settingsApi, useGetSettingsQuery, useSaveSettingsMutation } from '@/store/api/settingsApi'
import { useAppStore } from '@/store/hooks'

/** Chave usada na Fase 2, quando as preferências ficavam em texto puro no localStorage. */
const LEGACY_STORAGE_KEY = 'bytebank_dashboard_settings'

/**
 * Preferências do dashboard com estado de servidor (RTK Query).
 *
 * - Hidratação: o valor lido no servidor (cookie cifrado) é gravado no cache
 *   do RTK Query no primeiro render → sem flash de "carregando" e sem uma
 *   requisição extra logo após a hidratação.
 * - Migração: se ainda existir o dado legado no localStorage, ele é enviado
 *   uma única vez ao BFF (onde é cifrado) e APAGADO do browser.
 */
export function useDashboardSettings(initial: DashboardSettings) {
  const store = useAppStore()
  useState(() => {
    if (!settingsApi.endpoints.getSettings.select()(store.getState()).data) {
      // upsertQueryEntries é síncrono: o cache já está preenchido neste mesmo render
      store.dispatch(settingsApi.util.upsertQueryEntries([{ endpointName: 'getSettings', arg: undefined, value: initial }]))
    }
    return null
  })

  const { data } = useGetSettingsQuery()
  const [saveSettings, { isLoading: isSaving, isError }] = useSaveSettingsMutation()

  useEffect(() => {
    try {
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY)
      if (!legacy) return
      window.localStorage.removeItem(LEGACY_STORAGE_KEY)
      saveSettings(normalizeDashboardSettings(JSON.parse(legacy)))
    } catch {
      /* localStorage indisponível ou JSON inválido: nada a migrar */
    }
  }, [saveSettings])

  return {
    settings: data ?? initial,
    save: (updated: DashboardSettings) => saveSettings(updated),
    isSaving,
    saveFailed: isError,
  }
}
