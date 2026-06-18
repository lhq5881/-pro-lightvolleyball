/**
 * FIVB 记分表 Canvas 绘制工具
 * 纯函数式绘制，入参 (ctx, data)，自上而下绘制竖版长图
 */
import type { ScoresheetData, SetSheetData, ServiceRoundRow } from './scoresheet-builder'

/** 绘制参数常量 */
export const SHEET = {
  width: 750,
  padding: 20,
  fontSize: { title: 22, header: 16, normal: 12, small: 10, mini: 8 },
  lineHeight: 18,
  cellH: 20,
  cellW: 16,
  color: {
    border: '#333',
    text: '#000',
    teamA: '#1565c0',
    teamB: '#f44336',
    bg: '#fff',
    zebra: '#f5f5f5',
    header: '#e3f2fd',
    win: '#4caf50',
    swap: '#ff9800'
  }
}

type Ctx = CanvasRenderingContext2D

/** 主绘制入口 */
export function drawScoresheet(ctx: Ctx, data: ScoresheetData): void {
  ctx.fillStyle = SHEET.color.bg
  ctx.fillRect(0, 0, SHEET.width, 10000)

  let y = SHEET.padding
  y = drawHeader(ctx, data, y)
  for (const set of data.sets) {
    y = drawSetBlock(ctx, set, data, y)
  }
  y = drawSummary(ctx, data, y)
}

/** 绘制表头：比赛标题 + 两队名单 */
function drawHeader(ctx: Ctx, data: ScoresheetData, startY: number): number {
  let y = startY

  // 比赛标题
  ctx.fillStyle = SHEET.color.text
  ctx.font = `bold ${SHEET.fontSize.title}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('排球比赛记分表', SHEET.width / 2, y + 15)
  y += 35

  // 队名
  ctx.font = `bold ${SHEET.fontSize.header}px sans-serif`
  ctx.fillStyle = SHEET.color.teamA
  ctx.textAlign = 'left'
  ctx.fillText(data.teamAName, SHEET.padding + 10, y + 10)
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'center'
  ctx.fillText('VS', SHEET.width / 2, y + 10)
  ctx.fillStyle = SHEET.color.teamB
  ctx.textAlign = 'right'
  ctx.fillText(data.teamBName, SHEET.width - SHEET.padding - 10, y + 10)
  y += 25

  // 球员名单区域（左右两栏）
  const colWidth = (SHEET.width - SHEET.padding * 2 - 20) / 2
  const leftX = SHEET.padding
  const rightX = SHEET.width / 2 + 10

  // 列标题
  ctx.font = `${SHEET.fontSize.normal}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'left'
  ctx.fillText(`${data.teamAName} 队员`, leftX, y + 10)
  ctx.fillText(`${data.teamBName} 队员`, rightX, y + 10)
  y += 18

  // 球员列表
  const maxPlayers = Math.max(data.teamAPlayers.length, data.teamBPlayers.length)
  const lineH = 14
  for (let i = 0; i < maxPlayers; i++) {
    const pA = data.teamAPlayers[i]
    const pB = data.teamBPlayers[i]
    const yy = y + i * lineH

    if (pA) {
      const capMark = pA.isCaptain ? ' (C)' : ''
      const libMark = data.teamALiberos.includes(pA.number) ? ' (L)' : ''
      ctx.fillStyle = SHEET.color.teamA
      ctx.font = `${SHEET.fontSize.small}px sans-serif`
      ctx.textAlign = 'left'
      ctx.fillText(`${pA.number} ${pA.name}${capMark}${libMark}`, leftX, yy + 7)
    }
    if (pB) {
      const capMark = pB.isCaptain ? ' (C)' : ''
      const libMark = data.teamBLiberos.includes(pB.number) ? ' (L)' : ''
      ctx.fillStyle = SHEET.color.teamB
      ctx.font = `${SHEET.fontSize.small}px sans-serif`
      ctx.textAlign = 'left'
      ctx.fillText(`${pB.number} ${pB.name}${capMark}${libMark}`, rightX, yy + 7)
    }
  }
  y += maxPlayers * lineH + 5

  // 官员信息
  if (data.teamAOfficials.length > 0 || data.teamBOfficials.length > 0) {
    const roleNames: Record<string, string> = { coach: '教练', assistant: '助理', trainer: '队医' }
    ctx.font = `${SHEET.fontSize.small}px sans-serif`
    ctx.fillStyle = SHEET.color.text
    ctx.textAlign = 'left'
    const officialsA = data.teamAOfficials.map(o => `${roleNames[o.role] || o.role}: ${o.name}`).join('  ')
    const officialsB = data.teamBOfficials.map(o => `${roleNames[o.role] || o.role}: ${o.name}`).join('  ')
    if (officialsA) ctx.fillText(officialsA, leftX, y + 7)
    if (officialsB) ctx.fillText(officialsB, rightX, y + 7)
    y += 16
  }

  // 比赛时间
  ctx.font = `${SHEET.fontSize.small}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'center'
  const startDate = new Date(data.matchStartTime)
  const timeStr = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())} ${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`
  ctx.fillText(`比赛时间：${timeStr}`, SHEET.width / 2, y + 7)
  y += 20

  // 分隔线
  drawLine(ctx, SHEET.padding, y, SHEET.width - SHEET.padding, y)
  y += 10

  return y
}

