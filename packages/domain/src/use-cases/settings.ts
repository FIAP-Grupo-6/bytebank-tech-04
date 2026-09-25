import type { DashboardSettingsRepository } from '../ports/repositories'
import { DEFAULT_DASHBOARD_SETTINGS, type DashboardSettings } from '../entities/settings'
import { normalizeDashboardSettings } from '../rules/settings'

export class GetDashboardSettings {
  constructor(private readonly repo: DashboardSettingsRepository) {}

  async execute(): Promise<DashboardSettings> {
    const stored = await this.repo.load()
    return stored ? normalizeDashboardSettings(stored) : DEFAULT_DASHBOARD_SETTINGS
  }
}

export class SaveDashboardSettings {
  constructor(private readonly repo: DashboardSettingsRepository) {}

  async execute(input: unknown): Promise<DashboardSettings> {
    const settings = normalizeDashboardSettings(input)
    await this.repo.save(settings)
    return settings
  }
}
