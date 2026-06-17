"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_indoorMatch = require("../../stores/indoor-match.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const indoorMatchStore = stores_indoorMatch.useIndoorMatchStore();
    const selectedTeam = common_vendor.ref("A");
    const teamAName = common_vendor.computed(() => {
      var _a;
      return ((_a = indoorMatchStore.match) == null ? void 0 : _a.teamA.name) ?? "队A";
    });
    const teamBName = common_vendor.computed(() => {
      var _a;
      return ((_a = indoorMatchStore.match) == null ? void 0 : _a.teamB.name) ?? "队B";
    });
    const currentRotation = common_vendor.computed(() => indoorMatchStore.getRotation(selectedTeam.value));
    const nextRotation = common_vendor.computed(() => indoorMatchStore.previewRotation(selectedTeam.value));
    common_vendor.computed(() => {
      var _a, _b;
      return selectedTeam.value === "A" ? ((_a = indoorMatchStore.match) == null ? void 0 : _a.teamA.players) ?? [] : ((_b = indoorMatchStore.match) == null ? void 0 : _b.teamB.players) ?? [];
    });
    const isServing = common_vendor.computed(() => indoorMatchStore.servingTeam === selectedTeam.value);
    function getPlayerName(playerId) {
      const player = indoorMatchStore.getPlayer(playerId);
      return player ? `${player.number}号 ${player.name}` : "?";
    }
    function getServerName() {
      const serverId = indoorMatchStore.getServer(selectedTeam.value);
      return getPlayerName(serverId);
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(indoorMatchStore).isLive
      }, common_vendor.unref(indoorMatchStore).isLive ? common_vendor.e({
        b: common_vendor.t(teamAName.value),
        c: selectedTeam.value === "A" ? 1 : "",
        d: common_vendor.o(($event) => selectedTeam.value = "A", "9b"),
        e: common_vendor.t(teamBName.value),
        f: selectedTeam.value === "B" ? 1 : "",
        g: common_vendor.o(($event) => selectedTeam.value = "B", "18"),
        h: common_vendor.f([3, 2], (i, k0, i0) => {
          return {
            a: common_vendor.t(i),
            b: common_vendor.t(getPlayerName(currentRotation.value[i - 1])),
            c: "front-" + i
          };
        }),
        i: common_vendor.t(getPlayerName(currentRotation.value[0])),
        j: isServing.value && currentRotation.value[0] ? 1 : "",
        k: common_vendor.f([4, 5], (i, k0, i0) => {
          return {
            a: common_vendor.t(i),
            b: common_vendor.t(getPlayerName(currentRotation.value[i - 1])),
            c: "back-" + i
          };
        }),
        l: common_vendor.t(getPlayerName(currentRotation.value[5])),
        m: isServing.value
      }, isServing.value ? {
        n: common_vendor.t(getServerName())
      } : {}, {
        o: common_vendor.f([3, 2], (i, k0, i0) => {
          return {
            a: common_vendor.t(i),
            b: common_vendor.t(getPlayerName(nextRotation.value[i - 1])),
            c: "next-front-" + i
          };
        }),
        p: common_vendor.t(getPlayerName(nextRotation.value[0])),
        q: common_vendor.f([4, 5], (i, k0, i0) => {
          return {
            a: common_vendor.t(i),
            b: common_vendor.t(getPlayerName(nextRotation.value[i - 1])),
            c: "next-back-" + i
          };
        }),
        r: common_vendor.t(getPlayerName(nextRotation.value[5]))
      }) : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-4c236229"]]);
wx.createPage(MiniProgramPage);
