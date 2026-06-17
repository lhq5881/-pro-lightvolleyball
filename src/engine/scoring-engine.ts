import { isSetOver, isMatchOver, getTargetPoints, DEFAULT_CAP_REGULAR, DEFAULT_CAP_DECIDING, TOTAL_SETS } from './game-rules'
import type { SetPlayerInfo } from '@/models/match'

export type TeamSide = 'A' | 'B'

interface SetResult {
  setNumber: number
  scoreA: number
  scoreB: number
  winner: TeamSide
  pointLog: TeamSide[]
  teamAPlayers?: SetPlayerInfo
  teamBPlayers?: SetPlayerInfo
}

interface ScoringState {
  scoreA: number
  scoreB: number
  currentSet: number
  setsWonA: number
  setsWonB: number
  servingTeam: TeamSide
  isSetComplete: boolean
  isMatchComplete: boolean
  setResults: SetResult[]
  pointHistory: { team: TeamSide }[]
  setCaps: number[]
  /** 当前局的逐球得分记录 */
  currentSetPointLog: TeamSide[]
}

export interface SerializableScoringState {
  scoreA: number
  scoreB: number
  currentSet: number
  setsWonA: number
  setsWonB: number
  servingTeam: TeamSide
  isSetComplete: boolean
  isMatchComplete: boolean
  setResults: SetResult[]
  pointHistory: { team: TeamSide }[]
  setCaps: number[]
  currentSetPointLog: TeamSide[]
}

export class ScoringEngine {
  state: ScoringState

