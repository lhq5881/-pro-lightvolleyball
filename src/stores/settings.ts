import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getStorage, setStorage } from '@/utils/storage'

const SETTINGS_KEY = 'app_settings'

export interface AppSettings {
  soundEnabled: boolean
  vibrateEnabled: boolean
  defaultTeamAName: string
  defaultTeamBName: string
}

const defaultSettings: AppSettings = {
  soundEnabled: true,
  vibrateEnabled: true,
  defaultTeamAName: '队A',
  defaultTeamBName: '队B'
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>({ ...defaultSettings })

  /** 从本地存储加载 */
  function loadSettings() {
    const saved = getStorage<AppSettings>(SETTINGS_KEY)
    if (saved) {
      settings.value = { ...defaultSettings, ...saved }
    }
  }

  /** 更新设置 */
  function updateSettings(partial: Partial<AppSettings>) {
    settings.value = { ...settings.value, ...partial }
    setStorage(SETTINGS_KEY, settings.value)
  }

  return {
    settings,
    loadSettings,
    updateSettings
  }
})
