"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const services_cloudConfig = require("./services/cloud-config.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/match-setup/index.js";
  "./pages/room/index.js";
  "./pages/scoring/index.js";
  "./pages/rotation/index.js";
  "./pages/substitution/index.js";
  "./pages/set-break/index.js";
  "./pages/match-result/index.js";
  "./pages/history/index.js";
  "./pages/history-detail/index.js";
  "./pages/settings/index.js";
  "./pages-indoor/match-setup/index.js";
  "./pages-indoor/scoring/index.js";
  "./pages-indoor/rotation/index.js";
  "./pages-indoor/substitution/index.js";
  "./pages-indoor/set-break/index.js";
  "./pages-indoor/match-result/index.js";
  "./pages-beach/match-setup/index.js";
  "./pages-beach/scoring/index.js";
  "./pages-beach/match-result/index.js";
}
const _sfc_main = {};
if (!Array) {
  const _component_page = common_vendor.resolveComponent("page");
  _component_page();
}
function _sfc_render(_ctx, _cache) {
  return {};
}
const App = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
function createApp() {
  const app = common_vendor.createSSRApp(App);
  const pinia = common_vendor.createPinia();
  app.use(pinia);
  common_vendor.wx$1.cloud.init({
    env: services_cloudConfig.CLOUD_ENV_ID,
    traceUser: true
  });
  return { app, pinia };
}
createApp().app.mount("#app");
exports.createApp = createApp;
