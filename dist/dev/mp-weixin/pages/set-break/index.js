"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_match = require("../../stores/match.js");
const stores_sync = require("../../stores/sync.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const matchStore = stores_match.useMatchStore();
    stores_sync.useSyncStore();
    const servingTeam = common_vendor.ref("A");
    const localNextSet = common_vendor.ref(false);
    const lastSetResult = common_vendor.computed(() => {
      var _a;
      const results = ((_a = matchStore.scoringEngine) == null ? void 0 : _a.setResults) ?? [];
      return results.length > 0 ? results[results.length - 1] : { scoreA: 0, scoreB: 0, winner: "A" };
    });
    function getPlayerName(team, pos) {
      var _a, _b, _c, _d;
      const positions = team === "A" ? (_a = matchStore.scoringEngine) == null ? void 0 : _a.state.teamAStartingPositions : (_b = matchStore.scoringEngine) == null ? void 0 : _b.state.teamBStartingPositions;
      if (!positions)
        return "";
      const playerId = positions[pos];
      const players = team === "A" ? (_c = matchStore.scoringEngine) == null ? void 0 : _c.state.teamAPlayers : (_d = matchStore.scoringEngine) == null ? void 0 : _d.state.teamBPlayers;
      const player = players == null ? void 0 : players.find((p) => p.id === playerId);
      return (player == null ? void 0 : player.name) ?? `位置${pos + 1}`;
    }
    function rotatePosition(team, pos) {
      var _a, _b;
      const positions = team === "A" ? [...((_a = matchStore.scoringEngine) == null ? void 0 : _a.state.teamAStartingPositions) ?? []] : [...((_b = matchStore.scoringEngine) == null ? void 0 : _b.state.teamBStartingPositions) ?? []];
      if (positions.length <= 1)
        return;
      const nextPos = (pos + 1) % positions.length;
      const temp = positions[pos];
      positions[pos] = positions[nextPos];
      positions[nextPos] = temp;
      matchStore.setNextSetPositions(team, positions);
    }
    function handleNextSet() {
      var _a, _b, _c;
      console.log("[SetBreak] handleNextSet called, isSetComplete:", matchStore.isSetComplete, "isMatchComplete:", matchStore.isMatchComplete);
      localNextSet.value = true;
      const newAPositions = ((_a = matchStore.scoringEngine) == null ? void 0 : _a.state.teamAStartingPositions) ?? [];
      const newBPositions = ((_b = matchStore.scoringEngine) == null ? void 0 : _b.state.teamBStartingPositions) ?? [];
      matchStore.setNextSetPositions("A", newAPositions);
      matchStore.setNextSetPositions("B", newBPositions);
      matchStore.courtSwapped = !matchStore.courtSwapped;
      matchStore.nextSet(servingTeam.value);
      console.log("[SetBreak] after nextSet, isSetComplete:", matchStore.isSetComplete, "setResults:", JSON.stringify((_c = matchStore.scoringEngine) == null ? void 0 : _c.setResults));
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(matchStore).isSetComplete && !common_vendor.unref(matchStore).isMatchComplete
      }, common_vendor.unref(matchStore).isSetComplete && !common_vendor.unref(matchStore).isMatchComplete ? {
        b: common_vendor.t(common_vendor.unref(matchStore).currentSetIndex + 1),
        c: common_vendor.t(common_vendor.unref(matchStore).teamAName),
        d: common_vendor.t(lastSetResult.value.scoreA),
        e: common_vendor.t(lastSetResult.value.scoreB),
        f: common_vendor.t(common_vendor.unref(matchStore).teamBName),
        g: common_vendor.t(common_vendor.unref(matchStore).setResults.filter((s) => s.winner === "A").length),
        h: common_vendor.t(common_vendor.unref(matchStore).setResults.filter((s) => s.winner === "B").length),
        i: common_vendor.t(common_vendor.unref(matchStore).teamAName),
        j: common_vendor.f(6, (pos, k0, i0) => {
          return {
            a: common_vendor.t(pos),
            b: common_vendor.t(getPlayerName("A", pos - 1)),
            c: "a" + pos,
            d: common_vendor.o(($event) => rotatePosition("A", pos - 1), "a" + pos)
          };
        }),
        k: common_vendor.t(common_vendor.unref(matchStore).teamBName),
        l: common_vendor.f(6, (pos, k0, i0) => {
          return {
            a: common_vendor.t(pos),
            b: common_vendor.t(getPlayerName("B", pos - 1)),
            c: "b" + pos,
            d: common_vendor.o(($event) => rotatePosition("B", pos - 1), "b" + pos)
          };
        }),
        m: common_vendor.t(common_vendor.unref(matchStore).teamAName),
        n: common_vendor.n(servingTeam.value === "A" ? "active" : ""),
        o: common_vendor.o(($event) => servingTeam.value = "A", "48"),
        p: common_vendor.t(common_vendor.unref(matchStore).teamBName),
        q: common_vendor.n(servingTeam.value === "B" ? "active" : ""),
        r: common_vendor.o(($event) => servingTeam.value = "B", "a2"),
        s: common_vendor.o(handleNextSet, "7a")
      } : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e73dafdb"]]);
wx.createPage(MiniProgramPage);
