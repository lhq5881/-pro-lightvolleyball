"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_indoorMatch = require("../../stores/indoor-match.js");
const stores_settings = require("../../stores/settings.js");
const stores_sync = require("../../stores/sync.js");
const services_syncService = require("../../services/sync-service.js");
const models_match = require("../../models/match.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const indoorMatchStore = stores_indoorMatch.useIndoorMatchStore();
    const settingsStore = stores_settings.useSettingsStore();
    const syncStore = stores_sync.useSyncStore();
    const positionLabels = ["1号位", "2号位", "3号位", "4号位", "5号位", "6号位"];
    const teamAName = common_vendor.ref(settingsStore.settings.defaultTeamAName);
    const teamAPlayers = common_vendor.ref([
      models_match.createPlayer("", ""),
      models_match.createPlayer("", ""),
      models_match.createPlayer("", ""),
      models_match.createPlayer("", ""),
      models_match.createPlayer("", ""),
      models_match.createPlayer("", "")
    ]);
    const teamBName = common_vendor.ref(settingsStore.settings.defaultTeamBName);
    const teamBPlayers = common_vendor.ref([
      models_match.createPlayer("", ""),
      models_match.createPlayer("", ""),
      models_match.createPlayer("", ""),
      models_match.createPlayer("", ""),
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
    const initialServingTeam = common_vendor.ref("A");
    const teamALibero1 = common_vendor.ref("");
    const teamALibero2 = common_vendor.ref("");
    const teamBLibero1 = common_vendor.ref("");
    const teamBLibero2 = common_vendor.ref("");
    const totalSets = common_vendor.ref(3);
    const canStart = common_vendor.computed(() => {
      return teamAName.value.trim() && teamBName.value.trim() && teamAPlayers.value.every((p) => p.number.trim()) && teamBPlayers.value.every((p) => p.number.trim());
    });
    const hasTeamACaptain = common_vendor.computed(() => teamAPlayers.value.some((p) => p.isCaptain));
    const hasTeamBCaptain = common_vendor.computed(() => teamBPlayers.value.some((p) => p.isCaptain));
    function startMatch() {
      if (!canStart.value)
        return;
      if (!hasTeamACaptain.value) {
        common_vendor.index.showToast({ title: "请设置队长", icon: "none" });
        return;
      }
      if (!hasTeamBCaptain.value) {
        common_vendor.index.showToast({ title: "请设置队长", icon: "none" });
        return;
      }
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
      indoorMatchStore.startMatch(teamAConfig, teamBConfig, initialServingTeam.value, totalSets.value);
      indoorMatchStore.setLiberoNumbers(teamALibero1.value.trim(), teamALibero2.value.trim(), teamBLibero1.value.trim(), teamBLibero2.value.trim());
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
          totalSets: totalSets.value
        };
        services_syncService.syncService.pushEvent("START_MATCH", { matchConfig });
      }
      common_vendor.index.navigateTo({ url: "/pages-indoor/scoring/index" });
    }
    return (_ctx, _cache) => {
      return {
        a: totalSets.value === 3 ? 1 : "",
        b: common_vendor.o(($event) => totalSets.value = 3, "1f"),
        c: totalSets.value === 5 ? 1 : "",
        d: common_vendor.o(($event) => totalSets.value = 5, "cf"),
        e: common_vendor.t(teamAName.value || "队A"),
        f: initialServingTeam.value === "A" ? 1 : "",
        g: common_vendor.o(($event) => initialServingTeam.value = "A", "0e"),
        h: common_vendor.t(teamBName.value || "队B"),
        i: initialServingTeam.value === "B" ? 1 : "",
        j: common_vendor.o(($event) => initialServingTeam.value = "B", "fa"),
        k: teamAName.value,
        l: common_vendor.o(($event) => teamAName.value = $event.detail.value, "73"),
        m: common_vendor.f(teamAPlayers.value, (player, index, i0) => {
          return {
            a: common_vendor.t(positionLabels[index]),
            b: player.number,
            c: common_vendor.o(($event) => player.number = $event.detail.value, player.id),
            d: player.isCaptain ? 1 : "",
            e: common_vendor.o(($event) => setTeamACaptain(index), player.id),
            f: player.id
          };
        }),
        n: teamALibero1.value,
        o: common_vendor.o(($event) => teamALibero1.value = $event.detail.value, "70"),
        p: teamALibero2.value,
        q: common_vendor.o(($event) => teamALibero2.value = $event.detail.value, "a6"),
        r: teamBName.value,
        s: common_vendor.o(($event) => teamBName.value = $event.detail.value, "a1"),
        t: common_vendor.f(teamBPlayers.value, (player, index, i0) => {
          return {
            a: common_vendor.t(positionLabels[index]),
            b: player.number,
            c: common_vendor.o(($event) => player.number = $event.detail.value, player.id),
            d: player.isCaptain ? 1 : "",
            e: common_vendor.o(($event) => setTeamBCaptain(index), player.id),
            f: player.id
          };
        }),
        v: teamBLibero1.value,
        w: common_vendor.o(($event) => teamBLibero1.value = $event.detail.value, "82"),
        x: teamBLibero2.value,
        y: common_vendor.o(($event) => teamBLibero2.value = $event.detail.value, "fd"),
        z: !canStart.value ? 1 : "",
        A: common_vendor.o(startMatch, "f7")
      };
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b055a134"]]);
wx.createPage(MiniProgramPage);
