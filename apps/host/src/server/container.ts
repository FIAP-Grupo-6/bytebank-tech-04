import 'server-only'
import {
  GetDashboardSettings,
  GetDashboardView,
  ListCards,
  RegisterUser,
  SaveDashboardSettings,
  AuthenticateUser,
} from '@bytebank/domain'
import { createAuthGateway } from '@bytebank/infrastructure'
import type { ServerSession } from '@bytebank/infrastructure/next'
import { cachedAccountRepository } from './cache'
import { EncryptedCookieSettingsRepository } from './settings-repository'

/**
 * ─── COMPOSITION ROOT ───────────────────────────────────────────────────────
 * Único lugar do host que conhece as implementações concretas. Páginas,
 * route handlers e server actions pedem casos de uso prontos daqui.
 */
export function makeUseCases(session: ServerSession) {
  const accounts = cachedAccountRepository(session)
  const settings = new EncryptedCookieSettingsRepository(session.userId)
  return {
    getDashboardView: new GetDashboardView(accounts),
    listCards: new ListCards(accounts),
    getDashboardSettings: new GetDashboardSettings(settings),
    saveDashboardSettings: new SaveDashboardSettings(settings),
  }
}

export const publicUseCases = () => {
  const gateway = createAuthGateway()
  return {
    authenticateUser: new AuthenticateUser(gateway),
    registerUser: new RegisterUser(gateway),
  }
}
