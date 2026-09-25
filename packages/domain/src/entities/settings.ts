export interface SavingsGoalConfig {
  enabled: boolean
  description: string
  targetAmount: number
}

export interface SpendingAlertConfig {
  enabled: boolean
  monthlyLimit: number
  /** Percentual (1–100) a partir do qual o alerta é exibido */
  alertThreshold: number
}

export interface DashboardSettings {
  savingsGoal: SavingsGoalConfig
  spendingAlert: SpendingAlertConfig
}

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  savingsGoal: { enabled: false, description: 'Minha meta', targetAmount: 10000 },
  spendingAlert: { enabled: false, monthlyLimit: 3000, alertThreshold: 80 },
}
