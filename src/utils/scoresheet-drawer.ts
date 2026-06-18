/**
 * FIVB 记分表 Canvas 绘制工具
 * 严格按照 FIVB 国际排联记分表格式绘制
 * 竖版长图，每局一个完整方块
 */
import type { ScoresheetData, SetSheetData, ServiceRoundRow } from './scoresheet-builder'

/** 绘制参数常量 */
export const SHEET = {
  width: 750,
  padding: 15,
  fontSize: {
    title: 18,
    header: 14,
    normal: 11,
    small: 9,
    mini: 7,
    micro: 6
  },
  lineHeight: 14,
  cellH: 16,
  cellW: 14,
  color: {
    border: '#333',
    text: '#000',
    teamA: '#1565c0',
    teamB: '#e53935',
    bg: '#fff',
    zebra: '#f5f5f5',
    header: '#e3f2fd',
    win: '#4caf50',
    swap: '#ff9800',
    slash: '#666'
  }
}

type Ctx = CanvasRenderingContext2D

/** 主绘制入口 */
export function drawScoresheet(ctx: Ctx, data: ScoresheetData): void {
  ctx.fillStyle = SHEET.color.bg
  ctx.fillRect(0, 0, SHEET.width, 20000)

  let y = SHEET.padding
  y = drawHeader(ctx, data, y)
  for (const set of data.sets) {
    y = drawSetBlock(ctx, set, data, y)
  }
  y = drawSummary(ctx, data, y)
}

// ===== 表头 =====

function drawHeader(ctx: Ctx, data: ScoresheetData, startY: number): number {
  let y = startY

  // FIVB 标题
  ctx.font = `bold ${SHEET.fontSize.title}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('国际排联记分表 / FIVB Scoresheet', SHEET.width / 2, y + 10)
  y += 22

  // 比赛信息行
  ctx.font = `${SHEET.fontSize.small}px sans-serif`
  const startDate = new Date(data.matchStartTime)
  const dateStr = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())} ${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`
  ctx.fillText(data.matchTitle + '  ' + dateStr, SHEET.width / 2, y + 6)
  y += 14

  // 两队球员名单（左右分栏）
  const colW = (SHEET.width - SHEET.padding * 2 - 10) / 2
  const leftX = SHEET.padding
  const rightX = SHEET.width / 2 + 5

  // 队名
  ctx.font = `bold ${SHEET.fontSize.header}px sans-serif`
  ctx.fillStyle = SHEET.color.teamA
  ctx.textAlign = 'left'
  ctx.fillText(`A: ${data.teamAName}`, leftX, y + 8)
  ctx.fillStyle = SHEET.color.teamB
  ctx.fillText(`B: ${data.teamBName}`, rightX, y + 8)
  y += 16

  // 球员列表（号码 姓名，队长加C，自由人加L）
  ctx.font = `${SHEET.fontSize.mini}px sans-serif`
  const maxPlayers = Math.max(data.teamAPlayers.length, data.teamBPlayers.length)
  const colCount = 2 // 每队两列
  const playerColW = colW / colCount
  const lineH = 10

  for (let i = 0; i < maxPlayers; i++) {
    const pA = data.teamAPlayers[i]
    const pB = data.teamBPlayers[i]
    const yy = y + Math.floor(i / colCount) * lineH
    const colIdx = i % colCount

    if (pA) {
      const marks = (pA.isCaptain ? 'C' : '') + (data.teamALiberos.includes(pA.number) ? 'L' : '')
      ctx.fillStyle = SHEET.color.teamA
      ctx.textAlign = 'left'
      ctx.fillText(`${pA.number} ${pA.name}${marks ? '(' + marks + ')' : ''}`, leftX + colIdx * playerColW, yy + 5)
    }
    if (pB) {
      const marks = (pB.isCaptain ? 'C' : '') + (data.teamBLiberos.includes(pB.number) ? 'L' : '')
      ctx.fillStyle = SHEET.color.teamB
      ctx.textAlign = 'left'
      ctx.fillText(`${pB.number} ${pB.name}${marks ? '(' + marks + ')' : ''}`, rightX + colIdx * playerColW, yy + 5)
    }
  }
  y += Math.ceil(maxPlayers / colCount) * lineH + 4

  // 官员信息
  if (data.teamAOfficials.length > 0 || data.teamBOfficials.length > 0) {
    const roleMap: Record<string, string> = { coach: '教练', assistant: '助理', trainer: '队医' }
    ctx.font = `${SHEET.fontSize.micro}px sans-serif`
    ctx.textAlign = 'left'
    const strA = data.teamAOfficials.map(o => `${roleMap[o.role] || o.role}:${o.name}`).join(' ')
    const strB = data.teamBOfficials.map(o => `${roleMap[o.role] || o.role}:${o.name}`).join(' ')
    ctx.fillStyle = SHEET.color.teamA
    ctx.fillText(strA, leftX, y + 4)
    ctx.fillStyle = SHEET.color.teamB
    ctx.fillText(strB, rightX, y + 4)
    y += 10
  }

  // 分隔线
  drawHLine(ctx, SHEET.padding, y, SHEET.width - SHEET.padding)
  y += 8

  return y
}

