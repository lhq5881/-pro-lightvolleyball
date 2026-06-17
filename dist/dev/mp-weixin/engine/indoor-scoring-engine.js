"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const engine_indoorGameRules = require("./indoor-game-rules.js");
class IndoorScoringEngine {
  constructor(initialServingTeam, totalSets = 3) {
    __publicField(this, "state");
    this.state = {
      scoreA: 0,
      scoreB: 0,
      currentSet: 1,
      setsWonA: 0,
      setsWonB: 0,
      servingTeam: initialServingTeam,
      totalSets,
      isSetComplete: false,
      isMatchComplete: false,
      setResults: [],
      pointHistory: [],
      currentSetPointLog: [],
      set5Swapped: false
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
  get totalSets() {
    return this.state.totalSets;
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
  get set5Swapped() {
    return this.state.set5Swapped;
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
    const totalPoints = this.state.scoreA + this.state.scoreB;
    if (engine_indoorGameRules.needsDecidingSetSwap(this.state.currentSet, totalPoints, this.state.set5Swapped, this.state.totalSets))
      ;
    if (engine_indoorGameRules.isSetOver(this.state.scoreA, this.state.scoreB, this.state.currentSet, this.state.totalSets)) {
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
    const setsToWin = Math.floor(this.state.totalSets / 2) + 1;
    if (this.state.setsWonA >= setsToWin || this.state.setsWonB >= setsToWin) {
      this.state.isMatchComplete = true;
    }
  }
  /** 进入下一局 */
  nextSet(servingTeam) {
    if (!this.state.isSetComplete || this.state.isMatchComplete)
      return;
    const previousServingTeam = this.state.servingTeam;
    const previousReceiver = this.state.servingTeam === "A" ? "B" : "A";
    this.state.currentSet++;
    this.state.scoreA = 0;
    this.state.scoreB = 0;
    this.state.isSetComplete = false;
    this.state.currentSetPointLog = [];
    this.state.set5Swapped = false;
    if (!servingTeam) {
      this.state.servingTeam = previousReceiver;
      console.log(`[IndoorScoringEngine] nextSet 自动交替: 上一局发球方=${previousServingTeam}, 接发球方=${previousReceiver}, 新发球方=${this.state.servingTeam}`);
    } else {
      this.state.servingTeam = servingTeam;
      console.log(`[IndoorScoringEngine] nextSet 指定发球方: ${servingTeam}`);
    }
  }
  /** 确认决胜局换边 */
  confirmSet5Swap() {
    this.state.set5Swapped = true;
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
      totalSets: this.state.totalSets,
      isSetComplete: this.state.isSetComplete,
      isMatchComplete: this.state.isMatchComplete,
      setResults: this.state.setResults.map((r) => ({
        ...r,
        pointLog: [...r.pointLog],
        teamAPlayers: r.teamAPlayers ? { startingPlayers: [...r.teamAPlayers.startingPlayers], subPlayers: [...r.teamAPlayers.subPlayers] } : void 0,
        teamBPlayers: r.teamBPlayers ? { startingPlayers: [...r.teamBPlayers.startingPlayers], subPlayers: [...r.teamBPlayers.subPlayers] } : void 0
      })),
      pointHistory: this.state.pointHistory.map((p) => ({ ...p })),
      currentSetPointLog: [...this.state.currentSetPointLog],
      set5Swapped: this.state.set5Swapped
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
      totalSets: state.totalSets,
      isSetComplete: state.isSetComplete,
      isMatchComplete: state.isMatchComplete,
      setResults: state.setResults.map((r) => ({
        ...r,
        pointLog: [...r.pointLog],
        teamAPlayers: r.teamAPlayers ? { startingPlayers: [...r.teamAPlayers.startingPlayers], subPlayers: [...r.teamAPlayers.subPlayers] } : void 0,
        teamBPlayers: r.teamBPlayers ? { startingPlayers: [...r.teamBPlayers.startingPlayers], subPlayers: [...r.teamBPlayers.subPlayers] } : void 0
      })),
      pointHistory: state.pointHistory.map((p) => ({ ...p })),
      currentSetPointLog: [...state.currentSetPointLog],
      set5Swapped: state.set5Swapped
    };
  }
}
exports.IndoorScoringEngine = IndoorScoringEngine;
