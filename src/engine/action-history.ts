import type { TeamSide } from './scoring-engine'
import type { Player } from '@/models/match'

export type ActionType = 'score' | 'timeout' | 'substitution' | 'libero_swap'

export interface ScoreAction {
  type: 'score'
  team: TeamSide
  /** Indoor only: saved when auto libero rotation happens during score */
  previousPositions?: string[]
  previousLiberoReplacements?: Record<string, string>
  captainStateBefore?: string[]
}

export interface TimeoutAction {
  type: 'timeout'
  team: TeamSide
  setIndex: number
  previousLastTimeout: { team: TeamSide; timestamp: number } | null
  /** 暂停时A队比分 */
  scoreA?: number
  /** 暂停时B队比分 */
  scoreB?: number
  /** 暂停时间戳 */
  timestamp?: number
}

export interface SubstitutionAction {
  type: 'substitution'
  team: TeamSide
  playerOutId: string
  playerInId: string
  playerIn: Player | undefined
  setIndex: number
  captainStateBefore: string[]
  wasPlayerInOnBench: boolean
  wasPlayerInOnTeam: boolean
  /** 换人时A队比分 */
  scoreA?: number
  /** 换人时B队比分 */
  scoreB?: number
  /** 换人时间戳 */
  timestamp?: number
}

export interface LiberoSwapAction {
  type: 'libero_swap'
  team: TeamSide
  liberoNumber: string
  previousPositions: string[]
  previousLiberoReplacements: Record<string, string>
  captainStateBefore: string[]
  /** 自由人替换时A队比分 */
  scoreA?: number
  /** 自由人替换时B队比分 */
  scoreB?: number
  /** 替换时间戳 */
  timestamp?: number
}

export type MatchAction = ScoreAction | TimeoutAction | SubstitutionAction | LiberoSwapAction

/** 获取撤销操作的中文描述 */
export function getUndoDescription(action: MatchAction | undefined): string {
  if (!action) return ''
  switch (action.type) {
    case 'score': return '确定撤销上一次得分？'
    case 'timeout': return '确定撤销上一次暂停？'
    case 'substitution': return '确定撤销上一次换人？'
    case 'libero_swap': return '确定撤销上一次自由人替换？'
  }
}
