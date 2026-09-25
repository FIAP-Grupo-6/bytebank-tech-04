import 'server-only'
import { cookies } from 'next/headers'
import type { DashboardSettings, DashboardSettingsRepository } from '@bytebank/domain'
import { openJson, sealJson, type SealOptions } from '@bytebank/infrastructure'

/**
 * ─── CRIPTOGRAFIA DE DADOS SENSÍVEIS ────────────────────────────────────────
 *
 * Metas de economia e limite de gastos revelam a vida financeira do usuário.
 * Na Fase 2 ficavam em texto puro no localStorage (legível por qualquer
 * script da página ou extensão). Agora:
 *
 * - são cifradas com AES-256-GCM no SERVIDOR (chave derivada via HKDF do
 *   NEXTAUTH_SECRET + id do usuário — a chave nunca vai para o browser);
 * - ficam num cookie httpOnly + SameSite=Strict (+ Secure em produção),
 *   inacessível a JavaScript — um XSS não consegue ler nem forjar o valor;
 * - a tag GCM detecta adulteração; cookie de outro usuário não decifra.
 */
export const SETTINGS_COOKIE = 'bb_dash_settings'
const ONE_YEAR = 60 * 60 * 24 * 365

export class EncryptedCookieSettingsRepository implements DashboardSettingsRepository {
  private readonly options: SealOptions

  constructor(userId: string, secret = process.env.NEXTAUTH_SECRET ?? '') {
    this.options = { secret, purpose: 'dashboard-settings', context: userId }
  }

  async load(): Promise<DashboardSettings | null> {
    const raw = cookies().get(SETTINGS_COOKIE)?.value
    return raw ? openJson<DashboardSettings>(raw, this.options) : null
  }

  /** Só pode ser chamado em Route Handler ou Server Action (onde cookies são graváveis). */
  async save(settings: DashboardSettings): Promise<void> {
    cookies().set(SETTINGS_COOKIE, sealJson(settings, this.options), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: ONE_YEAR,
    })
  }
}
