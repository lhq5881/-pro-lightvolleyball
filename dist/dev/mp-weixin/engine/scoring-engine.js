"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const engine_gameRules = require("./game-rules.js");
class ScoringEngine {
  constructor(initialServingTeam, setCaps) {
    __publicField(this, "state");
    this.state = {
      scoreA: 0,
      scoreB: 0,
      currentSet: 1,
      setsWonA: 0,
      setsWonB: 0,
      servingTeam: initialServingTeam,
      isSetComplete: false,
      isMatchComplete: false,
      setResults: [],
      pointHistory: [],
      setCaps: setCaps ?? [
        engine_gameRules.DEFAULT_CAP_REGULAR,
        engine_gameRules.DEFAULT_CAP_REGULAR,
        engine_gameRules.DEFAULT_CAP_DECIDING
      ],
      currentSetPointLog: []
    };
  }
  get scoreA() {
    return this.state.scoreA;
  }
  get scoreB() {
    return this.state.scoreB;
  }
  get currentSet() {
    return this.state.currentSet;
  }
  get setsWonA() {
    return this.state.setsWonA;
  }
  get setsWonB() {
    return this.state.setsWonB;
  }
  get servingTeam() {
    return this.state.servingTeam;
  }
  get isSetComplete() {
    return this.state.isSetComplete;
  }
  get isMatchComplete() {
    return this.state.isMatchComplete;
  }
  get canUndo() {
    return this.state.pointHistory.length > 0;
  }
  get pointHistory() {
    return this.state.pointHistory;
  }
  get setResults() {
    return this.state.setResults;
  }
  /** 得分 */
  scorePoint(team) {
    if (this.state.isSetComplete || this.state.isMatchComplete)
      return;
    if (team === "A")
      this.state.scoreA++;
    else
      this.state.scoreB++;
    if (team !== this.state.servingTeam) {
      this.state.servingTeam = team;
    }
    this.state.pointHistory.push({ team });
    this.state.currentSetPointLog.push(team);
    if (engine_gameRules.isSetOver(this.state.scoreA, this.state.scoreB, this.state.currentSet, this.state.setCaps[this.state.currentSet - 1])) {
      this.endSet();
    }
  }
  /** 撤销 */
  undoPoint() {
    if (this.state.pointHistory.length === 0)
      return;
    const last = this.state.pointHistory.pop();
    if (last.team === "A")
      this.state.scoreA--;
    else
      this.state.scoreB--;
    this.state.currentSetPointLog.pop();
    if (this.state.isSetComplete) {
      this.state.isSetComplete = false;
      this.state.isMatchComplete = false;
      const lastResult = this.state.setResults.pop();
      if (lastResult) {
        if (lastResult.winner === "A")
          this.state.setsWonA--;
        else
          this.state.setsWonB--;
      }
    }
    this.recalcServingTeam();
  }
  /** 从得分历史重新计算发球方 */
  recalcServingTeam() {
    if (this.state.pointHistory.length === 0)
      return;
    this.state.servingTeam = this.state.pointHistory[this.state.pointHistory.length - 1].team;
  }
  endSet() {
    const winner = this.state.scoreA > this.state.scoreB ? "A" : "B";
    if (winner === "A")
      this.state.setsWonA++;
    else
      this.state.setsWonB++;
    this.state.setResults.push({
      setNumber: this.state.currentSet,
      scoreA: this.state.scoreA,
      scoreB: this.state.scoreB,
      winner,
      pointLog: [...this.state.currentSetPointLog]
    });
    this.state.isSetComplete = true;
    if (engine_gameRules.isMatchOver(this.state.setsWonA, this.state.setsWonB)) {
      this.state.isMatchComplete = true;
    }
  }
  /** 进入下一局 */
  nextSet(servingTeam) {
    if (!this.state.isSetComplete || this.state.isMatchComplete)
      return;
    this.state.currentSet++;
    this.state.scoreA = 0;
    this.state.scoreB = 0;
    this.state.isSetComplete = false;
    this.state.currentSetPointLog = [];
    if (servingTeam) {
      this.state.servingTeam = servingTeam;
    }
  }
  /** 设置某局封顶分数 */
  setCap(setIndex, cap) {
    if (setIndex >= 0 && setIndex < this.state.setCaps.length) {
      this.state.setCaps[setIndex] = cap;
    }
  }
  /** 获取某局封顶分数 */
  getCap(setIndex) {
    return this.state.setCaps[setIndex] ?? (setIndex === 2 ? engine_gameRules.DEFAULT_CAP_DECIDING : engine_gameRules.DEFAULT_CAP_REGULAR);
  }
  /** 序列化状态 */
  getState() {
    return {
      scoreA: this.state.scoreA,
      scoreB: this.state.scoreB,
      currentSet: this.state.currentSet,
      setsWonA: this.state.setsWonA,
      setsWonB: this.state.setsWonB,
      servingTeam: this.state.servingTeam,
      isSetComplete: this.state.isSetComplete,
      isMatchComplete: this.state.isMatchComplete,
      setResults: this.state.setResults.map((r) => ({
        ...r,
        pointLog: [...r.pointLog],
        teamAPlayers: r.teamAPlayers ? { startingPlayers: [...r.teamAPlayers.startingPlayers], subPlayers: [...r.teamAPlayers.subPlayers] } : void 0,
        teamBPlayers: r.teamBPlayers ? { startingPlayers: [...r.teamBPlayers.startingPlayers], subPlayers: [...r.teamBPlayers.subPlayers] } : void 0
      })),
      pointHistory: this.state.pointHistory.map((p) => ({ ...p })),
      setCaps: [...this.state.setCaps],
      currentSetPointLog: [...this.state.currentSetPointLog]
    };
  }
  /** 恢复状态 */
  setState(state) {
    this.state = {
      scoreA: state.scoreA,
      scoreB: state.scoreB,
      currentSet: state.currentSet,
      setsWonA: state.setsWonA,
      setsWonB: state.setsWonB,
      servingTeam: state.servingTeam,
      isSetComplete: state.isSetComplete,
      isMatchComplete: state.isMatchComplete,
      setResults: state.setResults.map((r) => ({
        ...r,
        pointLog: [...r.pointLog],
        teamAPlayers: r.teamAPlayers ? { startingPlayers: [...r.teamAPlayers.startingPlayers], subPlayers: [...r.teamAPlayers.subPlayers] } : void 0,
        teamBPlayers: r.teamBPlayers ? { startingPlayers: [...r.teamBPlayers.startingPlayers], subPlayers: [...r.teamBPlayers.subPlayers] } : void 0
      })),
      pointHistory: state.pointHistory.map((p) => ({ ...p })),
      setCaps: [...state.setCaps],
      currentSetPointLog: [...state.currentSetPointLog]
    };
  }
}
exports.ScoringEngine = ScoringEngine;
