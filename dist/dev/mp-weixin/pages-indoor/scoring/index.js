"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_indoorMatch = require("../../stores/indoor-match.js");
const stores_history = require("../../stores/history.js");
const stores_settings = require("../../stores/settings.js");
const utils_feedback = require("../../utils/feedback.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const indoorMatchStore = stores_indoorMatch.useIndoorMatchStore();
    const historyStore = stores_history.useHistoryStore();
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
      return ((_a = indoorMatchStore.match) == null ? void 0 : _a.teamA.name) ?? "队A";
    });
    const teamBName = common_vendor.computed(() => {
      var _a;
      return ((_a = indoorMatchStore.match) == null ? void 0 : _a.teamB.name) ?? "队B";
    });
    const teamAPlayers = common_vendor.computed(() => {
      var _a;
      return ((_a = indoorMatchStore.match) == null ? void 0 : _a.teamA.players) ?? [];
    });
    const teamBPlayers = common_vendor.computed(() => {
      var _a;
      return ((_a = indoorMatchStore.match) == null ? void 0 : _a.teamB.players) ?? [];
    });
    const teamARotation = common_vendor.computed(() => indoorMatchStore.getRotation("A"));
    const teamBRotation = common_vendor.computed(() => indoorMatchStore.getRotation("B"));
    const setResults = common_vendor.computed(() => {
      var _a;
      return ((_a = indoorMatchStore.scoringEngine) == null ? void 0 : _a.setResults) ?? [];
    });
    const leftTeam = common_vendor.computed(() => {
      const baseTeam = indoorMatchStore.courtSwapped ? "B" : "A";
      return isFlipped.value ? baseTeam === "A" ? "B" : "A" : baseTeam;
    });
    const rightTeam = common_vendor.computed(() => {
      const baseTeam = indoorMatchStore.courtSwapped ? "A" : "B";
      return isFlipped.value ? baseTeam === "A" ? "B" : "A" : baseTeam;
    });
    const leftTeamName = common_vendor.computed(() => leftTeam.value === "A" ? teamAName.value : teamBName.value);
    const rightTeamName = common_vendor.computed(() => rightTeam.value === "A" ? teamAName.value : teamBName.value);
    const leftTeamPlayers = common_vendor.computed(() => leftTeam.value === "A" ? teamAPlayers.value : teamBPlayers.value);
    const rightTeamPlayers = common_vendor.computed(() => rightTeam.value === "A" ? teamAPlayers.value : teamBPlayers.value);
    const leftTeamRotation = common_vendor.computed(() => leftTeam.value === "A" ? teamARotation.value : teamBRotation.value);
    const rightTeamRotation = common_vendor.computed(() => rightTeam.value === "A" ? teamARotation.value : teamBRotation.value);
    const leftTeamScore = common_vendor.computed(() => leftTeam.value === "A" ? indoorMatchStore.scoreA : indoorMatchStore.scoreB);
    const rightTeamScore = common_vendor.computed(() => rightTeam.value === "A" ? indoorMatchStore.scoreA : indoorMatchStore.scoreB);
    const leftTeamSets = common_vendor.computed(() => leftTeam.value === "A" ? indoorMatchStore.setsWonA : indoorMatchStore.setsWonB);
    const rightTeamSets = common_vendor.computed(() => rightTeam.value === "A" ? indoorMatchStore.setsWonA : indoorMatchStore.setsWonB);
    const leftTeamServing = common_vendor.computed(() => indoorMatchStore.servingTeam === leftTeam.value);
    const rightTeamServing = common_vendor.computed(() => indoorMatchStore.servingTeam === rightTeam.value);
    const leftTeamLibero1 = common_vendor.computed(() => leftTeam.value === "A" ? indoorMatchStore.teamALibero1 : indoorMatchStore.teamBLibero1);
    const leftTeamLibero2 = common_vendor.computed(() => leftTeam.value === "A" ? indoorMatchStore.teamALibero2 : indoorMatchStore.teamBLibero2);
    const rightTeamLibero1 = common_vendor.computed(() => rightTeam.value === "A" ? indoorMatchStore.teamALibero1 : indoorMatchStore.teamBLibero1);
    const rightTeamLibero2 = common_vendor.computed(() => rightTeam.value === "A" ? indoorMatchStore.teamALibero2 : indoorMatchStore.teamBLibero2);
    function getToolbarNumbers(team) {
      const rotation = team === leftTeam.value ? leftTeamRotation.value : rightTeamRotation.value;
      const players = team === leftTeam.value ? leftTeamPlayers.value : rightTeamPlayers.value;
      const libero1 = team === "A" ? indoorMatchStore.teamALibero1 : indoorMatchStore.teamBLibero1;
      const libero2 = team === "A" ? indoorMatchStore.teamALibero2 : indoorMatchStore.teamBLibero2;
      const replacements = team === "A" ? indoorMatchStore.teamALiberoReplacements || {} : indoorMatchStore.teamBLiberoReplacements || {};
      console.log("[getToolbarNumbers] team:", team, "libero1:", libero1, "libero2:", libero2, "replacements:", replacements);
      console.log("[getToolbarNumbers] rotation:", rotation);
      console.log("[getToolbarNumbers] players:", players.map((p) => ({ id: p.id, number: p.number })));
      const result = [];
      for (const liberoNumber of [libero1, libero2]) {
        if (!liberoNumber)
          continue;
        const liberoPlayerId = rotation.find((pid) => {
          const player = players.find((p) => p.id === pid);
          return player && player.number === liberoNumber;
        });
        console.log("[getToolbarNumbers] liberoNumber:", liberoNumber, "liberoPlayerId:", liberoPlayerId);
        if (liberoPlayerId) {
          const replacedPlayerId = replacements ? replacements[liberoNumber] : void 0;
          console.log("[getToolbarNumbers] replacedPlayerId:", replacedPlayerId);
          if (replacedPlayerId) {
            const replacedPlayer = players.find((p) => p.id === replacedPlayerId);
            if (replacedPlayer) {
              result.push({ number: replacedPlayer.number, isLibero: false, liberoNumber });
            }
          }
        } else {
          result.push({ number: liberoNumber, isLibero: true, liberoNumber });
        }
      }
      console.log("[getToolbarNumbers] result:", result);
      return result;
    }
    function handleScore(team) {
      if (indoorMatchStore.isMatchComplete)
        return;
      const { soundEnabled, vibrateEnabled } = settingsStore.settings;
      indoorMatchStore.scorePoint(team);
      utils_feedback.feedbackScore(soundEnabled, vibrateEnabled);
      if (indoorMatchStore.isMatchComplete) {
        localMatchComplete.value = true;
        indoorMatchStore.completeMatch();
        historyStore.addMatch(indoorMatchStore.match);
        common_vendor.index.reLaunch({ url: "/pages-indoor/match-result/index" });
      } else if (indoorMatchStore.isSetComplete) {
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
      const teamARotation2 = indoorMatchStore.getRotation("A");
      const teamBRotation2 = indoorMatchStore.getRotation("B");
      for (let i = 0; i < 6; i++) {
        const aPlayer = indoorMatchStore.getPlayer(teamARotation2[i]);
        breakTeamANumbers.value[i] = aPlayer ? aPlayer.number : "";
        breakTeamAIds.value[i] = teamARotation2[i];
        const bPlayer = indoorMatchStore.getPlayer(teamBRotation2[i]);
        breakTeamBNumbers.value[i] = bPlayer ? bPlayer.number : "";
        breakTeamBIds.value[i] = teamBRotation2[i];
      }
      breakServingTeam.value = indoorMatchStore.getPreviousReceiver();
    }
    function handleUndo() {
      if (!indoorMatchStore.canUndo)
        return;
      common_vendor.index.showModal({
        title: "撤销",
        content: "确定撤销上一次得分？",
        success: (res) => {
          if (res.confirm)
            indoorMatchStore.undoPoint();
        }
      });
    }
    function goToSubstitution() {
      common_vendor.index.navigateTo({ url: "/pages-indoor/substitution/index" });
    }
    function handleSwapCourts() {
      indoorMatchStore.swapCourts();
      utils_feedback.playSwapCourtSound();
    }
    const timeoutTimer = common_vendor.ref(null);
    const timeoutCountdown = common_vendor.ref(30);
    const timeoutVisible = common_vendor.ref(false);
    const timeoutTeamName = common_vendor.ref("");
    const set5SwapVisible = common_vendor.ref(false);
    const setBreakVisible = common_vendor.ref(false);
    const breakServingTeam = common_vendor.ref("A");
    const localNextSet = common_vendor.ref(false);
    const breakTeamANumbers = common_vendor.ref(["", "", "", "", "", ""]);
    const breakTeamBNumbers = common_vendor.ref(["", "", "", "", "", ""]);
    const breakTeamAIds = common_vendor.ref(["", "", "", "", "", ""]);
    const breakTeamBIds = common_vendor.ref(["", "", "", "", "", ""]);
    const setBreakCountdown = common_vendor.ref(0);
    const setBreakTimer = common_vendor.ref(null);
    function getSetBreakDuration() {
      const currentSet = indoorMatchStore.currentSet;
      if (currentSet >= 1)
        return 180;
      return 0;
    }
    function startSetBreakCountdown() {
      const duration = getSetBreakDuration();
      if (duration <= 0)
        return;
      const endTime = Date.now() + duration * 1e3;
      indoorMatchStore.setSetBreakEndTime(endTime);
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
      const endTime = indoorMatchStore.setBreakEndTime;
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
      console.log("[IndoorScoring] handleTimeout called, team:", team);
      const success = indoorMatchStore.callTimeout(team);
      console.log("[IndoorScoring] callTimeout result:", success);
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
      console.log("[IndoorScoring] dismissTimeout called");
      if (timeoutTimer.value)
        clearInterval(timeoutTimer.value);
      timeoutTimer.value = null;
      timeoutVisible.value = false;
      indoorMatchStore.clearLastTimeout();
    }
    common_vendor.watch(() => indoorMatchStore.isSetComplete, (val) => {
      console.log("[IndoorScoring] isSetComplete变化:", val, "setsWonA:", indoorMatchStore.setsWonA, "setsWonB:", indoorMatchStore.setsWonB, "needSelectServing:", needSelectServing.value);
      if (val && !indoorMatchStore.isMatchComplete && !localSetComplete.value) {
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
    common_vendor.watch(() => indoorMatchStore.setBreakEndTime, (endTime) => {
      if (endTime && setBreakVisible.value) {
        syncCountdownFromEndTime();
      }
    });
    common_vendor.watch(() => indoorMatchStore.set5Swapped, (val) => {
      if (val) {
        set5SwapVisible.value = false;
      }
    });
    common_vendor.watch(() => indoorMatchStore.lastTimeout, (newVal, oldVal) => {
      console.log("[IndoorScoring] watch lastTimeout, newVal:", newVal, "oldVal:", oldVal);
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
      timeoutTeamName.value = team === "A" ? teamAName.value : teamBName.value;
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
        }
      }, 1e3);
    });
    common_vendor.watch(() => indoorMatchStore.pendingSet5Swap, (val, oldVal) => {
      console.log("[IndoorScoring] watch pendingSet5Swap:", val, "oldVal:", oldVal);
      if (val && !oldVal) {
        set5SwapVisible.value = true;
        utils_feedback.playSwapCourtSound();
      }
    });
    common_vendor.watch(() => [indoorMatchStore.scoreA, indoorMatchStore.scoreB], () => {
    });
    function confirmSet5Swap() {
      console.log("[IndoorScoring] confirmSet5Swap called");
      indoorMatchStore.checkSet5Swap();
      set5SwapVisible.value = false;
      indoorMatchStore.clearPendingSet5Swap();
    }
    function handleNextSet() {
      if (setBreakTimer.value)
        clearInterval(setBreakTimer.value);
      setBreakTimer.value = null;
      localNextSet.value = true;
      const newAPositions = [];
      const newBPositions = [];
      for (let i = 0; i < 6; i++) {
        const aId = breakTeamAIds.value[i];
        const bId = breakTeamBIds.value[i];
        newAPositions.push(aId);
        newBPositions.push(bId);
        const aPlayer = indoorMatchStore.getPlayer(aId);
        if (aPlayer)
          aPlayer.number = breakTeamANumbers.value[i];
        const bPlayer = indoorMatchStore.getPlayer(bId);
        if (bPlayer)
          bPlayer.number = breakTeamBNumbers.value[i];
      }
      indoorMatchStore.match.teamA.startingPositions = newAPositions;
      indoorMatchStore.match.teamB.startingPositions = newBPositions;
      indoorMatchStore.setNextSetPositions("A", newAPositions);
      indoorMatchStore.setNextSetPositions("B", newBPositions);
      indoorMatchStore.courtSwapped = !indoorMatchStore.courtSwapped;
      if (needSelectServing.value) {
        console.log("[IndoorScoring] 决胜局，用户选择发球方:", breakServingTeam.value);
        indoorMatchStore.nextSet(breakServingTeam.value);
      } else {
        console.log("[IndoorScoring] 非决胜局，自动交替发球权");
        indoorMatchStore.nextSet();
      }
      setBreakVisible.value = false;
      localNextSet.value = false;
    }
    const needSelectServing = common_vendor.computed(() => {
      const totalSets = indoorMatchStore.totalSets;
      const setsToWin = Math.ceil(totalSets / 2);
      return indoorMatchStore.setsWonA === setsToWin - 1 && indoorMatchStore.setsWonB === setsToWin - 1;
    });
    const localMatchComplete = common_vendor.ref(false);
    const selectedLibero = common_vendor.ref(null);
    common_vendor.watch(() => indoorMatchStore.isMatchComplete, (val) => {
      if (val && !localMatchComplete.value) {
        utils_feedback.playMatchEndSound();
        indoorMatchStore.completeMatch();
        historyStore.addMatch(indoorMatchStore.match);
        common_vendor.index.reLaunch({ url: "/pages-indoor/match-result/index" });
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
    function handleLiberoLongPress(team, playerId) {
      const libero1 = team === leftTeam.value ? leftTeamLibero1.value : rightTeamLibero1.value;
      const libero2 = team === leftTeam.value ? leftTeamLibero2.value : rightTeamLibero2.value;
      if (!libero1 && !libero2) {
        common_vendor.index.showToast({ title: "未设置自由人", icon: "none" });
        return;
      }
      if (!libero2) {
        const result = indoorMatchStore.liberoSwap(team, playerId, libero1);
        if (result.success) {
          common_vendor.index.showToast({ title: "自由人已替换", icon: "none" });
          if (result.captainReplaced) {
            showCaptainSelectDialog(team);
          }
          if (result.originalCaptainRestored) {
            common_vendor.index.showToast({ title: "原队长已恢复", icon: "none" });
          }
        } else {
          common_vendor.index.showToast({ title: "替换失败", icon: "none" });
        }
        return;
      }
      const liberoOptions = [libero1, libero2].filter(Boolean);
      common_vendor.index.showActionSheet({
        title: "选择替换的自由人",
        itemList: liberoOptions.map((n) => "自由人 " + n),
        success: (res) => {
          const selectedLibero2 = liberoOptions[res.tapIndex];
          const result = indoorMatchStore.liberoSwap(team, playerId, selectedLibero2);
          if (result.success) {
            common_vendor.index.showToast({ title: "自由人已替换", icon: "none" });
            if (result.captainReplaced) {
              showCaptainSelectDialog(team);
            }
            if (result.originalCaptainRestored) {
              common_vendor.index.showToast({ title: "原队长已恢复", icon: "none" });
            }
          } else {
            common_vendor.index.showToast({ title: "替换失败", icon: "none" });
          }
        }
      });
    }
    function handleLiberoClick(side, liberoNumber) {
      var _a, _b;
      if (((_a = selectedLibero.value) == null ? void 0 : _a.side) === side && ((_b = selectedLibero.value) == null ? void 0 : _b.number) === liberoNumber) {
        selectedLibero.value = null;
        return;
      }
      selectedLibero.value = { side, number: liberoNumber };
      common_vendor.index.showToast({ title: "请点击后排队员位置进行替换", icon: "none" });
    }
    function handleBackRowClick(team, playerId) {
      if (!selectedLibero.value)
        return;
      const targetTeam = selectedLibero.value.side === "left" ? leftTeam.value : rightTeam.value;
      if (team !== targetTeam) {
        common_vendor.index.showToast({ title: "请选择同队后排队员", icon: "none" });
        return;
      }
      const result = indoorMatchStore.liberoSwap(team, playerId, selectedLibero.value.number);
      if (result.success) {
        common_vendor.index.showToast({ title: "自由人已替换", icon: "none" });
        if (result.captainReplaced) {
          showCaptainSelectDialog(team);
        }
        if (result.originalCaptainRestored) {
          common_vendor.index.showToast({ title: "原队长已恢复", icon: "none" });
        }
      } else {
        common_vendor.index.showToast({ title: "替换失败", icon: "none" });
      }
      selectedLibero.value = null;
    }
    const isPcLandscapeMode = common_vendor.ref(false);
    function showCaptainSelectDialog(team) {
      const rotation = indoorMatchStore.getRotation(team);
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
      var _a, _b, _c, _d, _e, _f;
      return common_vendor.e({
        a: common_vendor.unref(indoorMatchStore).isLive || common_vendor.unref(indoorMatchStore).isMatchComplete
      }, common_vendor.unref(indoorMatchStore).isLive || common_vendor.unref(indoorMatchStore).isMatchComplete ? common_vendor.e({
        b: common_vendor.t(common_vendor.unref(indoorMatchStore).getTimeouts(leftTeam.value)),
        c: common_vendor.o(($event) => handleTimeout(leftTeam.value), "24"),
        d: common_vendor.t(leftTeamScore.value),
        e: common_vendor.o(($event) => handleScore(leftTeam.value), "ec"),
        f: common_vendor.t(pName(leftTeamRotation.value[4], leftTeamPlayers.value)),
        g: isCaptain(leftTeamRotation.value[4], leftTeamPlayers.value) ? 1 : "",
        h: ((_a = selectedLibero.value) == null ? void 0 : _a.side) === "left" ? 1 : "",
        i: common_vendor.o(($event) => handleLiberoLongPress(leftTeam.value, leftTeamRotation.value[4]), "4d"),
        j: common_vendor.o(($event) => handleBackRowClick(leftTeam.value, leftTeamRotation.value[4]), "21"),
        k: common_vendor.t(pName(leftTeamRotation.value[5], leftTeamPlayers.value)),
        l: isCaptain(leftTeamRotation.value[5], leftTeamPlayers.value) ? 1 : "",
        m: ((_b = selectedLibero.value) == null ? void 0 : _b.side) === "left" ? 1 : "",
        n: common_vendor.o(($event) => handleLiberoLongPress(leftTeam.value, leftTeamRotation.value[5]), "9b"),
        o: common_vendor.o(($event) => handleBackRowClick(leftTeam.value, leftTeamRotation.value[5]), "17"),
        p: common_vendor.t(pName(leftTeamRotation.value[0], leftTeamPlayers.value)),
        q: isCaptain(leftTeamRotation.value[0], leftTeamPlayers.value) ? 1 : "",
        r: leftTeamServing.value ? 1 : "",
        s: ((_c = selectedLibero.value) == null ? void 0 : _c.side) === "left" ? 1 : "",
        t: common_vendor.o(($event) => handleLiberoLongPress(leftTeam.value, leftTeamRotation.value[0]), "69"),
        v: common_vendor.o(($event) => handleBackRowClick(leftTeam.value, leftTeamRotation.value[0]), "7e"),
        w: common_vendor.t(pName(leftTeamRotation.value[3], leftTeamPlayers.value)),
        x: isCaptain(leftTeamRotation.value[3], leftTeamPlayers.value) ? 1 : "",
        y: common_vendor.t(pName(leftTeamRotation.value[2], leftTeamPlayers.value)),
        z: isCaptain(leftTeamRotation.value[2], leftTeamPlayers.value) ? 1 : "",
        A: common_vendor.t(pName(leftTeamRotation.value[1], leftTeamPlayers.value)),
        B: isCaptain(leftTeamRotation.value[1], leftTeamPlayers.value) ? 1 : "",
        C: common_vendor.t(common_vendor.unref(indoorMatchStore).currentSet),
        D: common_vendor.t(pName(rightTeamRotation.value[1], rightTeamPlayers.value)),
        E: isCaptain(rightTeamRotation.value[1], rightTeamPlayers.value) ? 1 : "",
        F: common_vendor.t(pName(rightTeamRotation.value[2], rightTeamPlayers.value)),
        G: isCaptain(rightTeamRotation.value[2], rightTeamPlayers.value) ? 1 : "",
        H: common_vendor.t(pName(rightTeamRotation.value[3], rightTeamPlayers.value)),
        I: isCaptain(rightTeamRotation.value[3], rightTeamPlayers.value) ? 1 : "",
        J: common_vendor.t(pName(rightTeamRotation.value[0], rightTeamPlayers.value)),
        K: isCaptain(rightTeamRotation.value[0], rightTeamPlayers.value) ? 1 : "",
        L: rightTeamServing.value ? 1 : "",
        M: ((_d = selectedLibero.value) == null ? void 0 : _d.side) === "right" ? 1 : "",
        N: common_vendor.o(($event) => handleLiberoLongPress(rightTeam.value, rightTeamRotation.value[0]), "68"),
        O: common_vendor.o(($event) => handleBackRowClick(rightTeam.value, rightTeamRotation.value[0]), "c6"),
        P: common_vendor.t(pName(rightTeamRotation.value[5], rightTeamPlayers.value)),
        Q: isCaptain(rightTeamRotation.value[5], rightTeamPlayers.value) ? 1 : "",
        R: ((_e = selectedLibero.value) == null ? void 0 : _e.side) === "right" ? 1 : "",
        S: common_vendor.o(($event) => handleLiberoLongPress(rightTeam.value, rightTeamRotation.value[5]), "60"),
        T: common_vendor.o(($event) => handleBackRowClick(rightTeam.value, rightTeamRotation.value[5]), "0e"),
        U: common_vendor.t(pName(rightTeamRotation.value[4], rightTeamPlayers.value)),
        V: isCaptain(rightTeamRotation.value[4], rightTeamPlayers.value) ? 1 : "",
        W: ((_f = selectedLibero.value) == null ? void 0 : _f.side) === "right" ? 1 : "",
        X: common_vendor.o(($event) => handleLiberoLongPress(rightTeam.value, rightTeamRotation.value[4]), "8c"),
        Y: common_vendor.o(($event) => handleBackRowClick(rightTeam.value, rightTeamRotation.value[4]), "c5"),
        Z: common_vendor.t(common_vendor.unref(indoorMatchStore).getTimeouts(rightTeam.value)),
        aa: common_vendor.o(($event) => handleTimeout(rightTeam.value), "5f"),
        ab: common_vendor.t(rightTeamScore.value),
        ac: common_vendor.o(($event) => handleScore(rightTeam.value), "6b"),
        ad: timeoutVisible.value
      }, timeoutVisible.value ? {
        ae: common_vendor.t(timeoutTeamName.value),
        af: common_vendor.t(timeoutCountdown.value),
        ag: common_vendor.o(dismissTimeout, "62")
      } : {}, {
        ah: set5SwapVisible.value
      }, set5SwapVisible.value ? {
        ai: common_vendor.o(confirmSet5Swap, "e3")
      } : {}, {
        aj: setBreakVisible.value
      }, setBreakVisible.value ? common_vendor.e({
        ak: setBreakCountdown.value > 0
      }, setBreakCountdown.value > 0 ? {
        al: common_vendor.t(formatCountdown(setBreakCountdown.value))
      } : {}, {
        am: common_vendor.t(teamAName.value),
        an: common_vendor.t(common_vendor.unref(indoorMatchStore).scoreA),
        ao: common_vendor.t(common_vendor.unref(indoorMatchStore).scoreB),
        ap: common_vendor.t(teamBName.value),
        aq: common_vendor.t(common_vendor.unref(indoorMatchStore).setsWonA),
        ar: common_vendor.t(common_vendor.unref(indoorMatchStore).setsWonB),
        as: common_vendor.t(teamAName.value),
        at: common_vendor.f(6, (i, k0, i0) => {
          return {
            a: common_vendor.t(["I", "II", "III", "IV", "V", "VI"][i - 1]),
            b: breakTeamANumbers.value[i - 1],
            c: common_vendor.o(($event) => breakTeamANumbers.value[i - 1] = $event.detail.value, "a" + i),
            d: "a" + i
          };
        }),
        av: common_vendor.t(teamBName.value),
        aw: common_vendor.f(6, (i, k0, i0) => {
          return {
            a: common_vendor.t(["I", "II", "III", "IV", "V", "VI"][i - 1]),
            b: breakTeamBNumbers.value[i - 1],
            c: common_vendor.o(($event) => breakTeamBNumbers.value[i - 1] = $event.detail.value, "b" + i),
            d: "b" + i
          };
        }),
        ax: needSelectServing.value
      }, needSelectServing.value ? {
        ay: common_vendor.t(teamAName.value),
        az: common_vendor.n(breakServingTeam.value === "A" ? "active" : ""),
        aA: common_vendor.o(($event) => breakServingTeam.value = "A", "0f"),
        aB: common_vendor.t(teamBName.value),
        aC: common_vendor.n(breakServingTeam.value === "B" ? "active" : ""),
        aD: common_vendor.o(($event) => breakServingTeam.value = "B", "11")
      } : {}, {
        aE: common_vendor.o(handleNextSet, "f4")
      }) : {}, {
        aF: common_vendor.t(leftTeamName.value),
        aG: common_vendor.t(leftTeamSets.value),
        aH: common_vendor.t(common_vendor.unref(indoorMatchStore).getSubs(leftTeam.value)),
        aI: common_vendor.f(getToolbarNumbers(leftTeam.value), (item, k0, i0) => {
          var _a2, _b2;
          return common_vendor.e({
            a: item.isLibero
          }, item.isLibero ? {
            b: common_vendor.t(item.number)
          } : {
            c: common_vendor.t(item.number)
          }, {
            d: item.number,
            e: ((_a2 = selectedLibero.value) == null ? void 0 : _a2.side) === "left" && ((_b2 = selectedLibero.value) == null ? void 0 : _b2.number) === item.liberoNumber ? 1 : "",
            f: common_vendor.o(($event) => handleLiberoClick("left", item.liberoNumber), item.number)
          });
        }),
        aJ: common_vendor.f(setResults.value, (s, k0, i0) => {
          return {
            a: common_vendor.t(s.scoreA),
            b: common_vendor.t(s.scoreB),
            c: s.scoreA + "-" + s.scoreB,
            d: s.winner === "A" ? 1 : "",
            e: s.winner === "B" ? 1 : ""
          };
        }),
        aK: common_vendor.o(handleUndo, "8b"),
        aL: common_vendor.o(goToSubstitution, "05"),
        aM: common_vendor.o(handleSwapCourts, "fd"),
        aN: common_vendor.f(getToolbarNumbers(rightTeam.value), (item, k0, i0) => {
          var _a2, _b2;
          return common_vendor.e({
            a: item.isLibero
          }, item.isLibero ? {
            b: common_vendor.t(item.number)
          } : {
            c: common_vendor.t(item.number)
          }, {
            d: item.number,
            e: ((_a2 = selectedLibero.value) == null ? void 0 : _a2.side) === "right" && ((_b2 = selectedLibero.value) == null ? void 0 : _b2.number) === item.liberoNumber ? 1 : "",
            f: common_vendor.o(($event) => handleLiberoClick("right", item.liberoNumber), item.number)
          });
        }),
        aO: common_vendor.t(rightTeamName.value),
        aP: common_vendor.t(rightTeamSets.value),
        aQ: common_vendor.t(common_vendor.unref(indoorMatchStore).getSubs(rightTeam.value)),
        aR: isPcLandscapeMode.value ? 1 : ""
      }) : {
        aS: common_vendor.o(($event) => common_vendor.index.navigateTo({
          url: "/pages-indoor/match-setup/index"
        }), "cc")
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a9eb139d"]]);
wx.createPage(MiniProgramPage);