  constructor(initialServingTeam: TeamSide, setCaps?: number[]) {
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
        DEFAULT_CAP_REGULAR,
        DEFAULT_CAP_REGULAR,
        DEFAULT_CAP_DECIDING
      ],
      currentSetPointLog: []
    }
  }

  get scoreA() { return this.state.scoreA }
  get scoreB() { return this.state.scoreB }
  get currentSet() { return this.state.currentSet }
  get setsWonA() { return this.state.setsWonA }
  get setsWonB() { return this.state.setsWonB }
  get servingTeam() { return this.state.servingTeam }
  get isSetComplete() { return this.state.isSetComplete }
  get isMatchComplete() { return this.state.isMatchComplete }
  get canUndo() { return this.state.pointHistory.length > 0 }
  get pointHistory() { return this.state.pointHistory }
  get setResults() { return this.state.setResults }

  /** 得分 */
  scorePoint(team: TeamSide): void {
    if (this.state.isSetComplete || this.state.isMatchComplete) return

    if (team === 'A') this.state.scoreA++
    else this.state.scoreB++

    // 接发球方得分 → 获得发球权
    if (team !== this.state.servingTeam) {
      this.state.servingTeam = team
    }

    this.state.pointHistory.push({ team })
    this.state.currentSetPointLog.push(team)

    if (isSetOver(this.state.scoreA, this.state.scoreB, this.state.currentSet, this.state.setCaps[this.state.currentSet - 1])) {
      this.endSet()
    }
  }

  /** 撤销 */
  undoPoint(): void {
    if (this.state.pointHistory.length === 0) return

    const last = this.state.pointHistory.pop()!

    if (last.team === 'A') this.state.scoreA--
    else this.state.scoreB--

    this.state.currentSetPointLog.pop()

    if (this.state.isSetComplete) {
      this.state.isSetComplete = false
      this.state.isMatchComplete = false
      const lastResult = this.state.setResults.pop()
      if (lastResult) {
        if (lastResult.winner === 'A') this.state.setsWonA--
        else this.state.setsWonB--
      }
    }

    // 恢复发球方：如果撤销的得分方当时获得了发球权，需要恢复为对方
    // 重新从 pointHistory 计算 servingTeam
    this.recalcServingTeam()
  }

  /** 从得分历史重新计算发球方 */
  private recalcServingTeam() {
    if (this.state.pointHistory.length === 0) return
    // 每球得分制：发球方 = 最后一次得分方
    this.state.servingTeam = this.state.pointHistory[this.state.pointHistory.length - 1].team
  }

  private endSet() {
    const winner: TeamSide = this.state.scoreA > this.state.scoreB ? 'A' : 'B'
    if (winner === 'A') this.state.setsWonA++
    else this.state.setsWonB++

    this.state.setResults.push({
      setNumber: this.state.currentSet,
      scoreA: this.state.scoreA,
      scoreB: this.state.scoreB,
      winner,
      pointLog: [...this.state.currentSetPointLog]
    })

    this.state.isSetComplete = true

    if (isMatchOver(this.state.setsWonA, this.state.setsWonB)) {
      this.state.isMatchComplete = true
    }
  }

  /** 进入下一局 */
  nextSet(servingTeam?: TeamSide): void {
    if (!this.state.isSetComplete || this.state.isMatchComplete) return
    this.state.currentSet++
    this.state.scoreA = 0
    this.state.scoreB = 0
    this.state.isSetComplete = false
    this.state.currentSetPointLog = []
    if (servingTeam) {
      this.state.servingTeam = servingTeam
    }
  }

  /** 设置某局封顶分数 */
  setCap(setIndex: number, cap: number): void {
    if (setIndex >= 0 && setIndex < this.state.setCaps.length) {
      this.state.setCaps[setIndex] = cap
    }
  }

  /** 获取某局封顶分数 */
  getCap(setIndex: number): number {
    return this.state.setCaps[setIndex] ?? (setIndex === 2 ? DEFAULT_CAP_DECIDING : DEFAULT_CAP_REGULAR)
  }

  /** 序列化状态 */
  getState(): SerializableScoringState {
    return {
      scoreA: this.state.scoreA,
      scoreB: this.state.scoreB,
      currentSet: this.state.currentSet,
      setsWonA: this.state.setsWonA,
      setsWonB: this.state.setsWonB,
      servingTeam: this.state.servingTeam,
      isSetComplete: this.state.isSetComplete,
      isMatchComplete: this.state.isMatchComplete,
      setResults: this.state.setResults.map(r => ({
        ...r,
        pointLog: [...r.pointLog],
        teamAPlayers: r.teamAPlayers ? { startingPlayers: [...r.teamAPlayers.startingPlayers], subPlayers: [...r.teamAPlayers.subPlayers] } : undefined,
        teamBPlayers: r.teamBPlayers ? { startingPlayers: [...r.teamBPlayers.startingPlayers], subPlayers: [...r.teamBPlayers.subPlayers] } : undefined
      })),
      pointHistory: this.state.pointHistory.map(p => ({ ...p })),
      setCaps: [...this.state.setCaps],
      currentSetPointLog: [...this.state.currentSetPointLog]
    }
  }

  /** 恢复状态 */
  setState(state: SerializableScoringState): void {
    this.state = {
      scoreA: state.scoreA,
      scoreB: state.scoreB,
      currentSet: state.currentSet,
      setsWonA: state.setsWonA,
      setsWonB: state.setsWonB,
      servingTeam: state.servingTeam,
      isSetComplete: state.isSetComplete,
      isMatchComplete: state.isMatchComplete,
      setResults: state.setResults.map(r => ({
        ...r,
        pointLog: [...r.pointLog],
        teamAPlayers: r.teamAPlayers ? { startingPlayers: [...r.teamAPlayers.startingPlayers], subPlayers: [...r.teamAPlayers.subPlayers] } : undefined,
        teamBPlayers: r.teamBPlayers ? { startingPlayers: [...r.teamBPlayers.startingPlayers], subPlayers: [...r.teamBPlayers.subPlayers] } : undefined
      })),
      pointHistory: state.pointHistory.map(p => ({ ...p })),
      setCaps: [...state.setCaps],
      currentSetPointLog: [...state.currentSetPointLog]
    }
  }
}
