"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_match = require("../../stores/match.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const matchStore = stores_match.useMatchStore();
    const teamAName = common_vendor.computed(() => {
      var _a;
      return ((_a = matchStore.match) == null ? void 0 : _a.teamA.name) ?? "队A";
    });
    const teamBName = common_vendor.computed(() => {
      var _a;
      return ((_a = matchStore.match) == null ? void 0 : _a.teamB.name) ?? "队B";
    });
    const setResults = common_vendor.computed(() => {
      var _a;
      return ((_a = matchStore.match) == null ? void 0 : _a.setScores) ?? [];
    });
    const winnerName = common_vendor.computed(() => {
      var _a;
      if (!((_a = matchStore.match) == null ? void 0 : _a.winner))
        return "";
      return matchStore.match.winner === "A" ? teamAName.value : teamBName.value;
    });
    function handleBack() {
      common_vendor.index.reLaunch({ url: "/pages/index/index" });
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.t(winnerName.value),
        b: common_vendor.t(common_vendor.unref(matchStore).setsWonA),
        c: common_vendor.t(common_vendor.unref(matchStore).setsWonB),
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
        g: common_vendor.o(handleBack, "a4")
      };
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-809456de"]]);
wx.createPage(MiniProgramPage);