// ===== 单局方块 =====

function drawSetBlock(ctx: Ctx, set: SetSheetData, data: ScoresheetData, startY: number): number {
  let y = startY

  const blockW = SHEET.width - SHEET.padding * 2
  const leftX = SHEET.padding
  const midX = SHEET.width / 2
  const rightX = SHEET.width - SHEET.padding
  const halfW = (blockW - 4) / 2

  // 局标题行
  ctx.font = `bold ${SHEET.fontSize.header}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'left'
  const setTitle = set.isDecidingSet ? `第${set.setNumber}局 (决胜局)` : `第${set.setNumber}局`
  ctx.fillText(setTitle, leftX, y + 7)
  // 初始发球方标记
  ctx.font = `${SHEET.fontSize.small}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  const initServer = set.teamAServiceRounds.length > 0 ? '(A发)' : '(B发)'
  // 开始时间
  let timeStr = ''
  if (set.setStartTime) {
    const s = new Date(set.setStartTime)
    timeStr = `开始 ${pad(s.getHours())}:${pad(s.getMinutes())}`
  }
  ctx.textAlign = 'center'
  ctx.fillText(timeStr, midX, y + 7)
  // 最终比分
  ctx.textAlign = 'right'
  ctx.fillStyle = set.winner === 'A' ? SHEET.color.teamA : SHEET.color.teamB
  ctx.fillText(`${set.finalScoreA} : ${set.finalScoreB}`, rightX, y + 7)
  y += 14

  // 外框
  drawBox(ctx, leftX, y, blockW, 1) // 顶线已画
  const blockTop = y

  // ===== 左半区（A队）和右半区（B队） =====
  const teamLeftX = leftX
  const teamRightX = midX + 2

  y = drawTeamSection(ctx, set, 'A', teamLeftX, y, halfW, data)
  y = drawTeamSection(ctx, set, 'B', teamRightX, blockTop, halfW, data)

  // 取两者较大值
  // 由于两个半区并行绘制在同一行起止，需要统一 y
  // 简化处理：A队先画到 yA，B队从 blockTop 画到 yB，取 max
  // 上面已分别绘制，这里画分隔线和底框

  // 中间分隔线
  drawVLine(ctx, midX, blockTop, y)

  // ===== 换人记录区 =====
  y += 2
  drawHLine(ctx, leftX, y, rightX)
  y += 2
  y = drawSubstitutionSection(ctx, set, leftX, midX, rightX, y)

  // ===== 暂停记录区 =====
  y += 2
  drawHLine(ctx, leftX, y, rightX)
  y += 2
  y = drawTimeoutSection(ctx, set, leftX, midX, rightX, y)

  // ===== 结束时间 =====
  y += 2
  drawHLine(ctx, leftX, y, rightX)
  y += 3
  ctx.font = `${SHEET.fontSize.mini}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'left'
  let endTimeStr = '结束时间: '
  if (set.setEndTime) {
    const e = new Date(set.setEndTime)
    endTimeStr += `${pad(e.getHours())}:${pad(e.getMinutes())}`
    if (set.setStartTime) {
      endTimeStr += `  (时长 ${Math.round((set.setEndTime - set.setStartTime) / 60000)}分钟)`
    }
  } else {
    endTimeStr += '--'
  }
  ctx.fillText(endTimeStr, leftX + 4, y + 5)

  // 决胜局换边标注
  if (set.decidingSetSwapped) {
    ctx.fillStyle = SHEET.color.swap
    ctx.textAlign = 'right'
    ctx.fillText(`※${set.swapScoreA}:${set.swapScoreB}换边`, rightX - 4, y + 5)
  }
  y += 10

  // 底部分隔线
  drawHLine(ctx, leftX, y, rightX)
  y += 12

  return y
}

/** 绘制某队的站位+发球轮次+得分列 */
function drawTeamSection(
  ctx: Ctx,
  set: SetSheetData,
  team: 'A' | 'B',
  x: number,
  startY: number,
  w: number,
  data: ScoresheetData
): number {
  let y = startY + 2
  const color = team === 'A' ? SHEET.color.teamA : SHEET.color.teamB
  const starting = team === 'A' ? set.teamAStarting : set.teamBStarting
  const serviceRounds = team === 'A' ? set.teamAServiceRounds : set.teamBServiceRounds
  const afterSwap = team === 'A' ? set.teamAServiceRoundsAfterSwap : set.teamBServiceRoundsAfterSwap
  const finalScore = team === 'A' ? set.finalScoreA : set.finalScoreB

  // 队名标识
  ctx.font = `bold ${SHEET.fontSize.small}px sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = 'left'
  ctx.fillText(`${team} (${team === 'A' ? data.teamAName : data.teamBName})`, x + 4, y + 5)
  y += 10

  // ===== 站位（罗马数字 I-VI + 球员号码）=====
  ctx.font = `${SHEET.fontSize.mini}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'center'
  ctx.fillText('站位', x + 4, y + 5)
  const posW = (w - 8) / 6
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI']
  for (let i = 0; i < 6; i++) {
    const px = x + 4 + posW * (i + 0.5)
    ctx.fillStyle = SHEET.color.text
    ctx.font = `${SHEET.fontSize.micro}px sans-serif`
    ctx.fillText(romans[i], px, y + 5)
    const player = starting[i]
    if (player) {
      ctx.font = `bold ${SHEET.fontSize.mini}px sans-serif`
      ctx.fillStyle = color
      ctx.fillText(player.number, px, y + 12)
    }
  }
  y += 16

  // ===== 发球轮次格子（1st-8th）=====
  y += 2
  ctx.font = `${SHEET.fontSize.micro}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'left'
  ctx.fillText('发球轮次', x + 4, y + 4)
  y += 6

  // 表头：1st 2nd 3rd 4th / 5th 6th 7th 8th
  const roundLabels = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']
  const roundColW = (w - 8) / 4
  const roundRowH = 14

  // 第1行：1st-4th
  for (let i = 0; i < 4; i++) {
    const cx = x + 4 + roundColW * i
    drawBox(ctx, cx, y, roundColW, roundRowH)
    ctx.font = `${SHEET.fontSize.micro}px sans-serif`
    ctx.fillStyle = SHEET.color.text
    ctx.textAlign = 'left'
    ctx.fillText(roundLabels[i], cx + 2, y + 4)
    ctx.textAlign = 'right'
    ctx.fillText(`${i + 1}`, cx + roundColW - 2, y + 4)

    // 填入该轮次的得分（tick标记）
    const round = serviceRounds[i]
    if (round) {
      ctx.font = `bold ${SHEET.fontSize.mini}px sans-serif`
      ctx.fillStyle = color
      ctx.textAlign = 'center'
      ctx.fillText(`${round.points.length}`, cx + roundColW / 2, y + 10)
    }
  }
  y += roundRowH

  // 第2行：5th-8th
  for (let i = 4; i < 8; i++) {
    const cx = x + 4 + roundColW * (i - 4)
    drawBox(ctx, cx, y, roundColW, roundRowH)
    ctx.font = `${SHEET.fontSize.micro}px sans-serif`
    ctx.fillStyle = SHEET.color.text
    ctx.textAlign = 'left'
    ctx.fillText(roundLabels[i], cx + 2, y + 4)
    ctx.textAlign = 'right'
    ctx.fillText(`${i + 1}`, cx + roundColW - 2, y + 4)

    const round = serviceRounds[i]
    if (round) {
      ctx.font = `bold ${SHEET.fontSize.mini}px sans-serif`
      ctx.fillStyle = color
      ctx.textAlign = 'center'
      ctx.fillText(`${round.points.length}`, cx + roundColW / 2, y + 10)
    }
  }
  y += roundRowH

  // 换边后的发球轮次（决胜局）
  if (afterSwap && afterSwap.length > 0) {
    ctx.font = `${SHEET.fontSize.micro}px sans-serif`
    ctx.fillStyle = SHEET.color.swap
    ctx.textAlign = 'left'
    ctx.fillText('换边后:', x + 4, y + 4)
    y += 6
    for (let i = 0; i < Math.min(afterSwap.length, 8); i++) {
      const row = Math.floor(i / 4)
      const col = i % 4
      const cx = x + 4 + roundColW * col
      const cy = y + row * roundRowH
      drawBox(ctx, cx, cy, roundColW, roundRowH)
      ctx.font = `${SHEET.fontSize.micro}px sans-serif`
      ctx.fillStyle = SHEET.color.text
      ctx.textAlign = 'left'
      ctx.fillText(roundLabels[i], cx + 2, cy + 4)
      ctx.font = `bold ${SHEET.fontSize.mini}px sans-serif`
      ctx.fillStyle = color
      ctx.textAlign = 'center'
      ctx.fillText(`${afterSwap[i].points.length}`, cx + roundColW / 2, cy + 10)
    }
    y += Math.ceil(Math.min(afterSwap.length, 8) / 4) * roundRowH + 2
  }

  // ===== 得分列（1-48 划线）=====
  y += 2
  ctx.font = `${SHEET.fontSize.micro}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'left'
  ctx.fillText('得分划线', x + 4, y + 4)
  y += 6

  // 发球轮次详情（每个轮次的比分序列）
  const allRounds = [...serviceRounds, ...(afterSwap ?? [])]
  let pointIdx = 0
  const pointsPerCol = 4
  const pointColW = (w - 8) / 12 // 12列，每列4个数字
  const pointCellH = 10

  // 画 1-48 的数字网格，得分划斜线
  for (let i = 0; i < 48; i++) {
    const col = Math.floor(i / pointsPerCol)
    const row = i % pointsPerCol
    const px = x + 4 + col * pointColW
    const py = y + row * pointCellH

    // 数字
    ctx.font = `${SHEET.fontSize.micro}px sans-serif`
    ctx.fillStyle = pointIdx < finalScore ? SHEET.color.slash : '#ccc'
    ctx.textAlign = 'center'
    ctx.fillText(`${i + 1}`, px + pointColW / 2, py + 5)

    // 得分划线
    if (pointIdx < finalScore) {
      ctx.strokeStyle = SHEET.color.slash
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(px + 1, py + pointCellH - 2)
      ctx.lineTo(px + pointColW - 1, py + 2)
      ctx.stroke()
      pointIdx++
    }
  }
  y += pointsPerCol * pointCellH + 2

  // 发球轮次比分序列
  y += 2
  ctx.font = `${SHEET.fontSize.micro}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'left'
  ctx.fillText('轮次比分:', x + 4, y + 4)
  y += 6
  for (let i = 0; i < allRounds.length; i++) {
    const r = allRounds[i]
    if (i > 0 && i % 3 === 0) y += 8
    const col = i % 3
    const cx = x + 4 + col * ((w - 8) / 3)
    const scores = r.runningScore.map(s => `${s.a}:${s.b}`).join(',')
    ctx.font = `${SHEET.fontSize.micro}px sans-serif`
    ctx.fillStyle = color
    ctx.textAlign = 'left'
    ctx.fillText(`${r.position}号(${r.serverNumber}): ${r.points.length}分`, cx, y + 4)
    ctx.fillStyle = SHEET.color.text
    ctx.font = `${SHEET.fontSize.micro}px sans-serif`
    ctx.fillText(`[${scores}]`, cx, y + 10)
  }
  y += 14

  return y
}

