import type { TeamSide } from '@/engine/scoring-engine'

export interface Player {
  id: string
  name: string
  number: string
  isCaptain?: boolean
}

/** 队伍官员 */
export interface TeamOfficial {
  role: 'coach' | 'assistant' | 'trainer'
  name: string
}

/** 换人明细（含换人时比分，用于 FIVB 记分表） */
export interface SubstitutionRecord {
  team: TeamSide
  playerOutId: string
  playerInId: string
  playerInNumber: string
  playerOutNumber: string
  positionIndex: number
  scoreA: number
  scoreB: number
  timestamp: number
}

/** 暂停明细（含暂停时比分） */
export interface TimeoutRecord {
  team: TeamSide
  scoreA: number
  scoreB: number
  timestamp: number
}

/** 自由人替换明细 */
export interface LiberoSwapRecord {
  team: TeamSide
  liberoNumber: string
  replacedPlayerId: string
  scoreA: number
  scoreB: number
  timestamp: number
}

export interface TeamConfig {
  name: string
  players: Player[]
  /** 初始站位顺序，对应1-5号位，存储playerId */
  startingPositions: string[]
  /** 官员（教练等） */
  officials?: TeamOfficial[]
  /** 自由人号码列表 */
  liberos?: string[]
}

export interface SetPlayerInfo {
  /** 首发队员（1-5号位顺序） */
  startingPlayers: Player[]
  /** 替补上场队员 */
  subPlayers: Player[]
}

export interface SetScore {
  scoreA: number
  scoreB: number
  winner: TeamSide
  /** 每球得分记录，如 ['A','B','A','A','B'] 表示第1球A得分、第2球B得分... */
  pointLog: TeamSide[]
  /** A队本局人员信息 */
  teamAPlayers: SetPlayerInfo
  /** B队本局人员信息 */
  teamBPlayers: SetPlayerInfo
  /** 本局开始时间戳 */
  setStartTime?: number
  /** 本局结束时间戳 */
  setEndTime?: number
  /** 本局初始发球方 */
  initialServingTeam?: TeamSide
  /** 本局换人明细 */
  substitutions?: SubstitutionRecord[]
  /** 本局暂停明细 */
  timeouts?: TimeoutRecord[]
  /** 本局自由人替换明细 */
  liberoSwaps?: LiberoSwapRecord[]
}

export interface Match {
  id: string
  teamA: TeamConfig
  teamB: TeamConfig
  setScores: SetScore[]
  setsWonA: number
  setsWonB: number
  winner: TeamSide | null
  status: 'scheduled' | 'live' | 'completed'
  initialServingTeam: TeamSide
  startTime: number
  endTime?: number
  /** A队替补上场的队员 */
  teamASubPlayers: Player[]
  /** B队替补上场的队员 */
  teamBSubPlayers: Player[]
  /** 赛制（3局2胜或5局3胜） */
  totalSets?: 3 | 5
  /** A队自由人号码 */
  teamALiberos?: string[]
  /** B队自由人号码 */
  teamBLiberos?: string[]
}

export function createPlayer(name: string, number: string, isCaptain: boolean = false): Player {
  return {
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    number,
    isCaptain
  }
}

export function createMatch(teamA: TeamConfig, teamB: TeamConfig, initialServingTeam: TeamSide): Match {
  return {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    teamA,
    teamB,
    setScores: [],
    setsWonA: 0,
    setsWonB: 0,
    winner: null,
    status: 'scheduled',
    initialServingTeam,
    startTime: Date.now(),
    teamASubPlayers: [],
    teamBSubPlayers: []
  }
}
