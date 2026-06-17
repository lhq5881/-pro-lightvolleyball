"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_match = require("../../stores/match.js");
const stores_settings = require("../../stores/settings.js");
const stores_sync = require("../../stores/sync.js");
const services_syncService = require("../../services/sync-service.js");
const models_match = require("../../models/match.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const matchStore = stores_match.useMatchStore();
    const settingsStore = stores_settings.useSettingsStore();
    const syncStore = stores_sync.useSyncStore();
    const teamAName = common_vendor.ref(settingsStore.settings.defaultTeamAName);
    const teamAPlayers = common_vendor.ref([
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
    const capRegular = common_vendor.ref("");
    const capDeciding = common_vendor.ref("");
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
      const regCap = parseInt(capRegular.value);
      const decCap = parseInt(capDeciding.value);
      const setCaps = [
        regCap > 0 ? regCap : 999,
        regCap > 0 ? regCap : 999,
        decCap > 0 ? decCap : 999
      ];
      matchStore.startMatch(teamAConfig, teamBConfig, initialServingTeam.value, [], [], setCaps);
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
          setCaps
        };
        services_syncService.syncService.pushEvent("START_MATCH", { matchConfig });
      }
      common_vendor.index.navigateTo({ url: "/pages/scoring/index" });
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.t(teamAName.value || "队A"),
        b: initialServingTeam.value === "A" ? 1 : "",
        c: common_vendor.o(($event) => initialServingTeam.value = "A", "0b"),
        d: common_vendor.t(teamBName.value || "队B"),
        e: initialServingTeam.value === "B" ? 1 : "",
        f: common_vendor.o(($event) => initialServingTeam.value = "B", "1a"),
        g: teamAName.value,
        h: common_vendor.o(($event) => teamAName.value = $event.detail.value, "06"),
        i: common_vendor.f(teamAPlayers.value, (player, index, i0) => {
          return {
            a: common_vendor.t(index + 1),
            b: player.number,
            c: common_vendor.o(($event) => player.number = $event.detail.value, player.id),
            d: player.isCaptain ? 1 : "",
            e: common_vendor.o(($event) => setTeamACaptain(index), player.id),
            f: player.id
          };
        }),
        j: teamBName.value,
        k: common_vendor.o(($event) => teamBName.value = $event.detail.value, "da"),
        l: common_vendor.f(teamBPlayers.value, (player, index, i0) => {
          return {
            a: common_vendor.t(index + 1),
            b: player.number,
            c: common_vendor.o(($event) => player.number = $event.detail.value, player.id),
            d: player.isCaptain ? 1 : "",
            e: common_vendor.o(($event) => setTeamBCaptain(index), player.id),
            f: player.id
          };
        }),
        m: capRegular.value,
        n: common_vendor.o(($event) => capRegular.value = $event.detail.value, "1a"),
        o: capDeciding.value,
        p: common_vendor.o(($event) => capDeciding.value = $event.detail.value, "2e"),
        q: !canStart.value ? 1 : "",
        r: common_vendor.o(startMatch, "d1")
      };
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-5e01bbd4"]]);
wx.createPage(MiniProgramPage);