// ===== 换人记录区 =====

function drawSubstitutionSection(
  ctx: Ctx,
  set: SetSheetData,
  leftX: number,
  midX: number,
  rightX: number,
  startY: number
): number {
  let y = startY
  const subsA = set.substitutionsA
  const subsB = set.substitutionsB
  const halfW = midX - leftX

  ctx.font = `${SHEET.fontSize.mini}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'left'
  ctx.fillText('换人 S/E/T:', leftX + 4, y + 5)
  ctx.fillText('换人 S/E/T:', midX + 4, y + 5)
  y += 8

  const maxSubs = Math.max(subsA.length, subsB.length, 1)
  for (let i = 0; i < maxSubs; i++) {
    const subA = subsA[i]
    const subB = subsB[i]

    // A队换人
    if (subA) {
      const str = `${subA.playerOutNumber}→${subA.playerInNumber} (${subA.scoreA}:${subA.scoreB})`
      ctx.font = `${SHEET.fontSize.micro}px sans-serif`
      ctx.fillStyle = SHEET.color.teamA
      ctx.textAlign = 'left'
      ctx.fillText(str, leftX + 4, y + 5)
    }

    // B队换人
    if (subB) {
      const str = `${subB.playerOutNumber}→${subB.playerInNumber} (${subB.scoreA}:${subB.scoreB})`
      ctx.font = `${SHEET.fontSize.micro}px sans-serif`
      ctx.fillStyle = SHEET.color.teamB
      ctx.textAlign = 'left'
      ctx.fillText(str, midX + 4, y + 5)
    }
    y += 7
  }

  return y
}

// ===== 暂停记录区 =====

function drawTimeoutSection(
  ctx: Ctx,
  set: SetSheetData,
  leftX: number,
  midX: number,
  rightX: number,
  startY: number
): number {
  let y = startY
  const toA = set.timeoutsA
  const toB = set.timeoutsB

  ctx.font = `${SHEET.fontSize.mini}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'left'
  ctx.fillText('暂停 T:', leftX + 4, y + 5)
  ctx.fillText('暂停 T:', midX + 4, y + 5)
  y += 8

  // A队暂停（最多2次）
  for (let i = 0; i < Math.max(toA.length, toB.length, 1); i++) {
    const tA = toA[i]
    const tB = toB[i]

    if (tA) {
      ctx.font = `${SHEET.fontSize.micro}px sans-serif`
      ctx.fillStyle = SHEET.color.teamA
      ctx.textAlign = 'left'
      ctx.fillText(`T${i + 1}: ${tA.scoreA}:${tA.scoreB}`, leftX + 4, y + 5)
    }
    if (tB) {
      ctx.font = `${SHEET.fontSize.micro}px sans-serif`
      ctx.fillStyle = SHEET.color.teamB
      ctx.textAlign = 'left'
      ctx.fillText(`T${i + 1}: ${tB.scoreA}:${tB.scoreB}`, midX + 4, y + 5)
    }
    y += 7
  }

  return y
}

