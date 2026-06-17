"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_history = require("../../stores/history.js");
const stores_sync = require("../../stores/sync.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const historyStore = stores_history.useHistoryStore();
    stores_sync.useSyncStore();
    const recentMatches = common_vendor.ref([]);
    common_vendor.onShow(() => {
      historyStore.loadHistory();
      recentMatches.value = historyStore.getRecentMatches(5);
    });
    function goToSetup() {
      common_vendor.index.navigateTo({ url: "/pages/match-setup/index" });
    }
    function goToIndoorSetup() {
      common_vendor.index.navigateTo({ url: "/pages-indoor/match-setup/index" });
    }
    function goToBeachSetup() {
      common_vendor.index.navigateTo({ url: "/pages-beach/match-setup/index" });
    }
    function goToHistory() {
      common_vendor.index.switchTab({ url: "/pages/history/index" });
    }
    function goToCreateRoom() {
      common_vendor.index.navigateTo({ url: "/pages/room/index?mode=create&role=recorder" });
    }
    function goToJoinReferee() {
      common_vendor.index.navigateTo({ url: "/pages/room/index?mode=join&role=referee1" });
    }
    function goToJoinAssistant() {
      common_vendor.index.navigateTo({ url: "/pages/room/index?mode=join&role=referee2" });
    }
    function shareApp() {
      common_vendor.index.showShareMenu({
        withShareTicket: true,
        menus: ["shareAppMessage"]
      });
    }
    function formatTime(timestamp) {
      const d = new Date(timestamp);
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    function getMatchResult(match) {
      const winner = match.winner === "A" ? match.teamA.name : match.teamB.name;
      return `${winner} 胜`;
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(goToSetup, "0c"),
        b: common_vendor.o(goToIndoorSetup, "80"),
        c: common_vendor.o(goToBeachSetup, "c5"),
        d: common_vendor.o(goToCreateRoom, "7b"),
        e: common_vendor.o(goToJoinReferee, "a9"),
        f: common_vendor.o(goToJoinAssistant, "28"),
        g: common_vendor.o(shareApp, "ab"),
        h: recentMatches.value.length > 0
      }, recentMatches.value.length > 0 ? {
        i: common_vendor.o(goToHistory, "66"),
        j: common_vendor.f(recentMatches.value, (match, k0, i0) => {
          return {
            a: common_vendor.t(match.teamA.name),
            b: match.winner === "A" ? 1 : "",
            c: common_vendor.t(match.teamB.name),
            d: match.winner === "B" ? 1 : "",
            e: common_vendor.t(getMatchResult(match)),
            f: common_vendor.t(match.setsWonA),
            g: common_vendor.t(match.setsWonB),
            h: common_vendor.t(formatTime(match.startTime)),
            i: match.id,
            j: common_vendor.o(goToHistory, match.id)
          };
        })
      } : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-83a5a03c"]]);
wx.createPage(MiniProgramPage);
