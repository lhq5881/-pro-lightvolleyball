"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_beachMatch = require("../../stores/beach-match.js");
const stores_settings = require("../../stores/settings.js");
const stores_sync = require("../../stores/sync.js");
const services_syncService = require("../../services/sync-service.js");
const models_match = require("../../models/match.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const beachMatchStore = stores_beachMatch.useBeachMatchStore();
    const settingsStore = stores_settings.useSettingsStore();
    const syncStore = stores_sync.useSyncStore();
    const teamAName = common_vendor.ref(settingsStore.settings.defaultTeamAName);
    const teamAPlayers = common_vendor.ref([
      models_match.createPlayer("", ""),
      models_match.createPlayer("", "")
    ]);
    const teamBName = common_vendor.ref(settingsStore.settings.defaultTeamBName);
    const teamBPlayers = common_vendor.ref([
      models_match.createPlayer("", ""),
      models_match.createPlayer("", "")
    ]);
    function setTeamACaptain(index) {
      teamAPlayers.value.forEach((p, i) => {
        p.isCaptain = i === index;
      });
    }
    function setTeamBCaptain(index) {
      teamBPlayers.value.forEach((p, i) => {
        p.isCaptain = i === index;
      });
    }
    const tossWinner = common_vendor.ref("A");
    const tossWinnerChoice = common_vendor.ref("serve");
    const initialServingTeam = common_vendor.computed(() => {
      if (tossWinnerChoice.value === "serve") {
        return tossWinner.value;
      } else {
        return tossWinner.value === "A" ? "B" : "A";
      }
    });
    const teamAServerIndex = common_vendor.ref(0);
    const teamBServerIndex = common_vendor.ref(0);
    const canStart = common_vendor.computed(() => {
      return true;
    });
    function startMatch() {
      if (!teamAName.value.trim())
        teamAName.value = "队A";
      if (!teamBName.value.trim())
        teamBName.value = "队B";
      const teamAConfig = {
        name: teamAName.value.trim(),
        players: [...teamAPlayers.value],
        startingPositions: teamAPlayers.value.map((p) => p.id)
      };
      const teamBConfig = {
        name: teamBName.value.trim(),
        players: [...teamBPlayers.value],
        startingPositions: teamBPlayers.value.map((p) => p.id)
      };
      beachMatchStore.startMatch(
        teamAConfig,
        teamBConfig,
        initialServingTeam.value,
        teamAServerIndex.value,
        teamBServerIndex.value,
        tossWinner.value,
        tossWinnerChoice.value
      );
      if (syncStore.status === "connected") {
        const matchConfig = {
          teamAName: teamAConfig.name,
          teamAPlayers: teamAConfig.players,
          teamAStartingPositions: teamAConfig.startingPositions,
          teamBName: teamBConfig.name,
          teamBPlayers: teamBConfig.players,
          teamBStartingPositions: teamBConfig.startingPositions,
          initialServingTeam: initialServingTeam.value,
          teamABenchPlayers: [],
          teamBBenchPlayers: [],
          teamAInitialServer: teamAServerIndex.value,
          teamBInitialServer: teamBServerIndex.value,
          tossWinner: tossWinner.value,
          tossWinnerChoice: tossWinnerChoice.value
        };
        services_syncService.syncService.pushEvent("START_MATCH", { matchConfig });
      }
      common_vendor.index.navigateTo({ url: "/pages-beach/scoring/index" });
    }
    return (_ctx, _cache) => {
      return {
        a: teamAName.value,
        b: common_vendor.o(($event) => teamAName.value = $event.detail.value, "d0"),
        c: common_vendor.f(teamAPlayers.value, (player, index, i0) => {
          return {
            a: common_vendor.t(index + 1),
            b: player.number,
            c: common_vendor.o(($event) => player.number = $event.detail.value, player.id),
            d: player.isCaptain ? 1 : "",
            e: common_vendor.o(($event) => setTeamACaptain(index), player.id),
            f: player.id
          };
        }),
        d: teamAServerIndex.value === 0 ? 1 : "",
        e: common_vendor.o(($event) => teamAServerIndex.value = 0, "c0"),
        f: teamAServerIndex.value === 1 ? 1 : "",
        g: common_vendor.o(($event) => teamAServerIndex.value = 1, "25"),
        h: teamBName.value,
        i: common_vendor.o(($event) => teamBName.value = $event.detail.value, "64"),
        j: common_vendor.f(teamBPlayers.value, (player, index, i0) => {
          return {
            a: common_vendor.t(index + 1),
            b: player.number,
            c: common_vendor.o(($event) => player.number = $event.detail.value, player.id),
            d: player.isCaptain ? 1 : "",
            e: common_vendor.o(($event) => setTeamBCaptain(index), player.id),
            f: player.id
          };
        }),
        k: teamBServerIndex.value === 0 ? 1 : "",
        l: common_vendor.o(($event) => teamBServerIndex.value = 0, "75"),
        m: teamBServerIndex.value === 1 ? 1 : "",
        n: common_vendor.o(($event) => teamBServerIndex.value = 1, "c9"),
        o: common_vendor.t(teamAName.value || "队A"),
        p: tossWinner.value === "A" ? 1 : "",
        q: common_vendor.o(($event) => tossWinner.value = "A", "4e"),
        r: common_vendor.t(teamBName.value || "队B"),
        s: tossWinner.value === "B" ? 1 : "",
        t: common_vendor.o(($event) => tossWinner.value = "B", "4f"),
        v: tossWinnerChoice.value === "serve" ? 1 : "",
        w: common_vendor.o(($event) => tossWinnerChoice.value = "serve", "0e"),
        x: tossWinnerChoice.value === "receive" ? 1 : "",
        y: common_vendor.o(($event) => tossWinnerChoice.value = "receive", "b7"),
        z: common_vendor.t(initialServingTeam.value === "A" ? teamAName.value || "队A" : teamBName.value || "队B"),
        A: !canStart.value ? 1 : "",
        B: common_vendor.o(startMatch, "c8")
      };
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-692fdb33"]]);
wx.createPage(MiniProgramPage);