/** 绘制单局方块 */
function drawSetBlock(ctx: Ctx, set: SetSheetData, data: ScoresheetData, startY: number): number {
  let y = startY

  // 局号标题
  ctx.font = `bold ${SHEET.fontSize.header}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'left'
  const setTitle = set.isDecidingSet ? `第${set.setNumber}局（决胜局）` : `第${set.setNumber}局`
  ctx.fillText(setTitle, SHEET.padding, y + 10)

  // 最终比分
  ctx.textAlign = 'right'
  ctx.fillStyle = set.winner === 'A' ? SHEET.color.teamA : SHEET.color.teamB
  ctx.fillText(`${set.finalScoreA} : ${set.finalScoreB}`, SHEET.width - SHEET.padding, y + 10)
  y += 22

  // 首发阵容行
  y = drawStartingLineup(ctx, set, y)

  // 发球轮次区
  y = drawServiceRounds(ctx, set, y)

  // 换人记录
  y = drawSubstitutions(ctx, set, y)

  // 暂停记录
  y = drawTimeouts(ctx, set, y)

  // 局时间
  y = drawSetTimes(ctx, set, y)

  // 分隔线
  drawLine(ctx, SHEET.padding, y, SHEET.width - SHEET.padding, y)
  y += 15

  return y
}

/** 绘制首发阵容 */
function drawStartingLineup(ctx: Ctx, set: SetSheetData, startY: number): number {
  let y = startY

  ctx.font = `${SHEET.fontSize.small}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'left'
  ctx.fillText('首发：', SHEET.padding, y + 7)
  y += 14

  const colWidth = (SHEET.width - SHEET.padding * 2 - 40) / 2
  const leftX = SHEET.padding + 30
  const rightX = SHEET.width / 2 + 20

  // A队首发
  ctx.fillStyle = SHEET.color.teamA
  const aStart = set.teamAStarting.map(p => `${p.position}号位:${p.number}${p.isCaptain ? '(C)' : ''}`).join('  ')
  ctx.fillText(aStart, leftX, y + 7)

  // B队首发
  ctx.fillStyle = SHEET.color.teamB
  const bStart = set.teamBStarting.map(p => `${p.position}号位:${p.number}${p.isCaptain ? '(C)' : ''}`).join('  ')
  ctx.fillText(bStart, rightX, y + 7)
  y += 16

  return y
}

