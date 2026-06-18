import type { TeamSide } from '@/engine/scoring-engine'
import type { Player, Match } from '@/models/match'
import type { SerializableScoringState } from '@/engine/scoring-engine'
import type { MatchAction } from '@/engine/action-history'

/** 同步事件类型 */
export type SyncEventType =
  | 'STATE_UPDATE'
  | 'START_MATCH'

/** 同步事件 */
export interface SyncEvent {
  _id?: string
  roomId: string
  seq: number
  type: SyncEventType
  payload: Record<string, any>
  deviceId: string
  timestamp: number
}

/** 比赛配置（用于 START_MATCH 事件） */
export interface MatchConfig {
  teamAName: string
  teamBName: string
  teamAPlayers: Player[]
  teamBPlayers: Player[]
  teamAStartingPositions: string[]
  teamBStartingPositions: string[]
  teamABenchPlayers: Player[]
  teamBBenchPlayers: Player[]
  initialServingTeam: TeamSide
  setCaps?: number[]
  totalSets?: number // 室内排球：3或5
  teamAInitialServer?: number // 沙滩排球：队伍A首发发球队员索引
  teamBInitialServer?: number // 沙滩排球：队伍B首发发球队员索引
}

/** 暂停事件信息 */
export interface TimeoutEvent {
  team: TeamSide
  timestamp: number
}

/** 第3局8分换边事件 */
export interface Set3SwapEvent {
  timestamp: number
}

/** 沙滩排球换边事件 */
export interface CourtSwapEvent {
  timestamp: number
}

/** 技术暂停事件 */
export interface TechTimeoutEvent {
  timestamp: number
}

/** 完整状态快照 */
export interface MatchStateSnapshot {
  scoringState: SerializableScoringState
  rotationState: {
    teamA: { positions: string[] }
    teamB: { positions: string[] }
    rotationHistory: Array<{
      team: TeamSide
      beforePositions: string[]
      afterPositions: string[]
    }>
    substitutionHistory: Array<{
      team: TeamSide
      playerOutId: string
      playerInId: string
      positionIndex: number
      setNumber: number
    }>
  }
  match: Match
  courtSwapped: boolean
  set3Swapped: boolean
  timeoutsA: number[]
  timeoutsB: number[]
  subsA: number[]
  subsB: number[]
  teamABench: Player[]
  teamBBench: Player[]
  teamASubIn: Player[]
  teamBSubIn: Player[]
  currentSetStartingA: string[]
  currentSetStartingB: string[]
  lastTimeout: TimeoutEvent | null
  pendingSet3Swap: Set3SwapEvent | null
  actionHistory?: MatchAction[]
  teamAOriginalCaptainId?: string
  teamBOriginalCaptainId?: string
}

/** 房间状态 */
export type RoomStatus = 'waiting' | 'active' | 'completed' | 'abandoned'

/** 房间文档 */
export interface RoomDocument {
  _id: string
  roomCode: string
  status: RoomStatus
  createdAt: number
  updatedAt: number
  lastEventSeq: number
  creatorDeviceId: string
  matchConfig: MatchConfig | null
  stateSnapshot: MatchStateSnapshot | null
  snapshotSeq: number
  connectedDevices: string[]
}

/** 连接文档 */
export interface ConnectionDocument {
  _id: string
  roomId: string
  deviceId: string
  lastHeartbeat: number
  connectedAt: number
}

/** 事件来源 */
export type EventSource = 'local' | 'remote'
