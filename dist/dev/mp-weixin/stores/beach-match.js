"use strict";
const common_vendor = require("../common/vendor.js");
const engine_beachScoringEngine = require("../engine/beach-scoring-engine.js");
const engine_beachGameRules = require("../engine/beach-game-rules.js");
const models_match = require("../models/match.js");
const services_syncService = require("../services/sync-service.js");
const stores_sync = require("./sync.js");
const useBeachMatchStore = common_vendor.defineStore("beachMatch", () => {
  const match = common_vendor.ref(null);
  const scoringEngine = common_vendor.ref(null);
  const tossWinner = common_vendor.ref(null);
  const tossWinnerChoice = common_vendor.ref(null);
  const courtSwapped = common_vendor.ref(false);
  const lastSwapPoints = common_vendor.ref(0);
  const pendingCourtSwap = common_vendor.ref(null);
  const pending21Swap = common_vendor.ref(null);
  const timeoutsA = common_vendor.ref([0, 0, 0]);
  const timeoutsB = common_vendor.ref([0, 0, 0]);
  const lastTimeout = common_vendor.ref(null);
  const pendingTechTimeout = common_vendor.ref(null);
  const currentSetStartingA = common_vendor.ref([]);
  const currentSetStartingB = common_vendor.ref([]);
  const setBreakEndTime = common_vendor.ref(null);
  const scoreA = common_vendor.computed(() => {
    var _a;
    return ((_a = scoringEngine.value) == null ? void 0 : _a.scoreA) ?? 0;
  });
  const scoreB = common_vendor.computed(() => {
    var _a;
    return ((_a = scoringEngine.value) == null ? void 0 : _a.scoreB) ?? 0;
  });
  const currentSet = common_vendor.computed(() => {
    var _a;
    return ((_a = scoringEngine.value) == null ? void 0 : _a.currentSet) ?? 1;
  });
  const setsWonA = common_vendor.computed(() => {
    var _a;
    return ((_a = scoringEngine.value) == null ? void 0 : _a.setsWonA) ?? 0;
  });
  const setsWonB = common_vendor.computed(() => {
    var _a;
    return ((_a = scoringEngine.value) == null ? void 0 : _a.setsWonB) ?? 0;
  });
  const servingTeam = common_vendor.computed(() => {
    var _a;
    return ((_a = scoringEngine.value) == null ? void 0 : _a.servingTeam) ?? "A";
  });
  const serverIndexA = common_vendor.computed(() => {
    var _a;
    return ((_a = scoringEngine.value) == null ? void 0 : _a.serverIndexA) ?? 0;
  });
  const serverIndexB = common_vendor.computed(() => {
    var _a;
    return ((_a = scoringEngine.value) == null ? void 0 : _a.serverIndexB) ?? 0;
  });
  const isSetComplete = common_vendor.computed(() => {
    var _a;
    return ((_a = scoringEngine.value) == null ? void 0 : _a.isSetComplete) ?? false;
  });
  const isMatchComplete = common_vendor.computed(() => {
    var _a;
    return ((_a = scoringEngine.value) == null ? void 0 : _a.isMatchComplete) ?? false;
  });
  const canUndo = common_vendor.computed(() => {
    var _a;
    return ((_a = scoringEngine.value) == null ? void 0 : _a.canUndo) ?? false;
  });
  const isLive = common_vendor.computed(() => {
    var _a;
    return ((_a = match.value) == null ? void 0 : _a.status) === "live";
  });
  function startMatch(teamAConfig, teamBConfig, initialServingTeam, teamAInitialServer = 0, teamBInitialServer = 0, tossWinnerTeam, tossChoice) {
    match.value = models_match.createMatch(teamAConfig, teamBConfig, initialServingTeam);
    match.value.status = "live";
    const initialServerIndex = initialServingTeam === "A" ? teamAInitialServer : teamBInitialServer;
    scoringEngine.value = new engine_beachScoringEngine.BeachScoringEngine(
      initialServingTeam,
      initialServerIndex,
      teamAInitialServer,
      teamBInitialServer
    );
    tossWinner.value = tossWinnerTeam ?? null;
    tossWinnerChoice.value = tossChoice ?? null;
    courtSwapped.value = false;
    lastSwapPoints.value = 0;
    pendingCourtSwap.value = null;
    timeoutsA.value = [0, 0, 0];
    timeoutsB.value = [0, 0, 0];
    lastTimeout.value = null;
    currentSetStartingA.value = [...teamAConfig.startingPositions];
    currentSetStartingB.value = [...teamBConfig.startingPositions];
  }
  function scorePoint(team) {
    if (!scoringEngine.value)
      return;
    console.log("[BeachMatch] scorePoint called, team:", team);
    const wasSetComplete = scoringEngine.value.isSetComplete;
    scoringEngine.value.scorePoint(team);
    if (!wasSetComplete && scoringEngine.value.isSetComplete) {
      const lastResult = scoringEngine.value.setResults[scoringEngine.value.setResults.length - 1];
      if (lastResult && match.value) {
        lastResult.teamAPlayers = captureSetPlayers("A");
        lastResult.teamBPlayers = captureSetPlayers("B");
      }
      pushSyncSnapshot();
      return;
    }
    console.log("[BeachMatch] scorePoint: calling checkCourtSwap");
    const courtSwapTriggered = checkCourtSwap();
    console.log("[BeachMatch] scorePoint: checkCourtSwap returned", courtSwapTriggered);
    if (!courtSwapTriggered) {
      pushSyncSnapshot();
    }
  }
  function captureSetPlayers(team) {
    const startingIds = team === "A" ? currentSetStartingA.value : currentSetStartingB.value;
    const allPlayers = team === "A" ? match.value.teamA.players : match.value.teamB.players;
    const startingPlayers = startingIds.map((playerId) => {
      const p = allPlayers.find((p2) => p2.id === playerId);
      return p ?? { id: playerId, name: "?", number: "" };
    });
    return {
      startingPlayers,
      subPlayers: []
      // 沙滩排球无换人
    };
  }
  function undoPoint() {
    if (!scoringEngine.value)
      return;
    if (scoringEngine.value.pointHistory.length === 0)
      return;
    scoringEngine.value.undoPoint();
    pushSyncSnapshot();
  }
  function nextSet(servingTeam2, serverIndex, teamAServer, teamBServer) {
    if (!scoringEngine.value)
      return;
    scoringEngine.value.nextSet(servingTeam2, serverIndex, teamAServer, teamBServer);
    currentSetStartingA.value = [...match.value.teamA.startingPositions];
    currentSetStartingB.value = [...match.value.teamB.startingPositions];
    courtSwapped.value = false;
    lastSwapPoints.value = 0;
    pendingCourtSwap.value = null;
    setBreakEndTime.value = null;
    pushSyncSnapshot();
  }
  function swapCourts() {
    courtSwapped.value = !courtSwapped.value;
    pushSyncSnapshot();
  }
  function checkCourtSwap() {
    if (!scoringEngine.value) {
      console.log("[BeachMatch] checkCourtSwap: no scoringEngine");
      return false;
    }
    if (scoringEngine.value.isSetComplete) {
      console.log("[BeachMatch] checkCourtSwap: set is complete");
      return false;
    }
    const totalPoints = scoringEngine.value.scoreA + scoringEngine.value.scoreB;
    const setNumber = scoringEngine.value.currentSet;
    console.log("[BeachMatch] checkCourtSwap, set:", setNumber, "totalPoints:", totalPoints, "lastSwapPoints:", lastSwapPoints.value);
    if (setNumber <= 2 && totalPoints === 21 && lastSwapPoints.value < 21) {
      console.log("[BeachMatch] 触发21分技术暂停");
      pendingTechTimeout.value = { timestamp: Date.now() };
      pending21Swap.value = { timestamp: Date.now() };
      scoringEngine.value.confirmCourtSwap();
      lastSwapPoints.value = scoringEngine.value.lastSwapPoints;
      console.log("[BeachMatch] 技术暂停设置完成, lastSwapPoints:", lastSwapPoints.value);
      pushSyncSnapshot();
      return true;
    }
    const interval = setNumber === 3 ? 5 : 7;
    const needSwap = totalPoints > lastSwapPoints.value && totalPoints % interval === 0;
    console.log("[BeachMatch] needsCourtSwap check:", needSwap, "interval:", interval, "totalPoints > lastSwapPoints:", totalPoints > lastSwapPoints.value, "totalPoints % interval === 0:", totalPoints % interval === 0);
    if (needSwap) {
      console.log("[BeachMatch] 触发换边弹窗");
      pendingCourtSwap.value = { timestamp: Date.now() };
      pushSyncSnapshot();
      return true;
    }
    return false;
  }
  function confirmCourtSwap(needTechTimeout = false) {
    if (!scoringEngine.value)
      return;
    console.log("[BeachMatch] confirmCourtSwap called, courtSwapped before:", courtSwapped.value);
    courtSwapped.value = !courtSwapped.value;
    scoringEngine.value.confirmCourtSwap();
    lastSwapPoints.value = scoringEngine.value.lastSwapPoints;
    pendingCourtSwap.value = null;
    console.log("[BeachMatch] confirmCourtSwap done, courtSwapped after:", courtSwapped.value, "lastSwapPoints:", lastSwapPoints.value);
    if (needTechTimeout) {
      pendingTechTimeout.value = { timestamp: Date.now() };
    }
    pushSyncSnapshot();
  }
  function getPreviousReceiver() {
    if (!scoringEngine.value)
      return "B";
    return scoringEngine.value.servingTeam === "A" ? "B" : "A";
  }
  function setSetBreakEndTime(endTime) {
    setBreakEndTime.value = endTime;
    pushSyncSnapshot();
  }
  function getPlayer(playerId) {
    if (!match.value)
      return void 0;
    return match.value.teamA.players.find((p) => p.id === playerId) ?? match.value.teamB.players.find((p) => p.id === playerId);
  }
  function getCurrentServer(team) {
    var _a, _b;
    if (!match.value)
      return "";
    const players = team === "A" ? match.value.teamA.players : match.value.teamB.players;
    const index = ((_a = scoringEngine.value) == null ? void 0 : _a.getCurrentServerIndex(team)) ?? 0;
    const rotation = team === "A" ? currentSetStartingA.value : currentSetStartingB.value;
    return rotation[index] || ((_b = players[index]) == null ? void 0 : _b.id) || "";
  }
  function callTimeout(team) {
    if (!scoringEngine.value)
      return false;
    const setIndex = scoringEngine.value.currentSet - 1;
    const timeouts = team === "A" ? timeoutsA.value : timeoutsB.value;
    if (timeouts[setIndex] >= engine_beachGameRules.TIMEOUTS_PER_SET)
      return false;
    timeouts[setIndex]++;
    lastTimeout.value = { team, timestamp: Date.now() };
    pushSyncSnapshot();
    return true;
  }
  function clearLastTimeout() {
    lastTimeout.value = null;
    pushSyncSnapshot();
  }
  function clearPendingCourtSwap() {
    pendingCourtSwap.value = null;
    pushSyncSnapshot();
  }
  function startTechTimeout() {
    console.log("[BeachMatch] startTechTimeout called");
    pendingTechTimeout.value = { timestamp: Date.now() };
    console.log("[BeachMatch] pendingTechTimeout set:", pendingTechTimeout.value);
    pushSyncSnapshot();
  }
  function clearPendingTechTimeout() {
    pendingTechTimeout.value = null;
    if (pending21Swap.value) {
      pendingCourtSwap.value = pending21Swap.value;
      pending21Swap.value = null;
    }
    pushSyncSnapshot();
  }
  function getTimeouts(team) {
    if (!scoringEngine.value)
      return 0;
    const setIndex = scoringEngine.value.currentSet - 1;
    const timeouts = team === "A" ? timeoutsA.value : timeoutsB.value;
    return timeouts[setIndex];
  }
  function completeMatch() {
    if (!match.value || !scoringEngine.value)
      return;
    match.value.setScores = scoringEngine.value.setResults.map((r) => ({
      scoreA: r.scoreA,
      scoreB: r.scoreB,
      winner: r.winner,
      pointLog: [...r.pointLog],
      teamAPlayers: r.teamAPlayers ?? { startingPlayers: [], subPlayers: [] },
      teamBPlayers: r.teamBPlayers ?? { startingPlayers: [], subPlayers: [] }
    }));
    match.value.setsWonA = scoringEngine.value.setsWonA;
    match.value.setsWonB = scoringEngine.value.setsWonB;
    match.value.winner = scoringEngine.value.setsWonA > scoringEngine.value.setsWonB ? "A" : "B";
    match.value.status = "completed";
    match.value.endTime = Date.now();
  }
  function resetMatch() {
    match.value = null;
    scoringEngine.value = null;
    courtSwapped.value = false;
    lastSwapPoints.value = 0;
    pendingCourtSwap.value = null;
    timeoutsA.value = [0, 0, 0];
    timeoutsB.value = [0, 0, 0];
    lastTimeout.value = null;
    currentSetStartingA.value = [];
    currentSetStartingB.value = [];
    pendingTechTimeout.value = null;
    pending21Swap.value = null;
    tossWinner.value = null;
    tossWinnerChoice.value = null;
    setBreakEndTime.value = null;
  }
  function pushSyncSnapshot() {
    stores_sync.useSyncStore();
    if (services_syncService.syncService.syncEnabled && scoringEngine.value && match.value) {
      const snapshot = takeSnapshot();
      services_syncService.syncService.pushEvent("STATE_UPDATE", { snapshot });
    }
  }
  function applyRemoteEvent(event) {
    const { type, payload } = event;
    if (type === "STATE_UPDATE" && payload.snapshot) {
      loadSnapshot(payload.snapshot);
      return;
    }
    if (type === "START_MATCH" && payload.matchConfig) {
      const config = payload.matchConfig;
      const teamAConfig = {
        name: config.teamAName,
        players: config.teamAPlayers,
        startingPositions: config.teamAStartingPositions
      };
      const teamBConfig = {
        name: config.teamBName,
        players: config.teamBPlayers,
        startingPositions: config.teamBStartingPositions
      };
      startMatch(
        teamAConfig,
        teamBConfig,
        config.initialServingTeam,
        config.teamAInitialServer ?? 0,
        config.teamBInitialServer ?? 0,
        config.tossWinner ?? void 0,
        config.tossWinnerChoice ?? void 0
      );
    }
  }
  function takeSnapshot() {
    return {
      scoringState: scoringEngine.value.getState(),
      match: JSON.parse(JSON.stringify(match.value)),
      courtSwapped: courtSwapped.value,
      lastSwapPoints: scoringEngine.value.lastSwapPoints,
      pendingCourtSwap: pendingCourtSwap.value ? { ...pendingCourtSwap.value } : null,
      pending21Swap: pending21Swap.value ? { ...pending21Swap.value } : null,
      timeoutsA: [...timeoutsA.value],
      timeoutsB: [...timeoutsB.value],
      currentSetStartingA: [...currentSetStartingA.value],
      currentSetStartingB: [...currentSetStartingB.value],
      lastTimeout: lastTimeout.value ? { ...lastTimeout.value } : null,
      pendingTechTimeout: pendingTechTimeout.value ? { ...pendingTechTimeout.value } : null,
      tossWinner: tossWinner.value,
      tossWinnerChoice: tossWinnerChoice.value,
      setBreakEndTime: setBreakEndTime.value
    };
  }
  function loadSnapshot(snapshot) {
    console.log("[BeachMatch] loadSnapshot, pendingTechTimeout:", snapshot.pendingTechTimeout);
    const engine = new engine_beachScoringEngine.BeachScoringEngine(
      snapshot.scoringState.servingTeam,
      snapshot.scoringState.serverIndexA ?? 0,
      snapshot.scoringState.initialServerA ?? 0,
      snapshot.scoringState.initialServerB ?? 0
    );
    engine.setState(snapshot.scoringState);
    scoringEngine.value = engine;
    match.value = JSON.parse(JSON.stringify(snapshot.match));
    courtSwapped.value = snapshot.courtSwapped;
    lastSwapPoints.value = engine.lastSwapPoints;
    pendingCourtSwap.value = snapshot.pendingCourtSwap ? { ...snapshot.pendingCourtSwap } : null;
    pending21Swap.value = snapshot.pending21Swap ? { ...snapshot.pending21Swap } : null;
    timeoutsA.value = [...snapshot.timeoutsA];
    timeoutsB.value = [...snapshot.timeoutsB];
    currentSetStartingA.value = [...snapshot.currentSetStartingA];
    currentSetStartingB.value = [...snapshot.currentSetStartingB];
    lastTimeout.value = snapshot.lastTimeout ? { ...snapshot.lastTimeout } : null;
    pendingTechTimeout.value = snapshot.pendingTechTimeout ? { ...snapshot.pendingTechTimeout } : null;
    tossWinner.value = snapshot.tossWinner ?? null;
    tossWinnerChoice.value = snapshot.tossWinnerChoice ?? null;
    setBreakEndTime.value = snapshot.setBreakEndTime ?? null;
    console.log("[BeachMatch] loadSnapshot done, pendingTechTimeout:", pendingTechTimeout.value, "tossWinner:", tossWinner.value);
  }
  return {
    match,
    scoringEngine,
    scoreA,
    scoreB,
    currentSet,
    setsWonA,
    setsWonB,
    servingTeam,
    serverIndexA,
    serverIndexB,
    isSetComplete,
    isMatchComplete,
    canUndo,
    isLive,
    courtSwapped,
    lastSwapPoints,
    pendingCourtSwap,
    lastTimeout,
    setBreakEndTime,
    pendingTechTimeout,
    tossWinner,
    tossWinnerChoice,
    startMatch,
    scorePoint,
    undoPoint,
    nextSet,
    swapCourts,
    checkCourtSwap,
    confirmCourtSwap,
    getPreviousReceiver,
    getPlayer,
    getCurrentServer,
    callTimeout,
    clearLastTimeout,
    clearPendingCourtSwap,
    startTechTimeout,
    clearPendingTechTimeout,
    getTimeouts,
    completeMatch,
    resetMatch,
    setSetBreakEndTime,
    applyRemoteEvent,
    pushSyncSnapshot,
    takeSnapshot,
    loadSnapshot
  };
});
exports.useBeachMatchStore = useBeachMatchStore;
