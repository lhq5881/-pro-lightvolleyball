import {
  isSetOver, isMatchOver, getTargetPoints,
  TOTAL_SETS, PLAYER_COUNT, TIMEOUTS_PER_SET,
  getSwapInterval
} from './beach-game-rules'

export type TeamSide = 'A' | 'B'

interface SetResult {
  setNumber: number
  scoreA: number
  scoreB: number
  winner: TeamSide
  pointLog: TeamSide[]
}

interface ScoringState {
  scoreA: number
  scoreB: number
  currentSet: number
  setsWonA: number
  setsWonB: number
  servingTeam: TeamSide
  /** A队当前发球队员索引（0或1） */
  serverIndexA: number
  /** B队当前发球队员索引（0或1） */
  serverIndexB: number
  /** A队本局首发发球队员索引 */
  initialServerIndexA: number
  /** B队本局首发发球队员索引 */
  initialServerIndexB: number
  /** A队本轮次已发球次数（用于判断是否轮回到首发） */
  serverCountA: number
  /** B队本轮次已发球次数 */
  serverCountB: number
  isSetComplete: boolean
  isMatchComplete: boolean
  setResults: SetResult[]
  pointHistory: { team: TeamSide }[]
  /** 当前局的逐球得分记录 */
  currentSetPointLog: TeamSide[]
  /** 当前局上次换边时的总得分 */
  lastSwapPoints: number
}

export interface SerializableScoringState {
  scoreA: number
  scoreB: number
  currentSet: number
  setsWonA: number
  setsWonB: number
  servingTeam: TeamSide
  serverIndexA: number
  serverIndexB: number
  initialServerIndexA: number
  initialServerIndexB: number
  serverCountA: number
  serverCountB: number
  isSetComplete: boolean
  isMatchComplete: boolean
  setResults: SetResult[]
  pointHistory: { team: TeamSide }[]
  currentSetPointLog: TeamSide[]
  lastSwapPoints: number
}

export class BeachScoringEngine {
  state: ScoringState

  constructor(
    initialServingTeam: TeamSide,
    initialServerIndex: number = 0,
    teamAInitialServer: number = 0,
    teamBInitialServer: number = 0
  ) {
    this.state = {
      scoreA: 0,
      scoreB: 0,
      currentSet: 1,
      setsWonA: 0,
      setsWonB: 0,
      servingTeam: initialServingTeam,
      serverIndexA: initialServingTeam === 'A' ? initialServerIndex : teamAInitialServer,
      serverIndexB: initialServingTeam === 'B' ? initialServerIndex : teamBInitialServer,
      initialServerIndexA: teamAInitialServer,
      initialServerIndexB: teamBInitialServer,
      serverCountA: initialServingTeam === 'A' ? 1 : 0,
      serverCountB: initialServingTeam === 'B' ? 1 : 0,
      isSetComplete: false,
      isMatchComplete: false,
      setResults: [],
      pointHistory: [],
      currentSetPointLog: [],
      lastSwapPoints: 0
    }
  }

  get scoreA() { return this.state.scoreA }
  get scoreB() { return this.state.scoreB }
  get currentSet() { return this.state.currentSet }
  get setsWonA() { return this.state.setsWonA }
  get setsWonB() { return this.state.setsWonB }
  get servingTeam() { return this.state.servingTeam }
  get serverIndexA() { return this.state.serverIndexA }
  get serverIndexB() { return this.state.serverIndexB }
  get isSetComplete() { return this.state.isSetComplete }
  get isMatchComplete() { return this.state.isMatchComplete }
  get canUndo() { return this.state.pointHistory.length > 0 }
  get pointHistory() { return this.state.pointHistory }
  get setResults() { return this.state.setResults }
  get lastSwapPoints() { return this.state.lastSwapPoints }

