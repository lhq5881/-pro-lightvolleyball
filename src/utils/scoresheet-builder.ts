/**
 * FIVB 记分表数据组装
 * 从 Match 对象转换出 Canvas 绘制所需的 ScoresheetData
 */
import type { Match, SetScore, Player, TeamSide, TeamOfficial, SubstitutionRecord, TimeoutRecord } from '@/models/match'

/** 单个发球轮次（一行） */
export interface ServiceRoundRow {
  /** 轮转位置 1-6 */
  position: number
  /** 发球队员号码 */
  serverNumber: string
  /** 该轮次连续得的分 */
  points: number[]
  /** 每得一分后的累计比分（划线用） */
  runningScore: { a: number; b: number }[]
}

/** 单局记分表数据 */
export interface SetSheetData {
  setNumber: number
  isDecidingSet: boolean
  teamAStarting: { position: number; number: string; isCaptain: boolean }[]
  teamBStarting: { position: number; number: string; isCaptain: boolean }[]
  teamAServiceRounds: ServiceRoundRow[]
  teamBServiceRounds: ServiceRoundRow[]
  finalScoreA: number
  finalScoreB: number
  winner: TeamSide
  substitutionsA: { playerInNumber: string; playerOutNumber: string; scoreA: number; scoreB: number }[]
  substitutionsB: { playerInNumber: string; playerOutNumber: string; scoreA: number; scoreB: number }[]
  timeoutsA: { scoreA: number; scoreB: number }[]
  timeoutsB: { scoreA: number; scoreB: number }[]
  setStartTime: number | null
  setEndTime: number | null
  /** 决胜局是否换边 */
  decidingSetSwapped: boolean
  /** 换边时A队比分 */
  swapScoreA?: number
  /** 换边时B队比分 */
  swapScoreB?: number
  /** 换边后A队发球轮次（决胜局严格分列用） */
  teamAServiceRoundsAfterSwap?: ServiceRoundRow[]
  /** 换边后B队发球轮次 */
  teamBServiceRoundsAfterSwap?: ServiceRoundRow[]
}

/** 全场记分表数据 */
export interface ScoresheetData {
  matchTitle: string
  teamAName: string
  teamBName: string
  teamAPlayers: Player[]
  teamBPlayers: Player[]
  teamACaptain?: Player
  teamBCaptain?: Player
  teamALiberos: string[]
  teamBLiberos: string[]
  teamAOfficials: TeamOfficial[]
  teamBOfficials: TeamOfficial[]
  sets: SetSheetData[]
  totalSets: 3 | 5
  setsWonA: number
  setsWonB: number
  winner: TeamSide | null
  matchStartTime: number
  matchEndTime: number
}

/**
 * 从 pointLog 推导某队的发球轮次
 * @param pointLog 本局逐球得分顺序
 * @param team 目标队伍 A/B
 * @param initialServer 本局初始发球方
 * @param startingPlayers 本局首发（1-6号位顺序，索引0=1号位发球位）
 * @param swapPoint 决胜局换边比分（可选，非决胜局为 undefined）
 * @returns { beforeSwap, afterSwap } 换边前/后的发球轮次
 */
export function deriveServiceRounds(
  pointLog: TeamSide[],
  team: TeamSide,
  initialServer: TeamSide,
  startingPlayers: Player[],
  swapPoint?: { a: number; b: number }
): { beforeSwap: ServiceRoundRow[]; afterSwap: ServiceRoundRow[] } {
  const beforeSwap: ServiceRoundRow[] = []
  const afterSwap: ServiceRoundRow[] = []

  let server = initialServer
  let scoreA = 0
  let scoreB = 0
  // 该队当前轮转位置索引（0=1号位发球位）
  let rotIndex = 0
  // 当前轮次缓冲
  let curRow: ServiceRoundRow | null = null
  let teamHasServe = (server === team)
  let swapped = false

  // 若本队是初始发球方，初始化第一个发球轮次
  if (teamHasServe) {
    curRow = {
      position: 1,
      serverNumber: startingPlayers[0]?.number ?? '',
      points: [],
      runningScore: []
    }
    beforeSwap.push(curRow)
  }

  for (let i = 0; i < pointLog.length; i++) {
    const scorer = pointLog[i]
    if (scorer === 'A') scoreA++; else scoreB++

    // 检查是否到达换边分
    if (swapPoint && !swapped && (scoreA >= swapPoint.a || scoreB >= swapPoint.b) && (scoreA + scoreB >= swapPoint.a + swapPoint.b)) {
      swapped = true
      // 结束当前轮次
      curRow = null
      teamHasServe = (server === team)
    }

    const targetArr = swapped ? afterSwap : beforeSwap

    if (scorer === team) {
      if (teamHasServe) {
        // 本队发球并得分，记入当前轮次
        if (!curRow || (swapped && targetArr === afterSwap && !afterSwap.includes(curRow))) {
          // 换边后需要新建行
          curRow = {
            position: rotIndex + 1,
            serverNumber: startingPlayers[rotIndex]?.number ?? '',
            points: [],
            runningScore: []
          }
          targetArr.push(curRow)
        }
        curRow.points.push(1)
        curRow.runningScore.push({ a: scoreA, b: scoreB })
      } else {
        // 本队接发球得分 → 获得发球权 → 轮转 → 开启新轮次
        rotIndex = (rotIndex + 1) % 6
        server = team
        teamHasServe = true
        curRow = {
          position: rotIndex + 1,
          serverNumber: startingPlayers[rotIndex]?.number ?? '',
          points: [],
          runningScore: []
        }
        curRow.points.push(1)
        curRow.runningScore.push({ a: scoreA, b: scoreB })
        targetArr.push(curRow)
      }
    } else {
      // 对方得分
      if (teamHasServe) {
        // 本队失发球权，当前轮次结束
        teamHasServe = false
        server = scorer
        curRow = null
      }
    }
  }

  return { beforeSwap, afterSwap }
}

