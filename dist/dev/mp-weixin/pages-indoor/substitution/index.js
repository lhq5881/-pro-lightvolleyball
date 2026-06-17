"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_indoorMatch = require("../../stores/indoor-match.js");
const stores_settings = require("../../stores/settings.js");
const utils_feedback = require("../../utils/feedback.js");
const models_match = require("../../models/match.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const indoorMatchStore = stores_indoorMatch.useIndoorMatchStore();
    const settingsStore = stores_settings.useSettingsStore();
    const selectedTeam = common_vendor.ref("A");
    const selectedPosIndex = common_vendor.ref(-1);
    const subInNumber = common_vendor.ref("");
    const teamAName = common_vendor.computed(() => {
      var _a;
      return ((_a = indoorMatchStore.match) == null ? void 0 : _a.teamA.name) ?? "队A";
    });
    const teamBName = common_vendor.computed(() => {
      var _a;
      return ((_a = indoorMatchStore.match) == null ? void 0 : _a.teamB.name) ?? "队B";
    });
    const onCourtPlayers = common_vendor.computed(() => {
      const rotation = indoorMatchStore.getRotation(selectedTeam.value);
      return rotation.map((playerId, index) => ({
        position: index + 1,
        player: indoorMatchStore.getPlayer(playerId)
      }));
    });
    const canSubstitute = common_vendor.computed(() => {
      return selectedPosIndex.value >= 0 && subInNumber.value.trim();
    });
    const positionLabels = ["1号位(发球)", "2号位(前排右)", "3号位(前排中)", "4号位(前排左)", "5号位(后排左)", "6号位(后排中)"];
    function selectPosition(index) {
      selectedPosIndex.value = index;
    }
    function doSubstitute() {
      if (!canSubstitute.value)
        return;
      const rotation = indoorMatchStore.getRotation(selectedTeam.value);
      const playerOutId = rotation[selectedPosIndex.value];
      const playerOut = indoorMatchStore.getPlayer(playerOutId);
      const playerIn = models_match.createPlayer("", subInNumber.value.trim());
      const success = indoorMatchStore.substitute(selectedTeam.value, playerOutId, playerIn.id, playerIn);
      if (success) {
        utils_feedback.feedbackSubstitution(settingsStore.settings.vibrateEnabled);
        common_vendor.index.showToast({ title: "换人成功", icon: "success" });
        if (playerOut == null ? void 0 : playerOut.isCaptain) {
          showCaptainSelectDialog(selectedTeam.value);
        }
        selectedPosIndex.value = -1;
        subInNumber.value = "";
      } else {
        common_vendor.index.showToast({ title: "换人次数已用完", icon: "none" });
      }
    }
    function showCaptainSelectDialog(team) {
      const rotation = indoorMatchStore.getRotation(team);
      team === "A" ? teamAName.value : teamBName.value;
      const players = rotation.map((pid) => indoorMatchStore.getPlayer(pid)).filter(Boolean);
      const items = players.map((p, i) => ({
        name: p.number || p.name || `队员${i + 1}`,
        id: p.id
      }));
      common_vendor.index.showActionSheet({
        title: "请指定场上队长",
        itemList: items.map((item) => item.name),
        success: (res) => {
          const selectedId = items[res.tapIndex].id;
          const teamPlayers = team === "A" ? indoorMatchStore.match.teamA.players : indoorMatchStore.match.teamB.players;
          teamPlayers.forEach((p) => {
            p.isCaptain = p.id === selectedId;
          });
          common_vendor.index.showToast({ title: "新队长已设置", icon: "success" });
        }
      });
    }
    function playerDisplay(player) {
      if (!player)
        return "?";
      return player.number ? `${player.number}号` : player.name || "?";
    }
    function goBackToMatch() {
      common_vendor.index.navigateBack();
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(indoorMatchStore).isLive
      }, common_vendor.unref(indoorMatchStore).isLive ? {
        b: common_vendor.t(teamAName.value),
        c: selectedTeam.value === "A" ? 1 : "",
        d: common_vendor.o(($event) => {
          selectedTeam.value = "A";
          selectedPosIndex.value = -1;
          subInNumber.value = "";
        }, "8d"),
        e: common_vendor.t(teamBName.value),
        f: selectedTeam.value === "B" ? 1 : "",
        g: common_vendor.o(($event) => {
          selectedTeam.value = "B";
          selectedPosIndex.value = -1;
          subInNumber.value = "";
        }, "07"),
        h: common_vendor.f(onCourtPlayers.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(positionLabels[item.position - 1]),
            b: common_vendor.t(playerDisplay(item.player)),
            c: item.position,
            d: selectedPosIndex.value === item.position - 1 ? 1 : "",
            e: common_vendor.o(($event) => selectPosition(item.position - 1), item.position)
          };
        }),
        i: subInNumber.value,
        j: common_vendor.o(($event) => subInNumber.value = $event.detail.value, "9a")
      } : {}, {
        k: common_vendor.unref(indoorMatchStore).isLive
      }, common_vendor.unref(indoorMatchStore).isLive ? {
        l: !canSubstitute.value ? 1 : "",
        m: common_vendor.o(doSubstitute, "fb"),
        n: common_vendor.o(goBackToMatch, "9a")
      } : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e75a5509"]]);
wx.createPage(MiniProgramPage);
