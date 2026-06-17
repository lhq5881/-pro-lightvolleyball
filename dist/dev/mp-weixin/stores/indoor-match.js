"use strict";
const common_vendor = require("../common/vendor.js");
const engine_indoorScoringEngine = require("../engine/indoor-scoring-engine.js");
const engine_indoorRotationEngine = require("../engine/indoor-rotation-engine.js");
const models_match = require("../models/match.js");
const services_syncService = require("../services/sync-service.js");
const stores_sync = require("./sync.js");
const useIndoorMatchStore = common_vendor.defineStore("indoorMatch", () => {
  const match = common_vendor.ref(null);
  const scoringEngine = common_vendor.ref(null);
  const rotationEngine = common_vendor.ref(null);
  const totalSets = common_vendor.ref(3);
  const teamALibero1 = common_vendor.ref("");
  const teamALibero2 = common_vendor.ref("");
  const teamBLibero1 = common_vendor.ref("");
  const teamBLibero2 = common_vendor.ref("");
  const teamALiberoReplacements = common_vendor.ref({});
  const teamBLiberoReplacements = common_vendor.ref({});
  const rotationVersion = common_vendor.ref(0);
  const teamABench = common_vendor.ref([]);
  const teamBBench = common_vendor.ref([]);
  const teamASubIn = common_vendor.ref([]);
  const teamBSubIn = common_vendor.ref([]);
  const courtSwapped = common_vendor.ref(false);
  const set5Swapped = common_vendor.ref(false);
  const timeoutsA = common_vendor.ref([0, 0, 0, 0, 0]);
  const timeoutsB = common_vendor.ref([0, 0, 0, 0, 0]);
  const lastTimeout = common_vendor.ref(null);
  const pendingSet5Swap = common_vendor.ref(null);
  const subsA = common_vendor.ref([0, 0, 0, 0, 0]);
  const subsB = common_vendor.ref([0, 0, 0, 0, 0]);
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
  function startMatch(teamAConfig, teamBConfig, initialServingTeam, sets = 3, teamABenchPlayers = [], teamBBenchPlayers = []) {
    totalSets.value = sets;
    match.value = models_match.createMatch(teamAConfig, teamBConfig, initialServingTeam);
    match.value.status = "live";
    scoringEngine.value = new engine_indoorScoringEngine.IndoorScoringEngine(initialServingTeam, sets);
    rotationEngine.value = new engine_indoorRotationEngine.IndoorRotationEngine(teamAConfig.startingPositions, teamBConfig.startingPositions);
    teamABench.value = [...teamABenchPlayers];
    teamBBench.value = [...teamBBenchPlayers];
    courtSwapped.value = false;
    set5Swapped.value = false;
    timeoutsA.value = [0, 0, 0, 0, 0];
    timeoutsB.value = [0, 0, 0, 0, 0];
    subsA.value = [0, 0, 0, 0, 0];
    subsB.value = [0, 0, 0, 0, 0];
    currentSetStartingA.value = [...teamAConfig.startingPositions];
    currentSetStartingB.value = [...teamBConfig.startingPositions];
    teamASubIn.value = [];
    teamBSubIn.value = [];
  }
  function scorePoint(team) {
    if (!scoringEngine.value || !rotationEngine.value)
      return;
    const wasSetComplete = scoringEngine.value.isSetComplete;
    const willGainServe = team !== scoringEngine.value.servingTeam;
    if (!wasSetComplete && willGainServe) {
      rotationEngine.value.rotate(team);
      rotationVersion.value++;
    }
    scoringEngine.value.scorePoint(team);
    checkLiberoFrontRow("A");
    checkLiberoFrontRow("B");
    pushSyncSnapshot();
    if (!wasSetComplete && scoringEngine.value.isSetComplete) {
      const lastResult = scoringEngine.value.setResults[scoringEngine.value.setResults.length - 1];
      if (lastResult && match.value) {
        lastResult.teamAPlayers = captureSetPlayers("A");
        lastResult.teamBPlayers = captureSetPlayers("B");
      }
      return;
    }
    checkAndSetPendingSet5Swap();
  }
  function captureSetPlayers(team) {
    const startingIds = team === "A" ? currentSetStartingA.value : currentSetStartingB.value;
    const allPlayers = team === "A" ? match.value.teamA.players : match.value.teamB.players;
    const startingPlayers = startingIds.map((playerId) => {
      const p = allPlayers.find((p2) => p2.id === playerId);
      return p ?? { id: playerId, name: "?", number: "" };
    });
    const subInList = team === "A" ? teamASubIn.value : teamBSubIn.value;
    return {
      startingPlayers,
      subPlayers: [...subInList]
    };
  }
  function undoPoint() {
    if (!scoringEngine.value || !rotationEngine.value)
      return;
    if (scoringEngine.value.pointHistory.length === 0)
      return;
    const lastTeam = scoringEngine.value.pointHistory[scoringEngine.value.pointHistory.length - 1].team;
    const currentServer = scoringEngine.value.servingTeam;
    if (lastTeam === currentServer) {
      rotationEngine.value.undoRotation(lastTeam);
      rotationVersion.value++;
    }
    scoringEngine.value.undoPoint();
    pushSyncSnapshot();
  }
  function nextSet(servingTeam2) {
    if (!scoringEngine.value)
      return;
    scoringEngine.value.nextSet(servingTeam2);
    if (rotationEngine.value) {
      currentSetStartingA.value = [...rotationEngine.value.getRotation("A")];
      currentSetStartingB.value = [...rotationEngine.value.getRotation("B")];
    }
    teamASubIn.value = [];
    teamBSubIn.value = [];
    setBreakEndTime.value = null;
    pushSyncSnapshot();
  }
  function setNextSetPositions(team, positionPlayerIds) {
    if (!rotationEngine.value)
      return;
    rotationEngine.value.resetPositions(team, positionPlayerIds);
    rotationVersion.value++;
  }
  function swapCourts() {
    courtSwapped.value = !courtSwapped.value;
    pushSyncSnapshot();
  }
  function checkAndSetPendingSet5Swap() {
    if (!scoringEngine.value)
      return false;
    const decidingSet = totalSets.value;
    if (scoringEngine.value.currentSet !== decidingSet || set5Swapped.value)
      return false;
    const totalPoints = scoringEngine.value.scoreA + scoringEngine.value.scoreB;
    if (totalPoints >= 8 && !pendingSet5Swap.value) {
      pendingSet5Swap.value = { timestamp: Date.now() };
      pushSyncSnapshot();
      return true;
    }
    return false;
  }
  function checkSet5Swap() {
    if (!scoringEngine.value)
      return false;
    const decidingSet = totalSets.value;
    if (scoringEngine.value.currentSet !== decidingSet || set5Swapped.value)
      return false;
    const totalPoints = scoringEngine.value.scoreA + scoringEngine.value.scoreB;
    if (totalPoints >= 8) {
      courtSwapped.value = !courtSwapped.value;
      set5Swapped.value = true;
      scoringEngine.value.confirmSet5Swap();
      return true;
    }
    return false;
  }
  function checkLiberoFrontRow(team) {
    if (!rotationEngine.value)
      return;
    const state = team === "A" ? rotationEngine.value.getRotation("A") : rotationEngine.value.getRotation("B");
    const teamPlayers = team === "A" ? match.value.teamA.players : match.value.teamB.players;
    const libero1 = team === "A" ? teamALibero1.value : teamBLibero1.value;
    const libero2 = team === "A" ? teamALibero2.value : teamBLibero2.value;
    const replacements = team === "A" ? teamALiberoReplacements.value : teamBLiberoReplacements.value;
    const frontRowIndices = [1, 2, 3];
    for (const liberoNumber of [libero1, libero2]) {
      if (!liberoNumber)
        continue;
      const liberoPlayer = teamPlayers.find((p) => p.number === liberoNumber);
      if (!liberoPlayer)
        continue;
      const liberoPosIndex = state.indexOf(liberoPlayer.id);
      if (liberoPosIndex === -1)
        continue;
      if (frontRowIndices.includes(liberoPosIndex)) {
        const originalPlayerId = replacements[liberoNumber];
        if (originalPlayerId) {
          const newPositions = [...state];
          newPositions[liberoPosIndex] = originalPlayerId;
          if (team === "A") {
            rotationEngine.value.setPositions("A", newPositions);
            const newReplacements = { ...teamALiberoReplacements.value };
            delete newReplacements[liberoNumber];
            teamALiberoReplacements.value = newReplacements;
          } else {
            rotationEngine.value.setPositions("B", newPositions);
            const newReplacements = { ...teamBLiberoReplacements.value };
            delete newReplacements[liberoNumber];
            teamBLiberoReplacements.value = newReplacements;
          }
          rotationVersion.value++;
        }
      }
    }
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
  function substitute(team, playerOutId, playerInId, playerIn) {
    if (!rotationEngine.value || !scoringEngine.value)
      return false;
    const setIndex = scoringEngine.value.currentSet - 1;
    const subs = team === "A" ? subsA.value : subsB.value;
    if (subs[setIndex] >= 6)
      return false;
    const success = rotationEngine.value.substitute(team, playerOutId, playerInId, scoringEngine.value.currentSet);
    if (!success)
      return false;
    rotationVersion.value++;
    subs[setIndex]++;
    const teamPlayers = team === "A" ? match.value.teamA.players : match.value.teamB.players;
    if (!teamPlayers.find((p) => p.id === playerInId) && playerIn) {
      teamPlayers.push(playerIn);
    }
    const bench = team === "A" ? teamABench.value : teamBBench.value;
    const playerOut = teamPlayers.find((p) => p.id === playerOutId);
    if (playerOut && !bench.find((p) => p.id === playerOutId)) {
      bench.push(playerOut);
    }
    const subInList = team === "A" ? teamASubIn.value : teamBSubIn.value;
    if (playerIn && !subInList.find((p) => p.id === playerInId)) {
      subInList.push(playerIn);
    }
    pushSyncSnapshot();
    return true;
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
    match.value.teamASubPlayers = [...teamASubIn.value];
    match.value.teamBSubPlayers = [...teamBSubIn.value];
  }
  function getRotation(team) {
    var _a;
    rotationVersion.value;
    return ((_a = rotationEngine.value) == null ? void 0 : _a.getRotation(team)) ?? [];
  }
  function getServer(team) {
    var _a;
    return ((_a = rotationEngine.value) == null ? void 0 : _a.getServer(team)) ?? "";
  }
  function getFrontRow(team) {
    var _a;
    return ((_a = rotationEngine.value) == null ? void 0 : _a.getFrontRow(team)) ?? [];
  }
  function getBackRow(team) {
    var _a;
    return ((_a = rotationEngine.value) == null ? void 0 : _a.getBackRow(team)) ?? [];
  }
  function previewRotation(team) {
    var _a;
    return ((_a = rotationEngine.value) == null ? void 0 : _a.previewRotation(team)) ?? [];
  }
  function getPlayer(playerId) {
    if (!match.value)
      return void 0;
    return match.value.teamA.players.find((p) => p.id === playerId) ?? match.value.teamB.players.find((p) => p.id === playerId);
  }
  function getBench(team) {
    return team === "A" ? teamABench.value : teamBBench.value;
  }
  function callTimeout(team) {
    if (!scoringEngine.value)
      return false;
    const setIndex = scoringEngine.value.currentSet - 1;
    const timeouts = team === "A" ? timeoutsA.value : timeoutsB.value;
    if (timeouts[setIndex] >= 2)
      return false;
    timeouts[setIndex]++;
    lastTimeout.value = { team, timestamp: Date.now() };
    console.log("[IndoorMatch] callTimeout, lastTimeout:", lastTimeout.value);
    pushSyncSnapshot();
    return true;
  }
  function clearLastTimeout() {
    lastTimeout.value = null;
    pushSyncSnapshot();
  }
  function setPendingSet5Swap() {
    pendingSet5Swap.value = { timestamp: Date.now() };
    pushSyncSnapshot();
  }
  function clearPendingSet5Swap() {
    pendingSet5Swap.value = null;
    pushSyncSnapshot();
  }
  function getTimeouts(team) {
    if (!scoringEngine.value)
      return 0;
    const setIndex = scoringEngine.value.currentSet - 1;
    const timeouts = team === "A" ? timeoutsA.value : timeoutsB.value;
    return timeouts[setIndex];
  }
  function getSubs(team) {
    if (!scoringEngine.value)
      return 0;
    const setIndex = scoringEngine.value.currentSet - 1;
    const subs = team === "A" ? subsA.value : subsB.value;
    return subs[setIndex];
  }
  function resetMatch() {
    match.value = null;
    scoringEngine.value = null;
    rotationEngine.value = null;
    teamABench.value = [];
    teamBBench.value = [];
    courtSwapped.value = false;
    set5Swapped.value = false;
    timeoutsA.value = [0, 0, 0, 0, 0];
    timeoutsB.value = [0, 0, 0, 0, 0];
    subsA.value = [0, 0, 0, 0, 0];
    subsB.value = [0, 0, 0, 0, 0];
    currentSetStartingA.value = [];
    currentSetStartingB.value = [];
    teamASubIn.value = [];
    teamBSubIn.value = [];
    setBreakEndTime.value = null;
  }
  function pushSyncSnapshot() {
    const syncStore = stores_sync.useSyncStore();
    console.log("[IndoorMatch] pushSyncSnapshot called");
    console.log("[IndoorMatch] syncEnabled:", services_syncService.syncService.syncEnabled);
    console.log("[IndoorMatch] syncStore.status:", syncStore.status);
    console.log("[IndoorMatch] scoringEngine:", !!scoringEngine.value);
    console.log("[IndoorMatch] rotationEngine:", !!rotationEngine.value);
    console.log("[IndoorMatch] match:", !!match.value);
    if (services_syncService.syncService.syncEnabled && scoringEngine.value && rotationEngine.value && match.value) {
      const snapshot = takeSnapshot();
      console.log("[IndoorMatch] 推送 STATE_UPDATE 事件");
      services_syncService.syncService.pushEvent("STATE_UPDATE", { snapshot });
    }
  }
  function applyRemoteEvent(event) {
    const { type, payload } = event;
    console.log("[IndoorMatch] applyRemoteEvent, type:", type, "payload:", payload);
    if (type === "STATE_UPDATE" && payload.snapshot) {
      console.log("[IndoorMatch] 调用 loadSnapshot");
      loadSnapshot(payload.snapshot);
      return;
    }
    if (type === "START_MATCH" && payload.matchConfig) {
      console.log("[IndoorMatch] 处理 START_MATCH");
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
        config.totalSets ?? 3,
        config.teamABenchPlayers,
        config.teamBBenchPlayers
      );
    }
  }
  function takeSnapshot() {
    return {
      scoringState: scoringEngine.value.getState(),
      rotationState: rotationEngine.value.getState(),
      match: JSON.parse(JSON.stringify(match.value)),
      courtSwapped: courtSwapped.value,
      set3Swapped: set5Swapped.value,
      timeoutsA: [...timeoutsA.value],
      timeoutsB: [...timeoutsB.value],
      subsA: [...subsA.value],
      subsB: [...subsB.value],
      teamABench: [...teamABench.value],
      teamBBench: [...teamBBench.value],
      teamASubIn: [...teamASubIn.value],
      teamBSubIn: [...teamBSubIn.value],
      currentSetStartingA: [...currentSetStartingA.value],
      currentSetStartingB: [...currentSetStartingB.value],
      lastTimeout: lastTimeout.value ? { ...lastTimeout.value } : null,
      pendingSet3Swap: pendingSet5Swap.value ? { ...pendingSet5Swap.value } : null,
      setBreakEndTime: setBreakEndTime.value
    };
  }
  function loadSnapshot(snapshot) {
    console.log("[IndoorMatch] loadSnapshot, lastTimeout:", snapshot.lastTimeout, "pendingSet3Swap:", snapshot.pendingSet3Swap);
    const engine = new engine_indoorScoringEngine.IndoorScoringEngine(snapshot.scoringState.servingTeam, snapshot.scoringState.totalSets ?? 3);
    engine.setState(snapshot.scoringState);
    scoringEngine.value = engine;
    totalSets.value = snapshot.scoringState.totalSets ?? 3;
    const rotEngine = new engine_indoorRotationEngine.IndoorRotationEngine(
      snapshot.rotationState.teamA.positions,
      snapshot.rotationState.teamB.positions
    );
    rotEngine.setState(snapshot.rotationState);
    rotationEngine.value = rotEngine;
    match.value = JSON.parse(JSON.stringify(snapshot.match));
    courtSwapped.value = snapshot.courtSwapped;
    set5Swapped.value = snapshot.set3Swapped;
    timeoutsA.value = [...snapshot.timeoutsA];
    timeoutsB.value = [...snapshot.timeoutsB];
    subsA.value = [...snapshot.subsA];
    subsB.value = [...snapshot.subsB];
    teamABench.value = [...snapshot.teamABench];
    teamBBench.value = [...snapshot.teamBBench];
    teamASubIn.value = [...snapshot.teamASubIn];
    teamBSubIn.value = [...snapshot.teamBSubIn];
    currentSetStartingA.value = [...snapshot.currentSetStartingA];
    currentSetStartingB.value = [...snapshot.currentSetStartingB];
    lastTimeout.value = snapshot.lastTimeout ? { ...snapshot.lastTimeout } : null;
    pendingSet5Swap.value = snapshot.pendingSet3Swap ? { ...snapshot.pendingSet3Swap } : null;
    setBreakEndTime.value = snapshot.setBreakEndTime ?? null;
    console.log("[IndoorMatch] loadSnapshot done, lastTimeout:", lastTimeout.value, "pendingSet5Swap:", pendingSet5Swap.value);
  }
  function setLiberoNumbers(aLibero1, aLibero2, bLibero1, bLibero2) {
    teamALibero1.value = aLibero1;
    teamALibero2.value = aLibero2;
    teamBLibero1.value = bLibero1;
    teamBLibero2.value = bLibero2;
  }
  function liberoSwap(team, backRowPlayerId, liberoNumber) {
    if (!rotationEngine.value || !match.value)
      return { success: false };
    if (!liberoNumber)
      return { success: false };
    const state = team === "A" ? rotationEngine.value.getRotation("A") : rotationEngine.value.getRotation("B");
    const backRowPosIndex = state.indexOf(backRowPlayerId);
    console.log("[liberoSwap] team:", team, "backRowPlayerId:", backRowPlayerId, "liberoNumber:", liberoNumber, "backRowPosIndex:", backRowPosIndex, "state:", state);
    if (backRowPosIndex === -1)
      return { success: false };
    const backRowIndices = [0, 4, 5];
    if (!backRowIndices.includes(backRowPosIndex))
      return { success: false };
    const teamPlayers = team === "A" ? match.value.teamA.players : match.value.teamB.players;
    let liberoPlayer = teamPlayers.find((p) => p.number === liberoNumber);
    if (!liberoPlayer) {
      liberoPlayer = {
        id: `libero_${team}_${liberoNumber}`,
        name: `自由人${liberoNumber}`,
        number: liberoNumber,
        isCaptain: false
      };
      teamPlayers.push(liberoPlayer);
      console.log("[liberoSwap] created liberoPlayer:", liberoPlayer.id);
    }
    const liberoPosIndex = state.indexOf(liberoPlayer.id);
    console.log("[liberoSwap] liberoPlayer.id:", liberoPlayer.id, "liberoPosIndex:", liberoPosIndex);
    const replacements = team === "A" ? teamALiberoReplacements.value : teamBLiberoReplacements.value;
    console.log("[liberoSwap] replacements:", replacements);
    const replacedPlayerId = replacements[liberoNumber];
    if (liberoPosIndex !== -1 && replacedPlayerId) {
      const newPositions2 = [...state];
      newPositions2[liberoPosIndex] = replacedPlayerId;
      const originalPlayer = teamPlayers.find((p) => p.id === replacedPlayerId);
      let originalCaptainRestored = false;
      if (originalPlayer == null ? void 0 : originalPlayer.isCaptain) {
        teamPlayers.forEach((p) => {
          p.isCaptain = p.id === replacedPlayerId;
        });
        originalCaptainRestored = true;
      }
      if (team === "A") {
        const newReplacements = { ...replacements };
        delete newReplacements[liberoNumber];
        teamALiberoReplacements.value = newReplacements;
        rotationEngine.value.setPositions("A", newPositions2);
        rotationVersion.value++;
      } else {
        const newReplacements = { ...replacements };
        delete newReplacements[liberoNumber];
        teamBLiberoReplacements.value = newReplacements;
        rotationEngine.value.setPositions("B", newPositions2);
        rotationVersion.value++;
      }
      pushSyncSnapshot();
      return { success: true, originalCaptainRestored };
    }
    const libero1 = team === "A" ? teamALibero1.value : teamBLibero1.value;
    const libero2 = team === "A" ? teamALibero2.value : teamBLibero2.value;
    const otherLiberoNumber = liberoNumber === libero1 ? libero2 : libero1;
    if (otherLiberoNumber && liberoPosIndex === -1) {
      const otherLiberoPlayer = teamPlayers.find((p) => p.number === otherLiberoNumber);
      if (otherLiberoPlayer) {
        const otherLiberoPosIndex = state.indexOf(otherLiberoPlayer.id);
        if (otherLiberoPosIndex !== -1) {
          const otherReplacedPlayerId = replacements[otherLiberoNumber];
          if (otherReplacedPlayerId) {
            const newState = [...state];
            newState[otherLiberoPosIndex] = liberoPlayer.id;
            const otherReplacedPlayer = teamPlayers.find((p) => p.id === otherReplacedPlayerId);
            const captainReplaced2 = (otherReplacedPlayer == null ? void 0 : otherReplacedPlayer.isCaptain) || false;
            if (team === "A") {
              const newReplacements = { ...replacements };
              delete newReplacements[otherLiberoNumber];
              newReplacements[liberoNumber] = otherReplacedPlayerId;
              teamALiberoReplacements.value = newReplacements;
              rotationEngine.value.setPositions("A", newState);
              rotationVersion.value++;
            } else {
              const newReplacements = { ...replacements };
              delete newReplacements[otherLiberoNumber];
              newReplacements[liberoNumber] = otherReplacedPlayerId;
              teamBLiberoReplacements.value = newReplacements;
              rotationEngine.value.setPositions("B", newState);
              rotationVersion.value++;
            }
            pushSyncSnapshot();
            return { success: true, captainReplaced: captainReplaced2 };
          }
        }
      }
    }
    if (liberoPosIndex !== -1) {
      return { success: false };
    }
    const newPositions = [...state];
    newPositions[backRowPosIndex] = liberoPlayer.id;
    console.log("[liberoSwap] newPositions:", newPositions);
    const replacedPlayer = teamPlayers.find((p) => p.id === backRowPlayerId);
    const captainReplaced = (replacedPlayer == null ? void 0 : replacedPlayer.isCaptain) || false;
    if (team === "A") {
      teamALiberoReplacements.value = { ...replacements, [liberoNumber]: backRowPlayerId };
      rotationEngine.value.setPositions("A", newPositions);
      rotationVersion.value++;
      console.log("[liberoSwap] setPositions A done, getRotation:", rotationEngine.value.getRotation("A"));
    } else {
      teamBLiberoReplacements.value = { ...replacements, [liberoNumber]: backRowPlayerId };
      rotationEngine.value.setPositions("B", newPositions);
      rotationVersion.value++;
      console.log("[liberoSwap] setPositions B done, getRotation:", rotationEngine.value.getRotation("B"));
    }
    pushSyncSnapshot();
    return { success: true, captainReplaced };
  }
  return {
    match,
    scoringEngine,
    rotationEngine,
    totalSets,
    teamALibero1,
    teamALibero2,
    teamBLibero1,
    teamBLibero2,
    teamALiberoReplacements,
    teamBLiberoReplacements,
    rotationVersion,
    scoreA,
    scoreB,
    currentSet,
    setsWonA,
    setsWonB,
    servingTeam,
    isSetComplete,
    isMatchComplete,
    canUndo,
    isLive,
    courtSwapped,
    set5Swapped,
    setBreakEndTime,
    lastTimeout,
    pendingSet5Swap,
    startMatch,
    scorePoint,
    undoPoint,
    nextSet,
    setNextSetPositions,
    swapCourts,
    checkSet5Swap,
    getPreviousReceiver,
    substitute,
    liberoSwap,
    completeMatch,
    getRotation,
    getServer,
    getFrontRow,
    getBackRow,
    previewRotation,
    getPlayer,
    getBench,
    callTimeout,
    clearLastTimeout,
    setPendingSet5Swap,
    clearPendingSet5Swap,
    setSetBreakEndTime,
    setLiberoNumbers,
    getTimeouts,
    getSubs,
    resetMatch,
    applyRemoteEvent,
    pushSyncSnapshot,
    takeSnapshot,
    loadSnapshot
  };
});
exports.useIndoorMatchStore = useIndoorMatchStore;
