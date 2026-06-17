import { PLAYER_COUNT, ROTATION_ORDER } from './indoor-game-rules'

export type TeamSide = 'A' | 'B'

export interface Player {
  id: string
  name: string
  number: string
}

export interface RotationState {
  /** positions[0]=1号位队员, positions[1]=2号位队员, ..., positions[5]=6号位队员 */
  positions: string[]  // 长度6，存储playerId
}

export interface Substitution {
  team: TeamSide
  playerOutId: string
  playerInId: string
  positionIndex: number  // 被替换队员所在的位置索引(0-5)
  setNumber: number
}

export interface RotationRecord {
  team: TeamSide
  beforePositions: string[]
  afterPositions: string[]
}

export class IndoorRotationEngine {
  private teamA: RotationState
  private teamB: RotationState
  private rotationHistory: RotationRecord[] = []
  private substitutionHistory: Substitution[] = []

  constructor(teamAPlayers: string[], teamBPlayers: string[]) {
    // 初始站位：按输入顺序对应1-6号位
    this.teamA = { positions: [...teamAPlayers] }
    this.teamB = { positions: [...teamBPlayers] }
  }

  /** 室内排球顺时针轮转：2→1→6→5→4→3→2
   *  即：原2号位→1号位(发球), 原1号位→6号位, 原6号位→5号位, 原5号位→4号位, 原4号位→3号位, 原3号位→2号位
   *  数组索引映射：positions[0]=1号位, positions[1]=2号位, ..., positions[5]=6号位
   *  轮转后：newPos[0] = oldPos[1] (2号位→1号位)
   *         newPos[1] = oldPos[2] (3号位→2号位)
   *         newPos[2] = oldPos[3] (4号位→3号位)
   *         newPos[3] = oldPos[4] (5号位→4号位)
   *         newPos[4] = oldPos[5] (6号位→5号位)
   *         newPos[5] = oldPos[0] (1号位→6号位)
   */
  rotate(team: TeamSide): void {
    const state = team === 'A' ? this.teamA : this.teamB
    const before = [...state.positions]

    const newPos: string[] = new Array(PLAYER_COUNT)
    // 按照轮转顺序映射
    newPos[0] = before[1]  // 2号位→1号位
    newPos[1] = before[2]  // 3号位→2号位
    newPos[2] = before[3]  // 4号位→3号位
    newPos[3] = before[4]  // 5号位→4号位
    newPos[4] = before[5]  // 6号位→5号位
    newPos[5] = before[0]  // 1号位→6号位

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

  /** 获取发球队员（1号位 = 索引0） */
  getServer(team: TeamSide): string {
    const state = team === 'A' ? this.teamA : this.teamB
    return state.positions[0]
  }

  /** 获取前排队员（2、3、4号位 = 索引1、2、3） */
  getFrontRow(team: TeamSide): string[] {
    const state = team === 'A' ? this.teamA : this.teamB
    return [state.positions[1], state.positions[2], state.positions[3]]
  }

  /** 获取后排队员（5、6、1号位 = 索引4、5、0） */
  getBackRow(team: TeamSide): string[] {
    const state = team === 'A' ? this.teamA : this.teamB
    return [state.positions[4], state.positions[5], state.positions[0]]
  }

  /** 预览下次轮转后的站位 */
  previewRotation(team: TeamSide): string[] {
    const current = this.getRotation(team)
    const preview: string[] = new Array(PLAYER_COUNT)
    preview[0] = current[1]
    preview[1] = current[2]
    preview[2] = current[3]
    preview[3] = current[4]
    preview[4] = current[5]
    preview[5] = current[0]
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

  /** 设置某队站位（用于自由人替换） */
  setPositions(team: TeamSide, playerIds: string[]): void {
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