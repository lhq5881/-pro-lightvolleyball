// 室内排球规则常量

/** 常规局目标分数 */
export const POINTS_REGULAR = 25

/** 决胜局目标分数 */
export const POINTS_DECIDING = 15

/** 最低领先分 */
export const MIN_LEAD = 2

/** 每队上场人数 */
export const PLAYER_COUNT = 6

/** 决胜局换边分数 */
export const DECIDING_SET_SWAP_POINT = 8

/** 轮转位置（室内排球6人制）
 * 前排：4号位（左）、3号位（中）、2号位（右）
 * 后排：5号位（左）、6号位（中）、1号位（右，发球位）
 */
export const ROTATION_POSITIONS = [1, 2, 3, 4, 5, 6] as const

/** 轮转顺序（顺时针）
 * 得分后轮转：2→1→6→5→4→3→2
 */
export const ROTATION_ORDER = {
  2: 1,  // 2号位 → 1号位（发球）
  1: 6,  // 1号位 → 6号位
  6: 5,  // 6号位 → 5号位
  5: 4,  // 5号位 → 4号位
  4: 3,  // 4号位 → 3号位
  3: 2,  // 3号位 → 2号位
} as const

/** 获取当前局的目标分数 */
export function getTargetPoints(currentSet: number, totalSets: number = 5): number {
  const decidingSet = totalSets // 决胜局是最后一局
  return currentSet === decidingSet ? POINTS_DECIDING : POINTS_REGULAR
}

/** 判断是否局结束（室内排球无封顶，必须净胜2分） */
export function isSetOver(scoreA: number, scoreB: number, currentSet: number, totalSets: number = 5): boolean {
  const target = getTargetPoints(currentSet, totalSets)

  // 必须达到目标分且净胜2分，无封顶
  if (scoreA >= target && scoreA - scoreB >= MIN_LEAD) return true
  if (scoreB >= target && scoreB - scoreA >= MIN_LEAD) return true

  return false
}

/** 判断是否比赛结束 */
export function isMatchOver(setsWonA: number, setsWonB: number, totalSets: number = 5): boolean {
  const setsToWin = Math.floor(totalSets / 2) + 1
  return setsWonA >= setsToWin || setsWonB >= setsToWin
}

/** 判断决胜局是否需要换边（任一队伍先到8分时） */
export function needsDecidingSetSwap(currentSet: number, scoreA: number, scoreB: number, alreadySwapped: boolean, totalSets: number = 5): boolean {
  // 只有决胜局（最后一局）需要8分换边，任一队伍先到8分时换边
  return currentSet === totalSets && (scoreA >= DECIDING_SET_SWAP_POINT || scoreB >= DECIDING_SET_SWAP_POINT) && !alreadySwapped
}