// ===== 汇总区 =====

function drawSummary(ctx: Ctx, data: ScoresheetData, startY: number): number {
  let y = startY + 5

  // 标题
  ctx.font = `bold ${SHEET.fontSize.header}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'center'
  ctx.fillText('比赛结果 / RESULTS', SHEET.width / 2, y + 8)
  y += 16

  // 表格
  const x = SHEET.padding
  const w = SHEET.width - SHEET.padding * 2

  // 列定义
  const cols = [
    { label: '局', w: 35 },
    { label: data.teamAName, w: 60, color: SHEET.color.teamA },
    { label: data.teamBName, w: 60, color: SHEET.color.teamB },
    { label: '胜方', w: 35 },
    { label: '换人\nA/B', w: 50 },
    { label: '暂停\nA/B', w: 50 },
    { label: '时长', w: 50 }
  ]
  const totalW = cols.reduce((s, c) => s + c.w, 0)
  const scaleX = w / totalW

  // 表头
  const headerH = 18
  let cx = x
  for (const col of cols) {
    drawBox(ctx, cx, y, col.w * scaleX, headerH)
    ctx.font = `${SHEET.fontSize.mini}px sans-serif`
    ctx.fillStyle = col.color || SHEET.color.text
    ctx.textAlign = 'center'
    const lines = col.label.split('\n')
    if (lines.length > 1) {
      ctx.fillText(lines[0], cx + col.w * scaleX / 2, y + 7)
      ctx.fillText(lines[1], cx + col.w * scaleX / 2, y + 14)
    } else {
      ctx.fillText(col.label, cx + col.w * scaleX / 2, y + 10)
    }
    cx += col.w * scaleX
  }
  y += headerH

  // 每局数据行
  const rowH = 14
  for (let i = 0; i < data.sets.length; i++) {
    const set = data.sets[i]
    let cx = x

    // 背景
    ctx.fillStyle = i % 2 === 0 ? SHEET.color.zebra : SHEET.color.bg
    ctx.fillRect(x, y, w, rowH)

    // 局号
    drawBox(ctx, cx, y, cols[0].w * scaleX, rowH)
    ctx.font = `${SHEET.fontSize.mini}px sans-serif`
    ctx.fillStyle = SHEET.color.text
    ctx.textAlign = 'center'
    ctx.fillText(`${i + 1}`, cx + cols[0].w * scaleX / 2, y + 8)
    cx += cols[0].w * scaleX

    // A队得分
    drawBox(ctx, cx, y, cols[1].w * scaleX, rowH)
    ctx.fillStyle = SHEET.color.teamA
    ctx.fillText(`${set.finalScoreA}`, cx + cols[1].w * scaleX / 2, y + 8)
    cx += cols[1].w * scaleX

    // B队得分
    drawBox(ctx, cx, y, cols[2].w * scaleX, rowH)
    ctx.fillStyle = SHEET.color.teamB
    ctx.fillText(`${set.finalScoreB}`, cx + cols[2].w * scaleX / 2, y + 8)
    cx += cols[2].w * scaleX

    // 胜方
    drawBox(ctx, cx, y, cols[3].w * scaleX, rowH)
    ctx.fillStyle = set.winner === 'A' ? SHEET.color.teamA : SHEET.color.teamB
    ctx.fillText(set.winner, cx + cols[3].w * scaleX / 2, y + 8)
    cx += cols[3].w * scaleX

    // 换人 A/B
    drawBox(ctx, cx, y, cols[4].w * scaleX, rowH)
    ctx.fillStyle = SHEET.color.text
    ctx.fillText(`${set.substitutionsA.length}/${set.substitutionsB.length}`, cx + cols[4].w * scaleX / 2, y + 8)
    cx += cols[4].w * scaleX

    // 暂停 A/B
    drawBox(ctx, cx, y, cols[5].w * scaleX, rowH)
    ctx.fillText(`${set.timeoutsA.length}/${set.timeoutsB.length}`, cx + cols[5].w * scaleX / 2, y + 8)
    cx += cols[5].w * scaleX

    // 时长
    drawBox(ctx, cx, y, cols[6].w * scaleX, rowH)
    let durStr = '--'
    if (set.setStartTime && set.setEndTime) {
      durStr = `${Math.round((set.setEndTime - set.setStartTime) / 60000)}分`
    }
    ctx.fillText(durStr, cx + cols[6].w * scaleX / 2, y + 8)

    y += rowH
  }

  // 合计行
  cx = x
  drawBox(ctx, cx, y, cols[0].w * scaleX, rowH)
  ctx.font = `bold ${SHEET.fontSize.mini}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'center'
  ctx.fillText('合计', cx + cols[0].w * scaleX / 2, y + 8)
  cx += cols[0].w * scaleX

  drawBox(ctx, cx, y, cols[1].w * scaleX, rowH)
  ctx.fillStyle = SHEET.color.teamA
  ctx.fillText(`${data.sets.reduce((s, set) => s + set.finalScoreA, 0)}`, cx + cols[1].w * scaleX / 2, y + 8)
  cx += cols[1].w * scaleX

  drawBox(ctx, cx, y, cols[2].w * scaleX, rowH)
  ctx.fillStyle = SHEET.color.teamB
  ctx.fillText(`${data.sets.reduce((s, set) => s + set.finalScoreB, 0)}`, cx + cols[2].w * scaleX / 2, y + 8)
  cx += cols[2].w * scaleX

  drawBox(ctx, cx, y, cols[3].w * scaleX, rowH)
  ctx.fillStyle = SHEET.color.text
  ctx.fillText(`${data.setsWonA}:${data.setsWonB}`, cx + cols[3].w * scaleX / 2, y + 8)
  cx += cols[3].w * scaleX

  drawBox(ctx, cx, y, cols[4].w * scaleX, rowH)
  ctx.fillText(`${data.sets.reduce((s, set) => s + set.substitutionsA.length, 0)}/${data.sets.reduce((s, set) => s + set.substitutionsB.length, 0)}`, cx + cols[4].w * scaleX / 2, y + 8)
  cx += cols[4].w * scaleX

  drawBox(ctx, cx, y, cols[5].w * scaleX, rowH)
  ctx.fillText(`${data.sets.reduce((s, set) => s + set.timeoutsA.length, 0)}/${data.sets.reduce((s, set) => s + set.timeoutsB.length, 0)}`, cx + cols[5].w * scaleX / 2, y + 8)
  cx += cols[5].w * scaleX

  drawBox(ctx, cx, y, cols[6].w * scaleX, rowH)
  const totalDur = data.sets.reduce((sum, s) => {
    if (s.setStartTime && s.setEndTime) return sum + (s.setEndTime - s.setStartTime)
    return sum
  }, 0)
  ctx.fillText(`${Math.round(totalDur / 60000)}分`, cx + cols[6].w * scaleX / 2, y + 8)
  y += rowH

  // 获胜队
  y += 8
  if (data.winner) {
    const winnerName = data.winner === 'A' ? data.teamAName : data.teamBName
    ctx.font = `bold ${SHEET.fontSize.header}px sans-serif`
    ctx.fillStyle = data.winner === 'A' ? SHEET.color.teamA : SHEET.color.teamB
    ctx.textAlign = 'center'
    ctx.fillText(`${winnerName} 获胜  ${data.setsWonA}:${data.setsWonB}`, SHEET.width / 2, y + 10)
    y += 18
  }

  // 比赛总时长
  const matchDur = data.matchEndTime - data.matchStartTime
  ctx.font = `${SHEET.fontSize.small}px sans-serif`
  ctx.fillStyle = SHEET.color.text
  ctx.textAlign = 'center'
  ctx.fillText(`总时长: ${Math.round(matchDur / 60000)}分钟`, SHEET.width / 2, y + 7)
  y += 14

  return y
}

// ===== 基础图元 =====

function drawHLine(ctx: Ctx, x1: number, y1: number, x2: number): void {
  ctx.strokeStyle = SHEET.color.border
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y1)
  ctx.stroke()
}

function drawVLine(ctx: Ctx, x: number, y1: number, y2: number): void {
  ctx.strokeStyle = SHEET.color.border
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.moveTo(x, y1)
  ctx.lineTo(x, y2)
  ctx.stroke()
}

function drawBox(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.strokeStyle = SHEET.color.border
  ctx.lineWidth = 0.5
  ctx.strokeRect(x, y, w, h)
}

function pad(n: number): string {
  return n < 10 ? '0' + n : '' + n
}