  /** 得分 */
  scorePoint(team: TeamSide): void {
    if (this.state.isSetComplete || this.state.isMatchComplete) return

    const wasServing = this.state.servingTeam

    if (team === 'A') this.state.scoreA++
    else this.state.scoreB++

    // 沙滩排球：接发球方得分时获得发球权
    // 换发球时，按照首发顺序：如果本轮次另一个队员还没发过球，则换人；否则回到首发队员
    if (team !== wasServing) {
      this.state.servingTeam = team
      if (team === 'A') {
        // A队获得发球权
        if (this.state.serverCountA === 0) {
          // 本轮次A队首次发球，使用首发队员
          this.state.serverIndexA = this.state.initialServerIndexA
        } else if (this.state.serverCountA === 1) {
          // A队已经有一人发过球，换另一人
          this.state.serverIndexA = (this.state.initialServerIndexA + 1) % 2
        } else {
          // A队两人都已发过，回到首发队员
          this.state.serverIndexA = this.state.initialServerIndexA
          this.state.serverCountA = 0
        }
        this.state.serverCountA++
      } else {
        // B队获得发球权
        if (this.state.serverCountB === 0) {
          this.state.serverIndexB = this.state.initialServerIndexB
        } else if (this.state.serverCountB === 1) {
          this.state.serverIndexB = (this.state.initialServerIndexB + 1) % 2
        } else {
          this.state.serverIndexB = this.state.initialServerIndexB
          this.state.serverCountB = 0
        }
        this.state.serverCountB++
      }
    }

    this.state.pointHistory.push({ team })
    this.state.currentSetPointLog.push(team)

    if (isSetOver(this.state.scoreA, this.state.scoreB, this.state.currentSet)) {
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

    // 简化处理：撤销后重新计算发球状态
    this.recalcServingState()
  }

  /** 从得分历史重新计算发球状态 */
  private recalcServingState() {
    if (this.state.pointHistory.length === 0) {
      this.state.servingTeam = 'A'
      this.state.serverIndexA = this.state.initialServerIndexA
      this.state.serverIndexB = this.state.initialServerIndexB
      this.state.serverCountA = 0
      this.state.serverCountB = 0
      return
    }

    // 重新计算发球方和发球队员
    let currentServer: TeamSide = this.state.servingTeam
    let serverCountA = 0
    let serverCountB = 0
    let serverIndexA = this.state.initialServerIndexA
    let serverIndexB = this.state.initialServerIndexB

    // 从历史记录推算当前发球状态
    let prevTeam: TeamSide | null = null
    for (const point of this.state.pointHistory) {
      if (prevTeam !== null && point.team !== prevTeam) {
        // 换发球
        currentServer = point.team
        if (point.team === 'A') {
          if (serverCountA === 0) {
            serverIndexA = this.state.initialServerIndexA
          } else if (serverCountA === 1) {
            serverIndexA = (this.state.initialServerIndexA + 1) % 2
          } else {
            serverIndexA = this.state.initialServerIndexA
            serverCountA = 0
          }
          serverCountA++
        } else {
          if (serverCountB === 0) {
            serverIndexB = this.state.initialServerIndexB
          } else if (serverCountB === 1) {
            serverIndexB = (this.state.initialServerIndexB + 1) % 2
          } else {
            serverIndexB = this.state.initialServerIndexB
            serverCountB = 0
          }
          serverCountB++
        }
      } else if (prevTeam === null) {
        // 第一分
        currentServer = point.team
        if (point.team === 'A') {
          serverIndexA = this.state.initialServerIndexA
          serverCountA = 1
        } else {
          serverIndexB = this.state.initialServerIndexB
          serverCountB = 1
        }
      }
      prevTeam = point.team
    }

    this.state.servingTeam = currentServer
    this.state.serverIndexA = serverIndexA
    this.state.serverIndexB = serverIndexB
    this.state.serverCountA = serverCountA
    this.state.serverCountB = serverCountB
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
  nextSet(servingTeam?: TeamSide, serverIndex?: number, teamAServer?: number, teamBServer?: number): void {
    if (!this.state.isSetComplete || this.state.isMatchComplete) return
    this.state.currentSet++
    this.state.scoreA = 0
    this.state.scoreB = 0
    this.state.isSetComplete = false
    this.state.currentSetPointLog = []
    this.state.lastSwapPoints = 0
    this.state.serverCountA = 0
    this.state.serverCountB = 0

    // 设置各队首发发球队员
    if (teamAServer !== undefined) {
      this.state.initialServerIndexA = teamAServer
    }
    if (teamBServer !== undefined) {
      this.state.initialServerIndexB = teamBServer
    }

    if (servingTeam) {
      this.state.servingTeam = servingTeam
      if (serverIndex !== undefined) {
        if (servingTeam === 'A') {
          this.state.serverIndexA = serverIndex
          this.state.initialServerIndexA = serverIndex
        } else {
          this.state.serverIndexB = serverIndex
          this.state.initialServerIndexB = serverIndex
        }
      }
      // 标记先发球队已发球
      if (servingTeam === 'A') {
        this.state.serverCountA = 1
      } else {
        this.state.serverCountB = 1
      }
    }
  }

  /** 确认换边 */
  confirmCourtSwap(): void {
    const totalPoints = this.state.scoreA + this.state.scoreB
    this.state.lastSwapPoints = totalPoints
  }

  /** 获取当前发球队员索引 */
  getCurrentServerIndex(team: TeamSide): number {
    return team === 'A' ? this.state.serverIndexA : this.state.serverIndexB
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
      serverIndexA: this.state.serverIndexA,
      serverIndexB: this.state.serverIndexB,
      initialServerIndexA: this.state.initialServerIndexA,
      initialServerIndexB: this.state.initialServerIndexB,
      serverCountA: this.state.serverCountA,
      serverCountB: this.state.serverCountB,
      isSetComplete: this.state.isSetComplete,
      isMatchComplete: this.state.isMatchComplete,
      setResults: this.state.setResults.map(r => ({
        ...r,
        pointLog: [...r.pointLog]
      })),
      pointHistory: this.state.pointHistory.map(p => ({ ...p })),
      currentSetPointLog: [...this.state.currentSetPointLog],
      lastSwapPoints: this.state.lastSwapPoints
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
      serverIndexA: state.serverIndexA,
      serverIndexB: state.serverIndexB,
      initialServerIndexA: state.initialServerIndexA,
      initialServerIndexB: state.initialServerIndexB,
      serverCountA: state.serverCountA,
      serverCountB: state.serverCountB,
      isSetComplete: state.isSetComplete,
      isMatchComplete: state.isMatchComplete,
      setResults: state.setResults.map(r => ({
        ...r,
        pointLog: [...r.pointLog]
      })),
      pointHistory: state.pointHistory.map(p => ({ ...p })),
      currentSetPointLog: [...state.currentSetPointLog],
      lastSwapPoints: state.lastSwapPoints
    }
  }
}