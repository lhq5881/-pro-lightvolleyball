"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_match = require("../../stores/match.js");
if (!Math) {
  CourtDiagram();
}
const CourtDiagram = () => "../../components/CourtDiagram.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const matchStore = stores_match.useMatchStore();
    const selectedTeam = common_vendor.ref("A");
    const teamAName = common_vendor.computed(() => {
      var _a;
      return ((_a = matchStore.match) == null ? void 0 : _a.teamA.name) ?? "队A";
    });
    const teamBName = common_vendor.computed(() => {
      var _a;
      return ((_a = matchStore.match) == null ? void 0 : _a.teamB.name) ?? "队B";
    });
    const currentRotation = common_vendor.computed(() => matchStore.getRotation(selectedTeam.value));
    const nextRotation = common_vendor.computed(() => matchStore.previewRotation(selectedTeam.value));
    const teamPlayers = common_vendor.computed(() => {
      var _a, _b;
      return selectedTeam.value === "A" ? ((_a = matchStore.match) == null ? void 0 : _a.teamA.players) ?? [] : ((_b = matchStore.match) == null ? void 0 : _b.teamB.players) ?? [];
    });
    const isServing = common_vendor.computed(() => matchStore.servingTeam === selectedTeam.value);
    function getPlayerName(playerId) {
      const player = matchStore.getPlayer(playerId);
      return player ? `${player.number}号 ${player.name}` : "?";
    }
    function getServerName() {
      const serverId = matchStore.getServer(selectedTeam.value);
      return getPlayerName(serverId);
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(matchStore).isLive
      }, common_vendor.unref(matchStore).isLive ? common_vendor.e({
        b: common_vendor.t(teamAName.value),
        c: selectedTeam.value === "A" ? 1 : "",
        d: common_vendor.o(($event) => selectedTeam.value = "A", "53"),
        e: common_vendor.t(teamBName.value),
        f: selectedTeam.value === "B" ? 1 : "",
        g: common_vendor.o(($event) => selectedTeam.value = "B", "d2"),
        h: common_vendor.p({
          positions: currentRotation.value,
          players: teamPlayers.value,
          servingTeamSide: selectedTeam.value === "A" ? "left" : "right",
          highlightServer: isServing.value
        }),
        i: isServing.value
      }, isServing.value ? {
        j: common_vendor.t(getServerName())
      } : {}, {
        k: common_vendor.p({
          positions: nextRotation.value,
          players: teamPlayers.value,
          servingTeamSide: selectedTeam.value === "A" ? "left" : "right",
          highlightServer: true
        })
      }) : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-5f1af0ee"]]);
wx.createPage(MiniProgramPage);
