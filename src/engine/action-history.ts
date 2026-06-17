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
}

export interface LiberoSwapAction {
  type: 'libero_swap'
  team: TeamSide
  liberoNumber: string
  previousPositions: string[]
  previousLiberoReplacements: Record<string, string>
  captainStateBefore: string[]
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