/** 绘制发球轮次区 */
function drawServiceRounds(ctx: Ctx, set: SetSheetData, startY: number): number {
  let y = startY

  ctx.font = `${SHEET.fontSize.small}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'left'
  ctx.fillText('发球轮次得分：', SHEET.padding, y + 7)
  y += 14

  const colWidth = (SHEET.width - SHEET.padding * 2 - 20) / 2
  const leftX = SHEET.padding
  const rightX = SHEET.width / 2 + 10

  // A队发球轮次（左列）
  y = drawTeamServiceRounds(ctx, set.teamAServiceRounds, leftX, y, SHEET.color.teamA, 'A')
  // 换边后A队继续在右列记录（FIVB规范）
  if (set.teamAServiceRoundsAfterSwap && set.teamAServiceRoundsAfterSwap.length > 0) {
    y = drawTeamServiceRounds(ctx, set.teamAServiceRoundsAfterSwap, rightX, y, SHEET.color.teamA, 'A(换边后)')
  }

  // B队发球轮次（右列）
  y = drawTeamServiceRounds(ctx, set.teamBServiceRounds, rightX, y, SHEET.color.teamB, 'B')
  if (set.teamBServiceRoundsAfterSwap && set.teamBServiceRoundsAfterSwap.length > 0) {
    y = drawTeamServiceRounds(ctx, set.teamBServiceRoundsAfterSwap, leftX, y, SHEET.color.teamB, 'B(换边后)')
  }

  // 换边标注
  if (set.decidingSetSwapped) {
    ctx.font = `${SHEET.fontSize.mini}px sans-serif`
    ctx.fillStyle = SHEET.color.swap
    ctx.textAlign = 'center'
    ctx.fillText(`※ ${set.swapScoreA}:${set.swapScoreB} 时换边`, SHEET.width / 2, y + 5)
    y += 10
  }

  return y
}

/** 绘制某队发球轮次行 */
function drawTeamServiceRounds(
  ctx: Ctx,
  rounds: ServiceRoundRow[],
  x: number,
  startY: number,
  color: string,
  label: string
): number {
  let y = startY

  ctx.font = `${SHEET.fontSize.mini}px sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = 'left'
  ctx.fillText(`【${label}】`, x, y + 5)
  y += 8

  for (const round of rounds) {
    const scoreStr = round.runningScore.map(s => `${s.a}:${s.b}`).join('→')
    const roundStr = `${round.position}号位(${round.serverNumber}): ${round.points.length}分 [${scoreStr}]`
    ctx.font = `${SHEET.fontSize.mini}px sans-serif`
    ctx.fillStyle = SHEET.color.text
    ctx.fillText(roundStr, x, y + 5)
    y += 8
  }

  return y
}

/** 绘制换人记录 */
function drawSubstitutions(ctx: Ctx, set: SetSheetData, startY: number): number {
  let y = startY + 4

  ctx.font = `${SHEET.fontSize.small}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'left'
  ctx.fillText('换人：', SHEET.padding, y + 7)
  y += 14

  const leftX = SHEET.padding + 30
  const rightX = SHEET.width / 2 + 20

  // A队换人
  ctx.fillStyle = SHEET.color.teamA
  ctx.font = `${SHEET.fontSize.mini}px sans-serif`
  if (set.substitutionsA.length === 0) {
    ctx.fillText('无', leftX, y + 5)
  } else {
    const subsStr = set.substitutionsA.map(s => `${s.playerOutNumber}→${s.playerInNumber}(${s.scoreA}:${s.scoreB})`).join('  ')
    ctx.fillText(subsStr, leftX, y + 5)
  }

  // B队换人
  ctx.fillStyle = SHEET.color.teamB
  if (set.substitutionsB.length === 0) {
    ctx.fillText('无', rightX, y + 5)
  } else {
    const subsStr = set.substitutionsB.map(s => `${s.playerOutNumber}→${s.playerInNumber}(${s.scoreA}:${s.scoreB})`).join('  ')
    ctx.fillText(subsStr, rightX, y + 5)
  }
  y += 12

  return y
}

/** 绘制暂停记录 */
function drawTimeouts(ctx: Ctx, set: SetSheetData, startY: number): number {
  let y = startY + 4

  ctx.font = `${SHEET.fontSize.small}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'left'
  ctx.fillText('暂停：', SHEET.padding, y + 7)
  y += 14

  const leftX = SHEET.padding + 30
  const rightX = SHEET.width / 2 + 20

  // A队暂停
  ctx.fillStyle = SHEET.color.teamA
  ctx.font = `${SHEET.fontSize.mini}px sans-serif`
  if (set.timeoutsA.length === 0) {
    ctx.fillText('无', leftX, y + 5)
  } else {
    const toStr = set.timeoutsA.map(t => `${t.scoreA}:${t.scoreB}`).join('  ')
    ctx.fillText(toStr, leftX, y + 5)
  }

  // B队暂停
  ctx.fillStyle = SHEET.color.teamB
  if (set.timeoutsB.length === 0) {
    ctx.fillText('无', rightX, y + 5)
  } else {
    const toStr = set.timeoutsB.map(t => `${t.scoreA}:${t.scoreB}`).join('  ')
    ctx.fillText(toStr, rightX, y + 5)
  }
  y += 12

  return y
}

