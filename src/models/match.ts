import type { TeamSide } from '@/engine/scoring-engine'

export interface Player {
  id: string
  name: string
  number: string
  isCaptain?: boolean
}

export interface TeamConfig {
  name: string
  players: Player[]
  /** 初始站位顺序，对应1-5号位，存储playerId */
  startingPositions: string[]
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
