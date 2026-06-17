"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const engine_gameRules = require("./game-rules.js");
class RotationEngine {
  constructor(teamAPlayers, teamBPlayers) {
    __publicField(this, "teamA");
    __publicField(this, "teamB");
    __publicField(this, "rotationHistory", []);
    __publicField(this, "substitutionHistory", []);
    this.teamA = { positions: [...teamAPlayers] };
    this.teamB = { positions: [...teamBPlayers] };
  }
  /** 顺时针轮转：1→5→4→3→2→1
   *  原1号位→5号位, 原2号位→1号位(发球), 原3号位→2号位, 原4号位→3号位, 原5号位→4号位
   *  即 newPos[i] = old[(i+1)%5]
   */
  rotate(team) {
    const state = team === "A" ? this.teamA : this.teamB;
    const before = [...state.positions];
    const newPos = new Array(engine_gameRules.PLAYER_COUNT);
    for (let i = 0; i < engine_gameRules.PLAYER_COUNT; i++) {
      newPos[i] = before[(i + 1) % engine_gameRules.PLAYER_COUNT];
    }
    state.positions = newPos;
    this.rotationHistory.push({
      team,
      beforePositions: before,
      afterPositions: [...newPos]
    });
  }
  /** 撤销轮转 */
  undoRotation(team) {
    const last = this.rotationHistory[this.rotationHistory.length - 1];
    if (!last || last.team !== team)
      return;
    const state = team === "A" ? this.teamA : this.teamB;
    state.positions = [...last.beforePositions];
    this.rotationHistory.pop();
  }
  /** 换人：替补进入被替换队员的位置 */
  substitute(team, playerOutId, playerInId, setNumber) {
    const state = team === "A" ? this.teamA : this.teamB;
    const posIndex = state.positions.indexOf(playerOutId);
    if (posIndex === -1)
      return false;
    state.positions[posIndex] = playerInId;
    this.substitutionHistory.push({
      team,
      playerOutId,
      playerInId,
      positionIndex: posIndex,
      setNumber
    });
    return true;
  }
  /** 撤销换人 */
  undoSubstitution() {
    const last = this.substitutionHistory[this.substitutionHistory.length - 1];
    if (!last)
      return;
    const state = last.team === "A" ? this.teamA : this.teamB;
    state.positions[last.positionIndex] = last.playerOutId;
    this.substitutionHistory.pop();
  }
  /** 获取当前轮转站位 */
  getRotation(team) {
    const state = team === "A" ? this.teamA : this.teamB;
    return [...state.positions];
  }
  /** 获取发球队员（1号位） */
  getServer(team) {
    const state = team === "A" ? this.teamA : this.teamB;
    return state.positions[0];
  }
  /** 获取前排队员（2、3、4号位 = 索引1、2、3） */
  getFrontRow(team) {
    const state = team === "A" ? this.teamA : this.teamB;
    return [state.positions[1], state.positions[2], state.positions[3]];
  }
  /** 获取后排队员（5、1号位 = 索引4、0） */
  getBackRow(team) {
    const state = team === "A" ? this.teamA : this.teamB;
    return [state.positions[4], state.positions[0]];
  }
  /** 预览下次轮转后的站位 */
  previewRotation(team) {
    const current = this.getRotation(team);
    const preview = new Array(engine_gameRules.PLAYER_COUNT);
    for (let i = 0; i < engine_gameRules.PLAYER_COUNT; i++) {
      preview[i] = current[(i + 1) % engine_gameRules.PLAYER_COUNT];
    }
    return preview;
  }
  /** 获取某队本局换人次数 */
  getSubCount(team, setNumber) {
    return this.substitutionHistory.filter((s) => s.team === team && s.setNumber === setNumber).length;
  }
  /** 重置某队站位（局间重新设置首发） */
  resetPositions(team, playerIds) {
    const state = team === "A" ? this.teamA : this.teamB;
    state.positions = [...playerIds];
  }
  /** 获取完整状态用于持久化 */
  getState() {
    return {
      teamA: { positions: [...this.teamA.positions] },
      teamB: { positions: [...this.teamB.positions] },
      rotationHistory: this.rotationHistory.map((r) => ({ ...r, beforePositions: [...r.beforePositions], afterPositions: [...r.afterPositions] })),
      substitutionHistory: [...this.substitutionHistory]
    };
  }
  /** 恢复状态 */
  setState(state) {
    this.teamA = { positions: [...state.teamA.positions] };
    this.teamB = { positions: [...state.teamB.positions] };
    this.rotationHistory = state.rotationHistory.map((r) => ({ ...r, beforePositions: [...r.beforePositions], afterPositions: [...r.afterPositions] }));
    this.substitutionHistory = [...state.substitutionHistory];
  }
}
exports.RotationEngine = RotationEngine;
