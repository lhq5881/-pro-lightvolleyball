"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_indoorMatch = require("../../stores/indoor-match.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const indoorMatchStore = stores_indoorMatch.useIndoorMatchStore();
    const teamAName = common_vendor.computed(() => {
      var _a;
      return ((_a = indoorMatchStore.match) == null ? void 0 : _a.teamA.name) ?? "队A";
    });
    const teamBName = common_vendor.computed(() => {
      var _a;
      return ((_a = indoorMatchStore.match) == null ? void 0 : _a.teamB.name) ?? "队B";
    });
    function goBack() {
      common_vendor.index.navigateBack();
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.t(teamAName.value),
        b: common_vendor.t(common_vendor.unref(indoorMatchStore).scoreA),
        c: common_vendor.t(common_vendor.unref(indoorMatchStore).scoreB),
        d: common_vendor.t(teamBName.value),
        e: common_vendor.t(common_vendor.unref(indoorMatchStore).setsWonA),
        f: common_vendor.t(common_vendor.unref(indoorMatchStore).setsWonB),
        g: common_vendor.o(goBack, "c4")
      };
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-92386601"]]);
wx.createPage(MiniProgramPage);
