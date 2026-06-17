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
    const setResults = common_vendor.computed(() => {
      var _a;
      return ((_a = indoorMatchStore.match) == null ? void 0 : _a.setScores) ?? [];
    });
    const winnerName = common_vendor.computed(() => {
      var _a;
      if (!((_a = indoorMatchStore.match) == null ? void 0 : _a.winner))
        return "";
      return indoorMatchStore.match.winner === "A" ? teamAName.value : teamBName.value;
    });
    function handleBack() {
      indoorMatchStore.resetMatch();
      common_vendor.index.reLaunch({ url: "/pages/index/index" });
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.t(winnerName.value),
        b: common_vendor.t(common_vendor.unref(indoorMatchStore).setsWonA),
        c: common_vendor.t(common_vendor.unref(indoorMatchStore).setsWonB),
        d: common_vendor.t(teamAName.value),
        e: common_vendor.t(teamBName.value),
        f: common_vendor.f(setResults.value, (s, i, i0) => {
          return {
            a: common_vendor.t(i + 1),
            b: common_vendor.t(s.scoreA),
            c: common_vendor.t(s.scoreB),
            d: common_vendor.t(s.winner === "A" ? teamAName.value : teamBName.value),
            e: i,
            f: s.winner === "A" ? 1 : "",
            g: s.winner === "B" ? 1 : ""
          };
        }),
        g: common_vendor.o(handleBack, "bb")
      };
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-eead1ee5"]]);
wx.createPage(MiniProgramPage);
