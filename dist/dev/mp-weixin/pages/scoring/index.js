"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_match = require("../../stores/match.js");
const stores_history = require("../../stores/history.js");
const stores_sync = require("../../stores/sync.js");
const stores_settings = require("../../stores/settings.js");
const services_syncService = require("../../services/sync-service.js");
const utils_feedback = require("../../utils/feedback.js");
if (!Array) {
  const _component_SyncIndicator = common_vendor.resolveComponent("SyncIndicator");
  _component_SyncIndicator();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const matchStore = stores_match.useMatchStore();
    const historyStore = stores_history.useHistoryStore();
    const syncStore = stores_sync.useSyncStore();
    const settingsStore = stores_settings.useSettingsStore();
    const isFlipped = common_vendor.ref(false);
    common_vendor.onLoad((query) => {
      if ((query == null ? void 0 : query.flipped) === "true") {
        isFlipped.value = true;
      }
    });
    const localSetComplete = common_vendor.ref(false);
    const teamAName = common_vendor.computed(() => {
      var _a;
      return ((_a = matchStore.match) == null ? void 0 : _a.teamA.name) ?? "队A";
    });
    const teamBName = common_vendor.computed(() => {
      var _a;
      return ((_a = matchStore.match) == null ? void 0 : _a.teamB.name) ?? "队B";
    });
    const teamAPlayers = common_vendor.computed(() => {
      var _a;
      return ((_a = matchStore.match) == null ? void 0 : _a.teamA.players) ?? [];
    });
    const teamBPlayers = common_vendor.computed(() => {
      var _a;
      return ((_a = matchStore.match) == null ? void 0 : _a.teamB.players) ?? [];
    });
    const teamARotation = common_vendor.computed(() => matchStore.getRotation("A"));
    const teamBRotation = common_vendor.computed(() => matchStore.getRotation("B"));
    const setResults = common_vendor.computed(() => {
      var _a;
      return ((_a = matchStore.scoringEngine) == null ? void 0 : _a.setResults) ?? [];
    });
    const leftTeam = common_vendor.computed(() => {
      const baseTeam = matchStore.courtSwapped ? "B" : "A";
      return isFlipped.value ? baseTeam === "A" ? "B" : "A" : baseTeam;
    });
    const rightTeam = common_vendor.computed(() => {
      const baseTeam = matchStore.courtSwapped ? "A" : "B";
      return isFlipped.value ? baseTeam === "A" ? "B" : "A" : baseTeam;
    });
    const leftTeamName = common_vendor.computed(() => leftTeam.value === "A" ? teamAName.value : teamBName.value);
    const rightTeamName = common_vendor.computed(() => rightTeam.value === "A" ? teamAName.value : teamBName.value);
    const leftTeamPlayers = common_vendor.computed(() => leftTeam.value === "A" ? teamAPlayers.value : teamBPlayers.value);
    const rightTeamPlayers = common_vendor.computed(() => rightTeam.value === "A" ? teamAPlayers.value : teamBPlayers.value);
    const leftTeamRotation = common_vendor.computed(() => leftTeam.value === "A" ? teamARotation.value : teamBRotation.value);
    const rightTeamRotation = common_vendor.computed(() => rightTeam.value === "A" ? teamARotation.value : teamBRotation.value);
    const leftTeamScore = common_vendor.computed(() => leftTeam.value === "A" ? matchStore.scoreA : matchStore.scoreB);
    const rightTeamScore = common_vendor.computed(() => rightTeam.value === "A" ? matchStore.scoreA : matchStore.scoreB);
    const leftTeamSets = common_vendor.computed(() => leftTeam.value === "A" ? matchStore.setsWonA : matchStore.setsWonB);
    const rightTeamSets = common_vendor.computed(() => rightTeam.value === "A" ? matchStore.setsWonA : matchStore.setsWonB);
    const leftTeamServing = common_vendor.computed(() => matchStore.servingTeam === leftTeam.value);
    const rightTeamServing = common_vendor.computed(() => matchStore.servingTeam === rightTeam.value);
    function handleScore(team) {
      if (matchStore.isMatchComplete)
        return;
      const { soundEnabled, vibrateEnabled } = settingsStore.settings;
      matchStore.scorePoint(team);
      utils_feedback.feedbackScore(soundEnabled, vibrateEnabled);
      if (matchStore.isMatchComplete) {
        localMatchComplete.value = true;
        matchStore.completeMatch();
        historyStore.addMatch(matchStore.match);
        common_vendor.index.reLaunch({ url: "/pages/match-result/index" });
      } else if (matchStore.isSetComplete) {
        utils_feedback.feedbackSetEnd(soundEnabled, vibrateEnabled);
        handleSetComplete();
      } else {
        checkSet3SwapPrompt();
      }
    }
    function checkSet3SwapPrompt() {
      if (!matchStore.scoringEngine)
        return;
      if (matchStore.scoringEngine.currentSet !== 3 || matchStore.set3Swapped)
        return;
      if (matchStore.scoreA >= 8 || matchStore.scoreB >= 8) {
        matchStore.setPendingSet3Swap();
        set3SwapVisible.value = true;
        utils_feedback.playSwapCourtSound();
      }
    }
    function confirmSet3Swap() {
      matchStore.confirmSet3Swap();
      set3SwapVisible.value = false;
    }
    function handleSetComplete() {
      localSetComplete.value = true;
      matchStore.pushSyncSnapshot();
      initBreakData();
      setBreakVisible.value = true;
      startSetBreakCountdown();
    }
    function initBreakData() {
      const teamARotation2 = matchStore.getRotation("A");
      const teamBRotation2 = matchStore.getRotation("B");
      for (let i = 0; i < 5; i++) {
        const aPlayer = matchStore.getPlayer(teamARotation2[i]);
        breakTeamANumbers.value[i] = aPlayer ? aPlayer.number : "";
        breakTeamAIds.value[i] = teamARotation2[i];
        const bPlayer = matchStore.getPlayer(teamBRotation2[i]);
        breakTeamBNumbers.value[i] = bPlayer ? bPlayer.number : "";
        breakTeamBIds.value[i] = teamBRotation2[i];
      }
      breakServingTeam.value = matchStore.getPreviousReceiver();
    }
    function handleUndo() {
      if (!matchStore.canUndo)
        return;
      common_vendor.index.showModal({
        title: "撤销",
        content: "确定撤销上一次得分？",
        success: (res) => {
          if (res.confirm)
            matchStore.undoPoint();
        }
      });
    }
    function goToSubstitution() {
      common_vendor.index.navigateTo({ url: "/pages/substitution/index" });
    }
    function handleSwapCourts() {
      matchStore.swapCourts();
      utils_feedback.playSwapCourtSound();
    }
    const timeoutTimer = common_vendor.ref(null);
    const timeoutCountdown = common_vendor.ref(30);
    const timeoutVisible = common_vendor.ref(false);
    const timeoutTeamName = common_vendor.ref("");
    const set3SwapVisible = common_vendor.ref(false);
    const setBreakVisible = common_vendor.ref(false);
    const breakServingTeam = common_vendor.ref("A");
    const localNextSet = common_vendor.ref(false);
    const breakTeamANumbers = common_vendor.ref(["", "", "", "", ""]);
    const breakTeamBNumbers = common_vendor.ref(["", "", "", "", ""]);
    const breakTeamAIds = common_vendor.ref(["", "", "", "", ""]);
    const breakTeamBIds = common_vendor.ref(["", "", "", "", ""]);
    const setBreakCountdown = common_vendor.ref(0);
    const setBreakTimer = common_vendor.ref(null);
    function getSetBreakDuration() {
      const currentSet = matchStore.currentSet;
      if (currentSet === 1)
        return 120;
      if (currentSet === 2)
        return 180;
      return 0;
    }
    function startSetBreakCountdown() {
      const duration = getSetBreakDuration();
      if (duration <= 0)
        return;
      const endTime = Date.now() + duration * 1e3;
      matchStore.setSetBreakEndTime(endTime);
      setBreakCountdown.value = duration;
      if (setBreakTimer.value)
        clearInterval(setBreakTimer.value);
      setBreakTimer.value = setInterval(() => {
        setBreakCountdown.value--;
        if (setBreakCountdown.value <= 0) {
          if (setBreakTimer.value)
            clearInterval(setBreakTimer.value);
          setBreakTimer.value = null;
        }
      }, 1e3);
    }
    function syncCountdownFromEndTime() {
      const endTime = matchStore.setBreakEndTime;
      if (!endTime)
        return;
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1e3));
      setBreakCountdown.value = remaining;
      if (remaining > 0) {
        if (setBreakTimer.value)
          clearInterval(setBreakTimer.value);
        setBreakTimer.value = setInterval(() => {
          setBreakCountdown.value--;
          if (setBreakCountdown.value <= 0) {
            if (setBreakTimer.value)
              clearInterval(setBreakTimer.value);
            setBreakTimer.value = null;
          }
        }, 1e3);
      }
    }
    function formatCountdown(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    function handleTimeout(team) {
      const success = matchStore.callTimeout(team);
      if (success) {
        utils_feedback.feedbackTimeout(settingsStore.settings.vibrateEnabled);
        utils_feedback.playTimeoutSound();
        timeoutTeamName.value = team === leftTeam.value ? leftTeamName.value : rightTeamName.value;
        timeoutCountdown.value = 30;
        timeoutVisible.value = true;
        if (timeoutTimer.value)
          clearInterval(timeoutTimer.value);
        timeoutTimer.value = setInterval(() => {
          timeoutCountdown.value--;
          if (timeoutCountdown.value <= 0) {
            if (timeoutTimer.value)
              clearInterval(timeoutTimer.value);
            timeoutTimer.value = null;
            timeoutVisible.value = false;
            utils_feedback.playTimeoutEndSound();
          }
        }, 1e3);
      } else {
        common_vendor.index.showToast({ title: "暂停次数已用完", icon: "none" });
      }
    }
    function dismissTimeout() {
      if (timeoutTimer.value)
        clearInterval(timeoutTimer.value);
      timeoutTimer.value = null;
      timeoutVisible.value = false;
      matchStore.clearLastTimeout();
    }
    common_vendor.watch(() => matchStore.lastTimeout, (newVal, oldVal) => {
      if (!newVal) {
        if (timeoutVisible.value) {
          if (timeoutTimer.value)
            clearInterval(timeoutTimer.value);
          timeoutTimer.value = null;
          timeoutVisible.value = false;
        }
        return;
      }
      if (oldVal && newVal.timestamp === oldVal.timestamp)
        return;
      if (timeoutVisible.value)
        return;
      const team = newVal.team;
      timeoutTeamName.value = team === leftTeam.value ? leftTeamName.value : rightTeamName.value;
      timeoutCountdown.value = 30;
      timeoutVisible.value = true;
      utils_feedback.playTimeoutSound();
      if (timeoutTimer.value)
        clearInterval(timeoutTimer.value);
      timeoutTimer.value = setInterval(() => {
        timeoutCountdown.value--;
        if (timeoutCountdown.value <= 0) {
          if (timeoutTimer.value)
            clearInterval(timeoutTimer.value);
          timeoutTimer.value = null;
          timeoutVisible.value = false;
        }
      }, 1e3);
    });
    common_vendor.watch(() => matchStore.pendingSet3Swap, (newVal) => {
      if (!newVal) {
        set3SwapVisible.value = false;
        return;
      }
      if (matchStore.set3Swapped)
        return;
      set3SwapVisible.value = true;
    });
    common_vendor.watch(() => matchStore.isSetComplete, (val) => {
      if (val && !matchStore.isMatchComplete && !localSetComplete.value) {
        setBreakVisible.value = true;
        syncCountdownFromEndTime();
      }
      if (!val) {
        localSetComplete.value = false;
        if (setBreakVisible.value && !localNextSet.value) {
          setBreakVisible.value = false;
        }
      }
    });
    common_vendor.watch(() => matchStore.setBreakEndTime, (endTime) => {
      if (endTime && setBreakVisible.value) {
        syncCountdownFromEndTime();
      }
    });
    function handleNextSet() {
      if (setBreakTimer.value)
        clearInterval(setBreakTimer.value);
      setBreakTimer.value = null;
      localNextSet.value = true;
      const newAPositions = [];
      const newBPositions = [];
      for (let i = 0; i < 5; i++) {
        const aId = breakTeamAIds.value[i];
        const bId = breakTeamBIds.value[i];
        newAPositions.push(aId);
        newBPositions.push(bId);
        const aPlayer = matchStore.getPlayer(aId);
        if (aPlayer)
          aPlayer.number = breakTeamANumbers.value[i];
        const bPlayer = matchStore.getPlayer(bId);
        if (bPlayer)
          bPlayer.number = breakTeamBNumbers.value[i];
      }
      matchStore.match.teamA.startingPositions = newAPositions;
      matchStore.match.teamB.startingPositions = newBPositions;
      matchStore.setNextSetPositions("A", newAPositions);
      matchStore.setNextSetPositions("B", newBPositions);
      matchStore.courtSwapped = !matchStore.courtSwapped;
      const serving = needSelectServing.value ? breakServingTeam.value : matchStore.getPreviousReceiver();
      matchStore.nextSet(serving);
      setBreakVisible.value = false;
      localNextSet.value = false;
    }
    const needSelectServing = common_vendor.computed(() => matchStore.setsWonA === 1 && matchStore.setsWonB === 1);
    const localMatchComplete = common_vendor.ref(false);
    common_vendor.watch(() => matchStore.isMatchComplete, (val) => {
      if (val && !localMatchComplete.value) {
        utils_feedback.playMatchEndSound();
        matchStore.completeMatch();
        historyStore.addMatch(matchStore.match);
        common_vendor.index.reLaunch({ url: "/pages/match-result/index" });
      }
    });
    function pName(playerId, players) {
      const p = players.find((p2) => p2.id === playerId);
      if (!p)
        return "?";
      const display = p.number || p.name.slice(0, 2);
      return display;
    }
    function isCaptain(playerId, players) {
      const p = players.find((p2) => p2.id === playerId);
      return (p == null ? void 0 : p.isCaptain) || false;
    }
    const isPcLandscapeMode = common_vendor.ref(false);
    function checkPcLandscape() {
      const systemInfo = common_vendor.index.getSystemInfoSync();
      const { windowWidth, windowHeight, platform } = systemInfo;
      if ((platform === "windows" || platform === "mac") && windowWidth < windowHeight) {
        isPcLandscapeMode.value = true;
      } else {
        isPcLandscapeMode.value = false;
      }
    }
    common_vendor.onShow(() => {
      checkPcLandscape();
      if (syncStore.status === "connected" || syncStore.status === "disconnected") {
        services_syncService.syncService.onShow();
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(matchStore).isLive || common_vendor.unref(matchStore).isMatchComplete
      }, common_vendor.unref(matchStore).isLive || common_vendor.unref(matchStore).isMatchComplete ? common_vendor.e({
        b: common_vendor.t(common_vendor.unref(matchStore).getTimeouts(leftTeam.value)),
        c: common_vendor.o(($event) => handleTimeout(leftTeam.value), "76"),
        d: common_vendor.t(leftTeamScore.value),
        e: common_vendor.o(($event) => handleScore(leftTeam.value), "1c"),
        f: common_vendor.t(pName(leftTeamRotation.value[4], leftTeamPlayers.value)),
        g: isCaptain(leftTeamRotation.value[4], leftTeamPlayers.value) ? 1 : "",
        h: common_vendor.t(pName(leftTeamRotation.value[0], leftTeamPlayers.value)),
        i: isCaptain(leftTeamRotation.value[0], leftTeamPlayers.value) ? 1 : "",
        j: leftTeamServing.value ? 1 : "",
        k: common_vendor.s(leftTeamServing.value ? "border-color: #39ff14; border-width: 3rpx; background-color: rgba(57, 255, 20, 0.25)" : ""),
        l: common_vendor.t(pName(leftTeamRotation.value[3], leftTeamPlayers.value)),
        m: isCaptain(leftTeamRotation.value[3], leftTeamPlayers.value) ? 1 : "",
        n: common_vendor.t(pName(leftTeamRotation.value[2], leftTeamPlayers.value)),
        o: isCaptain(leftTeamRotation.value[2], leftTeamPlayers.value) ? 1 : "",
        p: common_vendor.t(pName(leftTeamRotation.value[1], leftTeamPlayers.value)),
        q: isCaptain(leftTeamRotation.value[1], leftTeamPlayers.value) ? 1 : "",
        r: common_vendor.t(common_vendor.unref(matchStore).currentSet),
        s: common_vendor.t(pName(rightTeamRotation.value[1], rightTeamPlayers.value)),
        t: isCaptain(rightTeamRotation.value[1], rightTeamPlayers.value) ? 1 : "",
        v: common_vendor.t(pName(rightTeamRotation.value[2], rightTeamPlayers.value)),
        w: isCaptain(rightTeamRotation.value[2], rightTeamPlayers.value) ? 1 : "",
        x: common_vendor.t(pName(rightTeamRotation.value[3], rightTeamPlayers.value)),
        y: isCaptain(rightTeamRotation.value[3], rightTeamPlayers.value) ? 1 : "",
        z: common_vendor.t(pName(rightTeamRotation.value[0], rightTeamPlayers.value)),
        A: isCaptain(rightTeamRotation.value[0], rightTeamPlayers.value) ? 1 : "",
        B: rightTeamServing.value ? 1 : "",
        C: common_vendor.s(rightTeamServing.value ? "border-color: #39ff14; border-width: 3rpx; background-color: rgba(57, 255, 20, 0.25)" : ""),
        D: common_vendor.t(pName(rightTeamRotation.value[4], rightTeamPlayers.value)),
        E: isCaptain(rightTeamRotation.value[4], rightTeamPlayers.value) ? 1 : "",
        F: common_vendor.t(common_vendor.unref(matchStore).getTimeouts(rightTeam.value)),
        G: common_vendor.o(($event) => handleTimeout(rightTeam.value), "de"),
        H: common_vendor.t(rightTeamScore.value),
        I: common_vendor.o(($event) => handleScore(rightTeam.value), "e2"),
        J: timeoutVisible.value
      }, timeoutVisible.value ? {
        K: common_vendor.t(timeoutTeamName.value),
        L: common_vendor.t(timeoutCountdown.value),
        M: common_vendor.o(dismissTimeout, "5b")
      } : {}, {
        N: set3SwapVisible.value
      }, set3SwapVisible.value ? {
        O: common_vendor.o(confirmSet3Swap, "e9")
      } : {}, {
        P: setBreakVisible.value
      }, setBreakVisible.value ? common_vendor.e({
        Q: setBreakCountdown.value > 0
      }, setBreakCountdown.value > 0 ? {
        R: common_vendor.t(formatCountdown(setBreakCountdown.value))
      } : {}, {
        S: common_vendor.t(teamAName.value),
        T: common_vendor.t(common_vendor.unref(matchStore).scoreA),
        U: common_vendor.t(common_vendor.unref(matchStore).scoreB),
        V: common_vendor.t(teamBName.value),
        W: common_vendor.t(common_vendor.unref(matchStore).setsWonA),
        X: common_vendor.t(common_vendor.unref(matchStore).setsWonB),
        Y: common_vendor.t(teamAName.value),
        Z: common_vendor.f(5, (i, k0, i0) => {
          return {
            a: common_vendor.t(["I", "II", "III", "IV", "V"][i - 1]),
            b: breakTeamANumbers.value[i - 1],
            c: common_vendor.o(($event) => breakTeamANumbers.value[i - 1] = $event.detail.value, "a" + i),
            d: "a" + i
          };
        }),
        aa: common_vendor.t(teamBName.value),
        ab: common_vendor.f(5, (i, k0, i0) => {
          return {
            a: common_vendor.t(["I", "II", "III", "IV", "V"][i - 1]),
            b: breakTeamBNumbers.value[i - 1],
            c: common_vendor.o(($event) => breakTeamBNumbers.value[i - 1] = $event.detail.value, "b" + i),
            d: "b" + i
          };
        }),
        ac: needSelectServing.value
      }, needSelectServing.value ? {
        ad: common_vendor.t(teamAName.value),
        ae: common_vendor.n(breakServingTeam.value === "A" ? "active" : ""),
        af: common_vendor.o(($event) => breakServingTeam.value = "A", "eb"),
        ag: common_vendor.t(teamBName.value),
        ah: common_vendor.n(breakServingTeam.value === "B" ? "active" : ""),
        ai: common_vendor.o(($event) => breakServingTeam.value = "B", "12")
      } : {}, {
        aj: common_vendor.o(handleNextSet, "d3")
      }) : {}, {
        ak: common_vendor.t(leftTeamName.value),
        al: common_vendor.t(leftTeamSets.value),
        am: common_vendor.t(common_vendor.unref(matchStore).getSubs(leftTeam.value)),
        an: common_vendor.unref(syncStore).status !== "idle"
      }, common_vendor.unref(syncStore).status !== "idle" ? {} : {}, {
        ao: common_vendor.f(setResults.value, (s, k0, i0) => {
          return {
            a: common_vendor.t(s.scoreA),
            b: common_vendor.t(s.scoreB),
            c: s.scoreA + "-" + s.scoreB,
            d: s.winner === "A" ? 1 : "",
            e: s.winner === "B" ? 1 : ""
          };
        }),
        ap: common_vendor.o(handleUndo, "de"),
        aq: common_vendor.o(goToSubstitution, "7b"),
        ar: common_vendor.o(handleSwapCourts, "5c"),
        as: common_vendor.t(rightTeamName.value),
        at: common_vendor.t(rightTeamSets.value),
        av: common_vendor.t(common_vendor.unref(matchStore).getSubs(rightTeam.value)),
        aw: isPcLandscapeMode.value ? 1 : ""
      }) : {
        ax: common_vendor.o(($event) => common_vendor.index.navigateTo({
          url: "/pages/match-setup/index"
        }), "49")
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-cebb7a51"]]);
wx.createPage(MiniProgramPage);
