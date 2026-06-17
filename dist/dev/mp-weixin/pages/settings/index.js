"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_settings = require("../../stores/settings.js");
const stores_history = require("../../stores/history.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const settingsStore = stores_settings.useSettingsStore();
    const historyStore = stores_history.useHistoryStore();
    const showConfirm = common_vendor.ref(false);
    common_vendor.onShow(() => {
      settingsStore.loadSettings();
    });
    function updateSetting(key, value) {
      settingsStore.updateSettings({ [key]: value });
    }
    function handleClearAll() {
      showConfirm.value = true;
    }
    function confirmClear() {
      historyStore.clearAll();
      showConfirm.value = false;
    }
    function cancelClear() {
      showConfirm.value = false;
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(settingsStore).settings.defaultTeamAName,
        b: common_vendor.o(($event) => updateSetting("defaultTeamAName", $event.detail.value), "03"),
        c: common_vendor.unref(settingsStore).settings.defaultTeamBName,
        d: common_vendor.o(($event) => updateSetting("defaultTeamBName", $event.detail.value), "b8"),
        e: common_vendor.unref(settingsStore).settings.soundEnabled,
        f: common_vendor.o(($event) => updateSetting("soundEnabled", $event.detail.value), "a9"),
        g: common_vendor.unref(settingsStore).settings.vibrateEnabled,
        h: common_vendor.o(($event) => updateSetting("vibrateEnabled", $event.detail.value), "8a"),
        i: common_vendor.o(handleClearAll, "1e"),
        j: showConfirm.value
      }, showConfirm.value ? {
        k: common_vendor.o(cancelClear, "7c"),
        l: common_vendor.o(confirmClear, "e7"),
        m: common_vendor.o(() => {
        }, "0c"),
        n: common_vendor.o(cancelClear, "51")
      } : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b4180827"]]);
wx.createPage(MiniProgramPage);
