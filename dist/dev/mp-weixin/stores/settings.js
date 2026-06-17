"use strict";
const common_vendor = require("../common/vendor.js");
const utils_storage = require("../utils/storage.js");
const SETTINGS_KEY = "app_settings";
const defaultSettings = {
  soundEnabled: true,
  vibrateEnabled: true,
  defaultTeamAName: "队A",
  defaultTeamBName: "队B"
};
const useSettingsStore = common_vendor.defineStore("settings", () => {
  const settings = common_vendor.ref({ ...defaultSettings });
  function loadSettings() {
    const saved = utils_storage.getStorage(SETTINGS_KEY);
    if (saved) {
      settings.value = { ...defaultSettings, ...saved };
    }
  }
  function updateSettings(partial) {
    settings.value = { ...settings.value, ...partial };
    utils_storage.setStorage(SETTINGS_KEY, settings.value);
  }
  return {
    settings,
    loadSettings,
    updateSettings
  };
});
exports.useSettingsStore = useSettingsStore;
