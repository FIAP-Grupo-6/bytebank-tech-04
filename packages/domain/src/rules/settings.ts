import { DEFAULT_DASHBOARD_SETTINGS, type DashboardSettings } from '../entities/settings'

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
const num = (v: unknown, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback

/**
 * Converte qualquer entrada (JSON de cookie, body de request, localStorage
 * legado) em configurações válidas — nunca confia no formato recebido.
 */
export function normalizeDashboardSettings(raw: unknown): DashboardSettings {
  const d = DEFAULT_DASHBOARD_SETTINGS
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>
  const sg = (r.savingsGoal && typeof r.savingsGoal === 'object' ? r.savingsGoal : {}) as Record<string, unknown>
  const sa = (r.spendingAlert && typeof r.spendingAlert === 'object' ? r.spendingAlert : {}) as Record<string, unknown>

  return {
    savingsGoal: {
      enabled: typeof sg.enabled === 'boolean' ? sg.enabled : d.savingsGoal.enabled,
      description:
        typeof sg.description === 'string' && sg.description.trim()
          ? sg.description.trim().slice(0, 60)
          : d.savingsGoal.description,
      targetAmount: clamp(num(sg.targetAmount, d.savingsGoal.targetAmount), 0, 1_000_000_000),
    },
    spendingAlert: {
      enabled: typeof sa.enabled === 'boolean' ? sa.enabled : d.spendingAlert.enabled,
      monthlyLimit: clamp(num(sa.monthlyLimit, d.spendingAlert.monthlyLimit), 0, 1_000_000_000),
      alertThreshold: clamp(Math.round(num(sa.alertThreshold, d.spendingAlert.alertThreshold)), 1, 100),
    },
  }
}
