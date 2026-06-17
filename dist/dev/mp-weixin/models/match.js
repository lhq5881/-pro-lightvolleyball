"use strict";
function createPlayer(name, number, isCaptain = false) {
  return {
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    number,
    isCaptain
  };
}
function createMatch(teamA, teamB, initialServingTeam) {
  return {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    teamA,
    teamB,
    setScores: [],
    setsWonA: 0,
    setsWonB: 0,
    winner: null,
    status: "scheduled",
    initialServingTeam,
    startTime: Date.now(),
    teamASubPlayers: [],
    teamBSubPlayers: []
  };
}
exports.createMatch = createMatch;
exports.createPlayer = createPlayer;