/** 绘制局时间 */
function drawSetTimes(ctx: Ctx, set: SetSheetData, startY: number): number {
  let y = startY + 4

  ctx.font = `${SHEET.fontSize.mini}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'left'

  let timeStr = '时间：'
  if (set.setStartTime) {
    const s = new Date(set.setStartTime)
    timeStr += `${pad(s.getHours())}:${pad(s.getMinutes())}`
  } else {
    timeStr += '--'
  }
  timeStr += ' - '
  if (set.setEndTime) {
    const e = new Date(set.setEndTime)
    timeStr += `${pad(e.getHours())}:${pad(e.getMinutes())}`
    if (set.setStartTime) {
      const dur = Math.round((set.setEndTime - set.setStartTime) / 60000)
      timeStr += ` (${dur}分钟)`
    }
  } else {
    timeStr += '--'
  }
  ctx.fillText(timeStr, SHEET.padding, y + 5)
  y += 12

  return y
}

/** 绘制汇总区 */
function drawSummary(ctx: Ctx, data: ScoresheetData, startY: number): number {
  let y = startY + 5

  // 标题
  ctx.font = `bold ${SHEET.fontSize.header}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'center'
  ctx.fillText('比赛结果汇总', SHEET.width / 2, y + 10)
  y += 22

  // 表头
  const cols = [
    { label: '局', x: SHEET.padding, w: 40 },
    { label: data.teamAName, x: SHEET.padding + 40, w: 80, color: SHEET.color.teamA },
    { label: data.teamBName, x: SHEET.padding + 120, w: 80, color: SHEET.color.teamB },
    { label: '胜方', x: SHEET.padding + 200, w: 50 },
    { label: '换人A', x: SHEET.padding + 250, w: 50 },
    { label: '换人B', x: SHEET.padding + 300, w: 50 },
    { label: '暂停A', x: SHEET.padding + 350, w: 50 },
    { label: '暂停B', x: SHEET.padding + 400, w: 50 },
    { label: '时长', x: SHEET.padding + 450, w: 80 }
  ]

  ctx.font = `${SHEET.fontSize.small}px sans-serif`
  for (const col of cols) {
    ctx.fillStyle = col.color || SHEET.color.text
    ctx.textAlign = 'center'
    ctx.fillText(col.label, col.x + col.w / 2, y + 7)
  }
  y += 14

  // 每局一行
  ctx.font = `${SHEET.fontSize.small}px sans-serif`
  for (let i = 0; i < data.sets.length; i++) {
    const set = data.sets[i]
    const rowY = y + i * 14

    ctx.fillStyle = i % 2 === 0 ? SHEET.color.zebra : SHEET.color.bg
    ctx.fillRect(SHEET.padding, rowY - 3, SHEET.width - SHEET.padding * 2, 14)

    ctx.fillStyle = SHEET.color.text
    ctx.textAlign = 'center'
    ctx.fillText(`${i + 1}`, cols[0].x + cols[0].w / 2, rowY + 7)
    ctx.fillText(`${set.finalScoreA}`, cols[1].x + cols[1].w / 2, rowY + 7)
    ctx.fillText(`${set.finalScoreB}`, cols[2].x + cols[2].w / 2, rowY + 7)
    ctx.fillStyle = set.winner === 'A' ? SHEET.color.teamA : SHEET.color.teamB
    ctx.fillText(set.winner, cols[3].x + cols[3].w / 2, rowY + 7)
    ctx.fillStyle = SHEET.color.text
    ctx.fillText(`${set.substitutionsA.length}`, cols[4].x + cols[4].w / 2, rowY + 7)
    ctx.fillText(`${set.substitutionsB.length}`, cols[5].x + cols[5].w / 2, rowY + 7)
    ctx.fillText(`${set.timeoutsA.length}`, cols[6].x + cols[6].w / 2, rowY + 7)
    ctx.fillText(`${set.timeoutsB.length}`, cols[7].x + cols[7].w / 2, rowY + 7)

    let durStr = '--'
    if (set.setStartTime && set.setEndTime) {
      durStr = `${Math.round((set.setEndTime - set.setStartTime) / 60000)}分`
    }
    ctx.fillText(durStr, cols[8].x + cols[8].w / 2, rowY + 7)
  }
  y += data.sets.length * 14 + 5

  // 合计行
  const totalDur = data.sets.reduce((sum, s) => {
    if (s.setStartTime && s.setEndTime) return sum + (s.setEndTime - s.setStartTime)
    return sum
  }, 0)
  const totalSubsA = data.sets.reduce((sum, s) => sum + s.substitutionsA.length, 0)
  const totalSubsB = data.sets.reduce((sum, s) => sum + s.substitutionsB.length, 0)
  const totalToA = data.sets.reduce((sum, s) => sum + s.timeoutsA.length, 0)
  const totalToB = data.sets.reduce((sum, s) => sum + s.timeoutsB.length, 0)

  ctx.font = `bold ${SHEET.fontSize.small}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'center'
  ctx.fillText('合计', cols[0].x + cols[0].w / 2, y + 7)
  ctx.fillText(`${data.sets.reduce((s, set) => s + set.finalScoreA, 0)}`, cols[1].x + cols[1].w / 2, y + 7)
  ctx.fillText(`${data.sets.reduce((s, set) => s + set.finalScoreB, 0)}`, cols[2].x + cols[2].w / 2, y + 7)
  ctx.fillText(`${data.setsWonA}:${data.setsWonB}`, cols[3].x + cols[3].w / 2, y + 7)
  ctx.fillText(`${totalSubsA}`, cols[4].x + cols[4].w / 2, y + 7)
  ctx.fillText(`${totalSubsB}`, cols[5].x + cols[5].w / 2, y + 7)
  ctx.fillText(`${totalToA}`, cols[6].x + cols[6].w / 2, y + 7)
  ctx.fillText(`${totalToB}`, cols[7].x + cols[7].w / 2, y + 7)
  ctx.fillText(`${Math.round(totalDur / 60000)}分`, cols[8].x + cols[8].w / 2, y + 7)
  y += 18

  // 获胜队
  if (data.winner) {
    const winnerName = data.winner === 'A' ? data.teamAName : data.teamBName
    ctx.font = `bold ${SHEET.fontSize.header}px sans-serif`
    ctx.fillStyle = data.winner === 'A' ? SHEET.color.teamA : SHEET.color.teamB
    ctx.textAlign = 'center'
    ctx.fillText(`${winnerName} 获胜  ${data.setsWonA}:${data.setsWonB}`, SHEET.width / 2, y + 12)
    y += 22
  }

  // 比赛总时长
  const matchDur = data.matchEndTime - data.matchStartTime
  ctx.font = `${SHEET.fontSize.small}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'center'
  ctx.fillText(`总时长：${Math.round(matchDur / 60000)}分钟`, SHEET.width / 2, y + 7)
  y += 16

  return y
}

// ===== 基础图元 =====

function drawLine(ctx: Ctx, x1: number, y1: number, x2: number, y2: number): void {
  ctx.strokeStyle = SHEET.color.border
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

function pad(n: number): string {
  return n < 10 ? '0' + n : '' + n
}
