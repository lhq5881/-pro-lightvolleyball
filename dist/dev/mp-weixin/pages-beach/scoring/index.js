"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_beachMatch = require("../../stores/beach-match.js");
const stores_history = require("../../stores/history.js");
const stores_settings = require("../../stores/settings.js");
const stores_sync = require("../../stores/sync.js");
const utils_feedback = require("../../utils/feedback.js");
const engine_beachGameRules = require("../../engine/beach-game-rules.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const beachMatchStore = stores_beachMatch.useBeachMatchStore();
    const historyStore = stores_history.useHistoryStore();
    const settingsStore = stores_settings.useSettingsStore();
    const syncStore = stores_sync.useSyncStore();
    const isFlipped = common_vendor.ref(false);
    common_vendor.onLoad((query) => {
      if ((query == null ? void 0 : query.flipped) === "true") {
        isFlipped.value = true;
      }
    });
    const localSetComplete = common_vendor.ref(false);
    const teamAName = common_vendor.computed(() => {
      var _a;
      return ((_a = beachMatchStore.match) == null ? void 0 : _a.teamA.name) ?? "队A";
    });
    const teamBName = common_vendor.computed(() => {
      var _a;
      return ((_a = beachMatchStore.match) == null ? void 0 : _a.teamB.name) ?? "队B";
    });
    const teamAPlayers = common_vendor.computed(() => {
      var _a;
      return ((_a = beachMatchStore.match) == null ? void 0 : _a.teamA.players) ?? [];
    });
    const teamBPlayers = common_vendor.computed(() => {
      var _a;
      return ((_a = beachMatchStore.match) == null ? void 0 : _a.teamB.players) ?? [];
    });
    const setResults = common_vendor.computed(() => {
      var _a;
      return ((_a = beachMatchStore.scoringEngine) == null ? void 0 : _a.setResults) ?? [];
    });
    const leftTeam = common_vendor.computed(() => {
      const baseTeam = beachMatchStore.courtSwapped ? "B" : "A";
      return isFlipped.value ? baseTeam === "A" ? "B" : "A" : baseTeam;
    });
    const rightTeam = common_vendor.computed(() => {
      const baseTeam = beachMatchStore.courtSwapped ? "A" : "B";
      return isFlipped.value ? baseTeam === "A" ? "B" : "A" : baseTeam;
    });
    const leftTeamName = common_vendor.computed(() => leftTeam.value === "A" ? teamAName.value : teamBName.value);
    const rightTeamName = common_vendor.computed(() => rightTeam.value === "A" ? teamAName.value : teamBName.value);
    const leftTeamPlayers = common_vendor.computed(() => leftTeam.value === "A" ? teamAPlayers.value : teamBPlayers.value);
    const rightTeamPlayers = common_vendor.computed(() => rightTeam.value === "A" ? teamAPlayers.value : teamBPlayers.value);
    const leftTeamScore = common_vendor.computed(() => leftTeam.value === "A" ? beachMatchStore.scoreA : beachMatchStore.scoreB);
    const rightTeamScore = common_vendor.computed(() => rightTeam.value === "A" ? beachMatchStore.scoreA : beachMatchStore.scoreB);
    const leftTeamSets = common_vendor.computed(() => leftTeam.value === "A" ? beachMatchStore.setsWonA : beachMatchStore.setsWonB);
    const rightTeamSets = common_vendor.computed(() => rightTeam.value === "A" ? beachMatchStore.setsWonA : beachMatchStore.setsWonB);
    const leftTeamServing = common_vendor.computed(() => beachMatchStore.servingTeam === leftTeam.value);
    const rightTeamServing = common_vendor.computed(() => beachMatchStore.servingTeam === rightTeam.value);
    const leftServerIndex = common_vendor.computed(() => leftTeam.value === "A" ? beachMatchStore.serverIndexA : beachMatchStore.serverIndexB);
    const rightServerIndex = common_vendor.computed(() => rightTeam.value === "A" ? beachMatchStore.serverIndexA : beachMatchStore.serverIndexB);
    function handleScore(team) {
      if (beachMatchStore.isMatchComplete)
        return;
      const { soundEnabled, vibrateEnabled } = settingsStore.settings;
      beachMatchStore.scorePoint(team);
      utils_feedback.feedbackScore(soundEnabled, vibrateEnabled);
      if (beachMatchStore.isMatchComplete)
        ;
      else if (beachMatchStore.isSetComplete) {
        utils_feedback.feedbackSetEnd(soundEnabled, vibrateEnabled);
        handleSetComplete();
      }
    }
    function handleSetComplete() {
      localSetComplete.value = true;
      initBreakData();
      setBreakVisible.value = true;
      startSetBreakCountdown();
    }
    function initBreakData() {
      breakServingTeam.value = beachMatchStore.getPreviousReceiver();
      breakTeamAServerIndex.value = 0;
      breakTeamBServerIndex.value = 0;
    }
    function handleUndo() {
      if (!beachMatchStore.canUndo)
        return;
      common_vendor.index.showModal({
        title: "撤销",
        content: "确定撤销上一次得分？",
        success: (res) => {
          if (res.confirm)
            beachMatchStore.undoPoint();
        }
      });
    }
    function handleSwapCourts() {
      beachMatchStore.swapCourts();
      utils_feedback.playSwapCourtSound();
    }
    const timeoutTimer = common_vendor.ref(null);
    const timeoutCountdown = common_vendor.ref(30);
    const timeoutVisible = common_vendor.ref(false);
    const timeoutTeamName = common_vendor.ref("");
    const courtSwapVisible = common_vendor.ref(false);
    const setBreakVisible = common_vendor.ref(false);
    const breakServingTeam = common_vendor.ref("A");
    const breakTeamAServerIndex = common_vendor.ref(0);
    const breakTeamBServerIndex = common_vendor.ref(0);
    const localNextSet = common_vendor.ref(false);
    const setBreakCountdown = common_vendor.ref(0);
    const setBreakTimer = common_vendor.ref(null);
    const techTimeoutVisible = common_vendor.ref(false);
    const techTimeoutCountdown = common_vendor.ref(30);
    const techTimeoutTimer = common_vendor.ref(null);
    function getSetBreakDuration() {
      const currentSet = beachMatchStore.currentSet;
      if (currentSet >= 1)
        return 60;
      return 0;
    }
    function startSetBreakCountdown() {
      const duration = getSetBreakDuration();
      if (duration <= 0)
        return;
      const endTime = Date.now() + duration * 1e3;
      beachMatchStore.setSetBreakEndTime(endTime);
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
      const endTime = beachMatchStore.setBreakEndTime;
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
      const success = beachMatchStore.callTimeout(team);
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
      beachMatchStore.clearLastTimeout();
    }
    common_vendor.watch(() => beachMatchStore.lastTimeout, (newVal, oldVal) => {
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
      utils_feedback.feedbackTimeout(settingsStore.settings.vibrateEnabled);
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
          utils_feedback.playTimeoutEndSound();
        }
      }, 1e3);
    });
    common_vendor.watch(() => beachMatchStore.pendingCourtSwap, (val, oldVal) => {
      if (!val) {
        if (courtSwapVisible.value) {
          courtSwapVisible.value = false;
        }
        return;
      }
      if (oldVal && val.timestamp === oldVal.timestamp)
        return;
      if (courtSwapVisible.value)
        return;
      courtSwapVisible.value = true;
      utils_feedback.playSwapCourtSound();
    });
    common_vendor.watch(() => beachMatchStore.isSetComplete, (val) => {
      if (val && !beachMatchStore.isMatchComplete && !localSetComplete.value) {
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
    common_vendor.watch(() => beachMatchStore.setBreakEndTime, (endTime) => {
      if (endTime && setBreakVisible.value) {
        syncCountdownFromEndTime();
      }
    });
    function confirmCourtSwap() {
      console.log("[BeachScoring] confirmCourtSwap clicked, isHost:", syncStore.isHost, "roomCode:", syncStore.roomCode);
      beachMatchStore.confirmCourtSwap(false);
      courtSwapVisible.value = false;
    }
    function dismissTechTimeout() {
      if (techTimeoutTimer.value)
        clearInterval(techTimeoutTimer.value);
      techTimeoutTimer.value = null;
      techTimeoutVisible.value = false;
      beachMatchStore.clearPendingTechTimeout();
    }
    common_vendor.watch(() => beachMatchStore.pendingTechTimeout, (val, oldVal) => {
      console.log("[BeachScoring] watch pendingTechTimeout, val:", val, "oldVal:", oldVal);
      if (!val) {
        if (techTimeoutVisible.value) {
          if (techTimeoutTimer.value)
            clearInterval(techTimeoutTimer.value);
          techTimeoutTimer.value = null;
          techTimeoutVisible.value = false;
        }
        return;
      }
      if (oldVal && val.timestamp === oldVal.timestamp)
        return;
      if (techTimeoutVisible.value)
        return;
      console.log("[BeachScoring] 显示技术暂停弹窗");
      techTimeoutCountdown.value = 30;
      techTimeoutVisible.value = true;
      utils_feedback.playTechTimeoutSound();
      if (techTimeoutTimer.value)
        clearInterval(techTimeoutTimer.value);
      techTimeoutTimer.value = setInterval(() => {
        techTimeoutCountdown.value--;
        if (techTimeoutCountdown.value <= 0) {
          if (techTimeoutTimer.value)
            clearInterval(techTimeoutTimer.value);
          techTimeoutTimer.value = null;
          techTimeoutVisible.value = false;
          utils_feedback.playTimeoutEndSound();
        }
      }, 1e3);
    });
    function handleNextSet() {
      if (setBreakTimer.value)
        clearInterval(setBreakTimer.value);
      setBreakTimer.value = null;
      localNextSet.value = true;
      const serving = breakServingTeam.value;
      const teamAServer = breakTeamAServerIndex.value;
      const teamBServer = breakTeamBServerIndex.value;
      const serverIdx = serving === "A" ? teamAServer : teamBServer;
      beachMatchStore.nextSet(serving, serverIdx, teamAServer, teamBServer);
      setBreakVisible.value = false;
      localNextSet.value = false;
    }
    common_vendor.computed(() => beachMatchStore.setsWonA === 1 && beachMatchStore.setsWonB === 1);
    const showTossLoserHint = common_vendor.computed(() => {
      if (beachMatchStore.currentSet !== 1)
        return false;
      if (!beachMatchStore.tossWinner)
        return false;
      return true;
    });
    const tossLoserName = common_vendor.computed(() => {
      if (!beachMatchStore.tossWinner)
        return "";
      const loser = beachMatchStore.tossWinner === "A" ? "B" : "A";
      return loser === "A" ? teamAName.value : teamBName.value;
    });
    const localMatchComplete = common_vendor.ref(false);
    common_vendor.watch(() => beachMatchStore.isMatchComplete, (val) => {
      if (val && !localMatchComplete.value) {
        localMatchComplete.value = true;
        utils_feedback.playMatchEndSound();
        beachMatchStore.completeMatch();
        historyStore.addMatch(beachMatchStore.match);
        setTimeout(() => {
          common_vendor.index.reLaunch({ url: "/pages-beach/match-result/index" });
        }, 100);
      }
    });
    function playerDisplay(index, players) {
      const player = players[index];
      const romanNums = ["I", "II"];
      if (!player)
        return `${romanNums[index]}`;
      const name = player.number || player.name.slice(0, 4);
      return `${romanNums[index]} ${name}号`;
    }
    function isCaptain(index, players) {
      const player = players[index];
      return (player == null ? void 0 : player.isCaptain) || false;
    }
    const swapIntervalText = common_vendor.computed(() => {
      const interval = engine_beachGameRules.getSwapInterval(beachMatchStore.currentSet);
      return `每${interval}分换边`;
    });
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
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(beachMatchStore).isLive || common_vendor.unref(beachMatchStore).isMatchComplete
      }, common_vendor.unref(beachMatchStore).isLive || common_vendor.unref(beachMatchStore).isMatchComplete ? common_vendor.e({
        b: common_vendor.t(common_vendor.unref(beachMatchStore).getTimeouts(leftTeam.value)),
        c: common_vendor.o(($event) => handleTimeout(leftTeam.value), "17"),
        d: common_vendor.t(leftTeamScore.value),
        e: common_vendor.o(($event) => handleScore(leftTeam.value), "d1"),
        f: common_vendor.t(playerDisplay(0, leftTeamPlayers.value)),
        g: isCaptain(0, leftTeamPlayers.value) ? 1 : "",
        h: leftTeamServing.value && leftServerIndex.value === 0
      }, leftTeamServing.value && leftServerIndex.value === 0 ? {} : {}, {
        i: leftTeamServing.value && leftServerIndex.value === 0 ? 1 : "",
        j: common_vendor.t(playerDisplay(1, leftTeamPlayers.value)),
        k: isCaptain(1, leftTeamPlayers.value) ? 1 : "",
        l: leftTeamServing.value && leftServerIndex.value === 1
      }, leftTeamServing.value && leftServerIndex.value === 1 ? {} : {}, {
        m: leftTeamServing.value && leftServerIndex.value === 1 ? 1 : "",
        n: common_vendor.t(common_vendor.unref(beachMatchStore).currentSet),
        o: common_vendor.t(playerDisplay(0, rightTeamPlayers.value)),
        p: isCaptain(0, rightTeamPlayers.value) ? 1 : "",
        q: rightTeamServing.value && rightServerIndex.value === 0
      }, rightTeamServing.value && rightServerIndex.value === 0 ? {} : {}, {
        r: rightTeamServing.value && rightServerIndex.value === 0 ? 1 : "",
        s: common_vendor.t(playerDisplay(1, rightTeamPlayers.value)),
        t: isCaptain(1, rightTeamPlayers.value) ? 1 : "",
        v: rightTeamServing.value && rightServerIndex.value === 1
      }, rightTeamServing.value && rightServerIndex.value === 1 ? {} : {}, {
        w: rightTeamServing.value && rightServerIndex.value === 1 ? 1 : "",
        x: common_vendor.t(common_vendor.unref(beachMatchStore).getTimeouts(rightTeam.value)),
        y: common_vendor.o(($event) => handleTimeout(rightTeam.value), "52"),
        z: common_vendor.t(rightTeamScore.value),
        A: common_vendor.o(($event) => handleScore(rightTeam.value), "20"),
        B: timeoutVisible.value
      }, timeoutVisible.value ? {
        C: common_vendor.t(timeoutTeamName.value),
        D: common_vendor.t(timeoutCountdown.value),
        E: common_vendor.o(dismissTimeout, "92")
      } : {}, {
        F: courtSwapVisible.value
      }, courtSwapVisible.value ? {
        G: common_vendor.t(swapIntervalText.value),
        H: common_vendor.o(confirmCourtSwap, "69")
      } : {}, {
        I: techTimeoutVisible.value
      }, techTimeoutVisible.value ? {
        J: common_vendor.t(techTimeoutCountdown.value),
        K: common_vendor.o(dismissTechTimeout, "3f")
      } : {}, {
        L: setBreakVisible.value
      }, setBreakVisible.value ? common_vendor.e({
        M: setBreakCountdown.value > 0
      }, setBreakCountdown.value > 0 ? {
        N: common_vendor.t(formatCountdown(setBreakCountdown.value))
      } : {}, {
        O: common_vendor.t(teamAName.value),
        P: common_vendor.t(common_vendor.unref(beachMatchStore).scoreA),
        Q: common_vendor.t(common_vendor.unref(beachMatchStore).scoreB),
        R: common_vendor.t(teamBName.value),
        S: common_vendor.t(common_vendor.unref(beachMatchStore).setsWonA),
        T: common_vendor.t(common_vendor.unref(beachMatchStore).setsWonB),
        U: showTossLoserHint.value
      }, showTossLoserHint.value ? {
        V: common_vendor.t(tossLoserName.value)
      } : {}, {
        W: common_vendor.t(common_vendor.unref(beachMatchStore).currentSet + 1),
        X: common_vendor.t(teamAName.value),
        Y: common_vendor.n(breakServingTeam.value === "A" ? "active" : ""),
        Z: common_vendor.o(($event) => breakServingTeam.value = "A", "4d"),
        aa: common_vendor.t(teamBName.value),
        ab: common_vendor.n(breakServingTeam.value === "B" ? "active" : ""),
        ac: common_vendor.o(($event) => breakServingTeam.value = "B", "3c"),
        ad: common_vendor.t(teamAName.value),
        ae: common_vendor.n(breakTeamAServerIndex.value === 0 ? "active" : ""),
        af: common_vendor.o(($event) => breakTeamAServerIndex.value = 0, "a3"),
        ag: common_vendor.n(breakTeamAServerIndex.value === 1 ? "active" : ""),
        ah: common_vendor.o(($event) => breakTeamAServerIndex.value = 1, "79"),
        ai: common_vendor.t(teamBName.value),
        aj: common_vendor.n(breakTeamBServerIndex.value === 0 ? "active" : ""),
        ak: common_vendor.o(($event) => breakTeamBServerIndex.value = 0, "31"),
        al: common_vendor.n(breakTeamBServerIndex.value === 1 ? "active" : ""),
        am: common_vendor.o(($event) => breakTeamBServerIndex.value = 1, "b9"),
        an: common_vendor.o(handleNextSet, "c9")
      }) : {}, {
        ao: common_vendor.t(leftTeamName.value),
        ap: common_vendor.t(leftTeamSets.value),
        aq: common_vendor.f(setResults.value, (s, k0, i0) => {
          return {
            a: common_vendor.t(s.scoreA),
            b: common_vendor.t(s.scoreB),
            c: s.scoreA + "-" + s.scoreB,
            d: s.winner === "A" ? 1 : "",
            e: s.winner === "B" ? 1 : ""
          };
        }),
        ar: common_vendor.o(handleUndo, "36"),
        as: common_vendor.o(handleSwapCourts, "fe"),
        at: common_vendor.t(rightTeamName.value),
        av: common_vendor.t(rightTeamSets.value),
        aw: isPcLandscapeMode.value ? 1 : ""
      }) : {
        ax: common_vendor.o(($event) => common_vendor.index.navigateTo({
          url: "/pages-beach/match-setup/index"
        }), "e0")
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-626713af"]]);
wx.createPage(MiniProgramPage);
