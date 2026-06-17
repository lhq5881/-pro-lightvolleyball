import type { Match } from '@/models/match'

/** 生成分享文案 */
export function generateShareText(match: Match): string {
  const teamAName = match.teamA.name
  const teamBName = match.teamB.name

  if (match.status === 'live') {
    return `【比赛进行中】${teamAName} vs ${teamBName}`
  }

  const setScores = match.setScores.map((s, i) => `第${i + 1}局 ${s.scoreA}:${s.scoreB}`).join('，')
  const winner = match.winner === 'A' ? teamAName : teamBName
  return `${winner} 获胜！${teamAName} vs ${teamBName}，${setScores}`
}

/** 生成分享配置 */
export function generateShareConfig(match: Match) {
  return {
    title: generateShareText(match),
    path: '/pages/index/index'
  }
}
