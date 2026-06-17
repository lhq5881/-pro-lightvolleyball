import { isSetOver, getTargetPoints, needsDecidingSetSwap, PLAYER_COUNT, ROTATION_ORDER } from './indoor-game-rules'
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
  totalSets: number // 总局数：3或5
  isSetComplete: boolean
  isMatchComplete: boolean
  setResults: SetResult[]
  pointHistory: { team: TeamSide }[]
  /** 当前局的逐球得分记录 */
  currentSetPointLog: TeamSide[]
  /** 决胜局是否已换边 */
  set5Swapped: boolean
}

export interface SerializableScoringState {
  scoreA: number
  scoreB: number
  currentSet: number
  setsWonA: number
  setsWonB: number
  servingTeam: TeamSide
  totalSets: number
  isSetComplete: boolean
  isMatchComplete: boolean
  setResults: SetResult[]
  pointHistory: { team: TeamSide }[]
  currentSetPointLog: TeamSide[]
  set5Swapped: boolean
}

export class IndoorScoringEngine {
  state: ScoringState

  constructor(initialServingTeam: TeamSide, totalSets: number = 3) {
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
    }
  }

  get scoreA() { return this.state.scoreA }
  get scoreB() { return this.state.scoreB }
  get currentSet() { return this.state.currentSet }
  get setsWonA() { return this.state.setsWonA }
  get setsWonB() { return this.state.setsWonB }
  get servingTeam() { return this.state.servingTeam }
  get totalSets() { return this.state.totalSets }
  get isSetComplete() { return this.state.isSetComplete }
  get isMatchComplete() { return this.state.isMatchComplete }
  get canUndo() { return this.state.pointHistory.length > 0 }
  get pointHistory() { return this.state.pointHistory }
  get setResults() { return this.state.setResults }
  get set5Swapped() { return this.state.set5Swapped }

  /** 得分 */
  scorePoint(team: TeamSide): void {
    if (this.state.isSetComplete || this.state.isMatchComplete) return

    if (team === 'A') this.state.scoreA++
    else this.state.scoreB++

    // 室内排球：接发球方得分时获得发球权并轮转
    // 发球方得分不轮转，继续发球
    if (team !== this.state.servingTeam) {
      this.state.servingTeam = team
    }

    this.state.pointHistory.push({ team })
    this.state.currentSetPointLog.push(team)

    // 检查决胜局8分换边
    if (needsDecidingSetSwap(this.state.currentSet, this.state.scoreA, this.state.scoreB, this.state.set5Swapped, this.state.totalSets)) {
      // 返回需要换边信号（由上层处理）
    }

    if (isSetOver(this.state.scoreA, this.state.scoreB, this.state.currentSet, this.state.totalSets)) {
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

    this.recalcServingTeam()
  }

  /** 从得分历史重新计算发球方 */
  private recalcServingTeam() {
    if (this.state.pointHistory.length === 0) return
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

    // 判断是否比赛结束：需要赢得 totalSets/2 + 1 局
    const setsToWin = Math.floor(this.state.totalSets / 2) + 1
    if (this.state.setsWonA >= setsToWin || this.state.setsWonB >= setsToWin) {
      this.state.isMatchComplete = true
    }
  }

  /** 进入下一局 */
  nextSet(servingTeam?: TeamSide): void {
    if (!this.state.isSetComplete || this.state.isMatchComplete) return

    const previousServingTeam = this.state.servingTeam
    const previousReceiver = this.state.servingTeam === 'A' ? 'B' : 'A'

    this.state.currentSet++
    this.state.scoreA = 0
    this.state.scoreB = 0
    this.state.isSetComplete = false
    this.state.currentSetPointLog = []
    this.state.set5Swapped = false

    // 发球权自动交替：下一局由上一局接发球的队伍先发球
    if (!servingTeam) {
      // 上一局接发球方先发球
      this.state.servingTeam = previousReceiver
      console.log(`[IndoorScoringEngine] nextSet 自动交替: 上一局发球方=${previousServingTeam}, 接发球方=${previousReceiver}, 新发球方=${this.state.servingTeam}`)
    } else {
      this.state.servingTeam = servingTeam
      console.log(`[IndoorScoringEngine] nextSet 指定发球方: ${servingTeam}`)
    }
  }

  /** 确认决胜局换边 */
  confirmSet5Swap(): void {
    this.state.set5Swapped = true
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
      totalSets: this.state.totalSets,
      isSetComplete: this.state.isSetComplete,
      isMatchComplete: this.state.isMatchComplete,
      setResults: this.state.setResults.map(r => ({
        ...r,
        pointLog: [...r.pointLog],
        teamAPlayers: r.teamAPlayers ? { startingPlayers: [...r.teamAPlayers.startingPlayers], subPlayers: [...r.teamAPlayers.subPlayers] } : undefined,
        teamBPlayers: r.teamBPlayers ? { startingPlayers: [...r.teamBPlayers.startingPlayers], subPlayers: [...r.teamBPlayers.subPlayers] } : undefined
      })),
      pointHistory: this.state.pointHistory.map(p => ({ ...p })),
      currentSetPointLog: [...this.state.currentSetPointLog],
      set5Swapped: this.state.set5Swapped
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
      totalSets: state.totalSets,
      isSetComplete: state.isSetComplete,
      isMatchComplete: state.isMatchComplete,
      setResults: state.setResults.map(r => ({
        ...r,
        pointLog: [...r.pointLog],
        teamAPlayers: r.teamAPlayers ? { startingPlayers: [...r.teamAPlayers.startingPlayers], subPlayers: [...r.teamAPlayers.subPlayers] } : undefined,
        teamBPlayers: r.teamBPlayers ? { startingPlayers: [...r.teamBPlayers.startingPlayers], subPlayers: [...r.teamBPlayers.subPlayers] } : undefined
      })),
      pointHistory: state.pointHistory.map(p => ({ ...p })),
      currentSetPointLog: [...state.currentSetPointLog],
      set5Swapped: state.set5Swapped
    }
  }
}