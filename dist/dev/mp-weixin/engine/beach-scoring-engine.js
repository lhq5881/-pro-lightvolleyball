"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const engine_beachGameRules = require("./beach-game-rules.js");
class BeachScoringEngine {
  constructor(initialServingTeam, initialServerIndex = 0, teamAInitialServer = 0, teamBInitialServer = 0) {
    __publicField(this, "state");
    this.state = {
      scoreA: 0,
      scoreB: 0,
      currentSet: 1,
      setsWonA: 0,
      setsWonB: 0,
      servingTeam: initialServingTeam,
      serverIndexA: initialServingTeam === "A" ? initialServerIndex : teamAInitialServer,
      serverIndexB: initialServingTeam === "B" ? initialServerIndex : teamBInitialServer,
      initialServerIndexA: teamAInitialServer,
      initialServerIndexB: teamBInitialServer,
      serverCountA: initialServingTeam === "A" ? 1 : 0,
      serverCountB: initialServingTeam === "B" ? 1 : 0,
      isSetComplete: false,
      isMatchComplete: false,
      setResults: [],
      pointHistory: [],
      currentSetPointLog: [],
      lastSwapPoints: 0
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
  get serverIndexA() {
    return this.state.serverIndexA;
  }
  get serverIndexB() {
    return this.state.serverIndexB;
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
  get lastSwapPoints() {
    return this.state.lastSwapPoints;
  }
  /** 得分 */
  scorePoint(team) {
    if (this.state.isSetComplete || this.state.isMatchComplete)
      return;
    const wasServing = this.state.servingTeam;
    if (team === "A")
      this.state.scoreA++;
    else
      this.state.scoreB++;
    if (team !== wasServing) {
      this.state.servingTeam = team;
      if (team === "A") {
        if (this.state.serverCountA === 0) {
          this.state.serverIndexA = this.state.initialServerIndexA;
        } else if (this.state.serverCountA === 1) {
          this.state.serverIndexA = (this.state.initialServerIndexA + 1) % 2;
        } else {
          this.state.serverIndexA = this.state.initialServerIndexA;
          this.state.serverCountA = 0;
        }
        this.state.serverCountA++;
      } else {
        if (this.state.serverCountB === 0) {
          this.state.serverIndexB = this.state.initialServerIndexB;
        } else if (this.state.serverCountB === 1) {
          this.state.serverIndexB = (this.state.initialServerIndexB + 1) % 2;
        } else {
          this.state.serverIndexB = this.state.initialServerIndexB;
          this.state.serverCountB = 0;
        }
        this.state.serverCountB++;
      }
    }
    this.state.pointHistory.push({ team });
    this.state.currentSetPointLog.push(team);
    if (engine_beachGameRules.isSetOver(this.state.scoreA, this.state.scoreB, this.state.currentSet)) {
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
    this.recalcServingState();
  }
  /** 从得分历史重新计算发球状态 */
  recalcServingState() {
    if (this.state.pointHistory.length === 0) {
      this.state.servingTeam = "A";
      this.state.serverIndexA = this.state.initialServerIndexA;
      this.state.serverIndexB = this.state.initialServerIndexB;
      this.state.serverCountA = 0;
      this.state.serverCountB = 0;
      return;
    }
    let currentServer = this.state.servingTeam;
    let serverCountA = 0;
    let serverCountB = 0;
    let serverIndexA = this.state.initialServerIndexA;
    let serverIndexB = this.state.initialServerIndexB;
    let prevTeam = null;
    for (const point of this.state.pointHistory) {
      if (prevTeam !== null && point.team !== prevTeam) {
        currentServer = point.team;
        if (point.team === "A") {
          if (serverCountA === 0) {
            serverIndexA = this.state.initialServerIndexA;
          } else if (serverCountA === 1) {
            serverIndexA = (this.state.initialServerIndexA + 1) % 2;
          } else {
            serverIndexA = this.state.initialServerIndexA;
            serverCountA = 0;
          }
          serverCountA++;
        } else {
          if (serverCountB === 0) {
            serverIndexB = this.state.initialServerIndexB;
          } else if (serverCountB === 1) {
            serverIndexB = (this.state.initialServerIndexB + 1) % 2;
          } else {
            serverIndexB = this.state.initialServerIndexB;
            serverCountB = 0;
          }
          serverCountB++;
        }
      } else if (prevTeam === null) {
        currentServer = point.team;
        if (point.team === "A") {
          serverIndexA = this.state.initialServerIndexA;
          serverCountA = 1;
        } else {
          serverIndexB = this.state.initialServerIndexB;
          serverCountB = 1;
        }
      }
      prevTeam = point.team;
    }
    this.state.servingTeam = currentServer;
    this.state.serverIndexA = serverIndexA;
    this.state.serverIndexB = serverIndexB;
    this.state.serverCountA = serverCountA;
    this.state.serverCountB = serverCountB;
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
    if (engine_beachGameRules.isMatchOver(this.state.setsWonA, this.state.setsWonB)) {
      this.state.isMatchComplete = true;
    }
  }
  /** 进入下一局 */
  nextSet(servingTeam, serverIndex, teamAServer, teamBServer) {
    if (!this.state.isSetComplete || this.state.isMatchComplete)
      return;
    this.state.currentSet++;
    this.state.scoreA = 0;
    this.state.scoreB = 0;
    this.state.isSetComplete = false;
    this.state.currentSetPointLog = [];
    this.state.lastSwapPoints = 0;
    this.state.serverCountA = 0;
    this.state.serverCountB = 0;
    if (teamAServer !== void 0) {
      this.state.initialServerIndexA = teamAServer;
    }
    if (teamBServer !== void 0) {
      this.state.initialServerIndexB = teamBServer;
    }
    if (servingTeam) {
      this.state.servingTeam = servingTeam;
      if (serverIndex !== void 0) {
        if (servingTeam === "A") {
          this.state.serverIndexA = serverIndex;
          this.state.initialServerIndexA = serverIndex;
        } else {
          this.state.serverIndexB = serverIndex;
          this.state.initialServerIndexB = serverIndex;
        }
      }
      if (servingTeam === "A") {
        this.state.serverCountA = 1;
      } else {
        this.state.serverCountB = 1;
      }
    }
  }
  /** 确认换边 */
  confirmCourtSwap() {
    const totalPoints = this.state.scoreA + this.state.scoreB;
    this.state.lastSwapPoints = totalPoints;
  }
  /** 获取当前发球队员索引 */
  getCurrentServerIndex(team) {
    return team === "A" ? this.state.serverIndexA : this.state.serverIndexB;
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
      serverIndexA: this.state.serverIndexA,
      serverIndexB: this.state.serverIndexB,
      initialServerIndexA: this.state.initialServerIndexA,
      initialServerIndexB: this.state.initialServerIndexB,
      serverCountA: this.state.serverCountA,
      serverCountB: this.state.serverCountB,
      isSetComplete: this.state.isSetComplete,
      isMatchComplete: this.state.isMatchComplete,
      setResults: this.state.setResults.map((r) => ({
        ...r,
        pointLog: [...r.pointLog]
      })),
      pointHistory: this.state.pointHistory.map((p) => ({ ...p })),
      currentSetPointLog: [...this.state.currentSetPointLog],
      lastSwapPoints: this.state.lastSwapPoints
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
      serverIndexA: state.serverIndexA,
      serverIndexB: state.serverIndexB,
      initialServerIndexA: state.initialServerIndexA,
      initialServerIndexB: state.initialServerIndexB,
      serverCountA: state.serverCountA,
      serverCountB: state.serverCountB,
      isSetComplete: state.isSetComplete,
      isMatchComplete: state.isMatchComplete,
      setResults: state.setResults.map((r) => ({
        ...r,
        pointLog: [...r.pointLog]
      })),
      pointHistory: state.pointHistory.map((p) => ({ ...p })),
      currentSetPointLog: [...state.currentSetPointLog],
      lastSwapPoints: state.lastSwapPoints
    };
  }
}
exports.BeachScoringEngine = BeachScoringEngine;
