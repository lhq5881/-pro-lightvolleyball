import { PLAYER_COUNT } from './game-rules'

export type TeamSide = 'A' | 'B'

export interface Player {
  id: string
  name: string
  number: string
}

export interface RotationState {
  /** positions[0]=1号位队员, positions[1]=2号位队员, ..., positions[4]=5号位队员 */
  positions: string[]  // 长度5，存储playerId
}

export interface Substitution {
  team: TeamSide
  playerOutId: string
  playerInId: string
  positionIndex: number  // 被替换队员所在的位置索引(0-4)
  setNumber: number
}

export interface RotationRecord {
  team: TeamSide
  beforePositions: string[]
  afterPositions: string[]
}

export class RotationEngine {
  private teamA: RotationState
  private teamB: RotationState
  private rotationHistory: RotationRecord[] = []
  private substitutionHistory: Substitution[] = []

  constructor(teamAPlayers: string[], teamBPlayers: string[]) {
    // 初始站位：按输入顺序对应1-5号位
    this.teamA = { positions: [...teamAPlayers] }
    this.teamB = { positions: [...teamBPlayers] }
  }

  /** 顺时针轮转：1→5→4→3→2→1
   *  原1号位→5号位, 原2号位→1号位(发球), 原3号位→2号位, 原4号位→3号位, 原5号位→4号位
   *  即 newPos[i] = old[(i+1)%5]
   */
  rotate(team: TeamSide): void {
    const state = team === 'A' ? this.teamA : this.teamB
    const before = [...state.positions]

    const newPos: string[] = new Array(PLAYER_COUNT)
    for (let i = 0; i < PLAYER_COUNT; i++) {
      newPos[i] = before[(i + 1) % PLAYER_COUNT]
    }

    state.positions = newPos

    this.rotationHistory.push({
      team,
      beforePositions: before,
      afterPositions: [...newPos]
    })
  }

  /** 撤销轮转 */
  undoRotation(team: TeamSide): void {
    const last = this.rotationHistory[this.rotationHistory.length - 1]
    if (!last || last.team !== team) return

    const state = team === 'A' ? this.teamA : this.teamB
    state.positions = [...last.beforePositions]
    this.rotationHistory.pop()
  }

  /** 换人：替补进入被替换队员的位置 */
  substitute(team: TeamSide, playerOutId: string, playerInId: string, setNumber: number): boolean {
    const state = team === 'A' ? this.teamA : this.teamB
    const posIndex = state.positions.indexOf(playerOutId)
    if (posIndex === -1) return false

    state.positions[posIndex] = playerInId

    this.substitutionHistory.push({
      team,
      playerOutId,
      playerInId,
      positionIndex: posIndex,
      setNumber
    })

    return true
  }

  /** 撤销换人 */
  undoSubstitution(): void {
    const last = this.substitutionHistory[this.substitutionHistory.length - 1]
    if (!last) return

    const state = last.team === 'A' ? this.teamA : this.teamB
    state.positions[last.positionIndex] = last.playerOutId
    this.substitutionHistory.pop()
  }

  /** 获取当前轮转站位 */
  getRotation(team: TeamSide): string[] {
    const state = team === 'A' ? this.teamA : this.teamB
    return [...state.positions]
  }

  /** 获取发球队员（1号位） */
  getServer(team: TeamSide): string {
    const state = team === 'A' ? this.teamA : this.teamB
    return state.positions[0]
  }

  /** 获取前排队员（2、3、4号位 = 索引1、2、3） */
  getFrontRow(team: TeamSide): string[] {
    const state = team === 'A' ? this.teamA : this.teamB
    return [state.positions[1], state.positions[2], state.positions[3]]
  }

  /** 获取后排队员（5、1号位 = 索引4、0） */
  getBackRow(team: TeamSide): string[] {
    const state = team === 'A' ? this.teamA : this.teamB
    return [state.positions[4], state.positions[0]]
  }

  /** 预览下次轮转后的站位 */
  previewRotation(team: TeamSide): string[] {
    const current = this.getRotation(team)
    const preview: string[] = new Array(PLAYER_COUNT)
    for (let i = 0; i < PLAYER_COUNT; i++) {
      preview[i] = current[(i + 1) % PLAYER_COUNT]
    }
    return preview
  }

  /** 获取某队本局换人次数 */
  getSubCount(team: TeamSide, setNumber: number): number {
    return this.substitutionHistory.filter(s => s.team === team && s.setNumber === setNumber).length
  }

  /** 重置某队站位（局间重新设置首发） */
  resetPositions(team: TeamSide, playerIds: string[]): void {
    const state = team === 'A' ? this.teamA : this.teamB
    state.positions = [...playerIds]
  }

  /** 获取完整状态用于持久化 */
  getState(): { teamA: RotationState; teamB: RotationState; rotationHistory: RotationRecord[]; substitutionHistory: Substitution[] } {
    return {
      teamA: { positions: [...this.teamA.positions] },
      teamB: { positions: [...this.teamB.positions] },
      rotationHistory: this.rotationHistory.map(r => ({ ...r, beforePositions: [...r.beforePositions], afterPositions: [...r.afterPositions] })),
      substitutionHistory: [...this.substitutionHistory]
    }
  }

  /** 恢复状态 */
  setState(state: { teamA: RotationState; teamB: RotationState; rotationHistory: RotationRecord[]; substitutionHistory: Substitution[] }): void {
    this.teamA = { positions: [...state.teamA.positions] }
    this.teamB = { positions: [...state.teamB.positions] }
    this.rotationHistory = state.rotationHistory.map(r => ({ ...r, beforePositions: [...r.beforePositions], afterPositions: [...r.afterPositions] }))
    this.substitutionHistory = [...state.substitutionHistory]
  }
}