/**
 * 从 Match 组装记分表数据
 */
export function buildScoresheetData(match: Match): ScoresheetData {
  const totalSets = match.totalSets ?? (match.setScores.length >= 4 ? 5 : 3) as 3 | 5
  const decidingSetNumber = totalSets

  const sets: SetSheetData[] = match.setScores.map((setScore: SetScore, idx: number) => {
    const isDecidingSet = (idx + 1) === decidingSetNumber
    const initialServer = setScore.initialServingTeam ?? (idx === 0 ? match.initialServingTeam : 'A')

    // 首发阵容
    const teamAStarting = (setScore.teamAPlayers?.startingPlayers ?? []).map((p, i) => ({
      position: i + 1,
      number: p.number || '?',
      isCaptain: p.isCaptain || false
    }))
    const teamBStarting = (setScore.teamBPlayers?.startingPlayers ?? []).map((p, i) => ({
      position: i + 1,
      number: p.number || '?',
      isCaptain: p.isCaptain || false
    }))

    // 发球轮次推导
    const startingA = setScore.teamAPlayers?.startingPlayers ?? []
    const startingB = setScore.teamBPlayers?.startingPlayers ?? []

    // 决胜局换边比分（8分换边：任一队先到8分）
    let swapPoint: { a: number; b: number } | undefined
    if (isDecidingSet) {
      // 从 pointLog 推导换边时的比分
      let sa = 0, sb = 0
      for (const t of setScore.pointLog) {
        if (t === 'A') sa++; else sb++
        if (sa >= 8 || sb >= 8) {
          swapPoint = { a: sa, b: sb }
          break
        }
      }
    }

    const teamARounds = deriveServiceRounds(setScore.pointLog, 'A', initialServer, startingA, swapPoint)
    const teamBRounds = deriveServiceRounds(setScore.pointLog, 'B', initialServer, startingB, swapPoint)

    // 换人明细
    const subsA = (setScore.substitutions ?? []).filter(s => s.team === 'A').map(s => ({
      playerInNumber: s.playerInNumber,
      playerOutNumber: s.playerOutNumber,
      scoreA: s.scoreA,
      scoreB: s.scoreB
    }))
    const subsB = (setScore.substitutions ?? []).filter(s => s.team === 'B').map(s => ({
      playerInNumber: s.playerInNumber,
      playerOutNumber: s.playerOutNumber,
      scoreA: s.scoreA,
      scoreB: s.scoreB
    }))

    // 暂停明细
    const timeoutsA = (setScore.timeouts ?? []).filter(t => t.team === 'A').map(t => ({
      scoreA: t.scoreA,
      scoreB: t.scoreB
    }))
    const timeoutsB = (setScore.timeouts ?? []).filter(t => t.team === 'B').map(t => ({
      scoreA: t.scoreA,
      scoreB: t.scoreB
    }))

    return {
      setNumber: idx + 1,
      isDecidingSet,
      teamAStarting,
      teamBStarting,
      teamAServiceRounds: teamARounds.beforeSwap,
      teamBServiceRounds: teamBRounds.beforeSwap,
      finalScoreA: setScore.scoreA,
      finalScoreB: setScore.scoreB,
      winner: setScore.winner,
      substitutionsA: subsA,
      substitutionsB: subsB,
      timeoutsA,
      timeoutsB,
      setStartTime: setScore.setStartTime ?? null,
      setEndTime: setScore.setEndTime ?? null,
      decidingSetSwapped: !!swapPoint,
      swapScoreA: swapPoint?.a,
      swapScoreB: swapPoint?.b,
      teamAServiceRoundsAfterSwap: teamARounds.afterSwap.length > 0 ? teamARounds.afterSwap : undefined,
      teamBServiceRoundsAfterSwap: teamBRounds.afterSwap.length > 0 ? teamBRounds.afterSwap : undefined
    }
  })

  const teamACaptain = match.teamA.players.find(p => p.isCaptain)
  const teamBCaptain = match.teamB.players.find(p => p.isCaptain)

  return {
    matchTitle: `${match.teamA.name} vs ${match.teamB.name}`,
    teamAName: match.teamA.name,
    teamBName: match.teamB.name,
    teamAPlayers: match.teamA.players,
    teamBPlayers: match.teamB.players,
    teamACaptain,
    teamBCaptain,
    teamALiberos: match.teamALiberos ?? match.teamA.liberos ?? [],
    teamBLiberos: match.teamBLiberos ?? match.teamB.liberos ?? [],
    teamAOfficials: match.teamA.officials ?? [],
    teamBOfficials: match.teamB.officials ?? [],
    sets,
    totalSets,
    setsWonA: match.setsWonA,
    setsWonB: match.setsWonB,
    winner: match.winner,
    matchStartTime: match.startTime,
    matchEndTime: match.endTime ?? Date.now()
  }
}

/** 计算记分表 Canvas 总高度 */
export function calcScoresheetHeight(data: ScoresheetData): number {
  const headerH = 280 // 表头：标题+球员名单+官员
  const setBlockH = 560 // 每局方块
  const summaryH = 240 // 汇总区
  const padding = 40
  return headerH + data.sets.length * setBlockH + summaryH + padding
}
