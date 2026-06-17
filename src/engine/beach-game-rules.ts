// 沙滩排球规则常量

/** 常规局（第1-2局）目标分数 */
export const POINTS_REGULAR = 21

/** 决胜局（第3局）目标分数 */
export const POINTS_DECIDING = 15

/** 最低领先分 */
export const MIN_LEAD = 2

/** 获胜所需局数 */
export const SETS_TO_WIN = 2

/** 总局数 */
export const TOTAL_SETS = 3

/** 每队上场人数 */
export const PLAYER_COUNT = 2

/** 常规局换边分数间隔（7的倍数） */
export const REGULAR_SWAP_INTERVAL = 7

/** 决胜局换边分数间隔（5的倍数） */
export const DECIDING_SWAP_INTERVAL = 5

/** 每局暂停次数 */
export const TIMEOUTS_PER_SET = 1

/** 暂停时长（秒） */
export const TIMEOUT_DURATION = 30

/** 获取当前局的目标分数 */
export function getTargetPoints(currentSet: number): number {
  return currentSet === TOTAL_SETS ? POINTS_DECIDING : POINTS_REGULAR
}

/** 判断是否局结束（沙滩排球无封顶，必须净胜2分） */
export function isSetOver(scoreA: number, scoreB: number, currentSet: number): boolean {
  const target = getTargetPoints(currentSet)

  // 必须达到目标分且净胜2分，无封顶
  if (scoreA >= target && scoreA - scoreB >= MIN_LEAD) return true
  if (scoreB >= target && scoreB - scoreA >= MIN_LEAD) return true

  return false
}

/** 判断是否比赛结束 */
export function isMatchOver(setsWonA: number, setsWonB: number): boolean {
  return setsWonA >= SETS_TO_WIN || setsWonB >= SETS_TO_WIN
}

/** 判断是否需要换边（沙滩排球特殊规则）
 * 第1-2局：两队比分之和为7分及7的倍数换边
 * 第3局：两队比分之和为5分及5的倍数换边
 */
export function needsCourtSwap(currentSet: number, totalPoints: number, lastSwapPoints: number): boolean {
  const interval = currentSet === TOTAL_SETS ? DECIDING_SWAP_INTERVAL : REGULAR_SWAP_INTERVAL
  // 检查是否达到新的换边分数（totalPoints是interval的倍数，且比上次换边分数大）
  return totalPoints > lastSwapPoints && totalPoints % interval === 0
}

/** 获取当前局换边间隔 */
export function getSwapInterval(currentSet: number): number {
  return currentSet === TOTAL_SETS ? DECIDING_SWAP_INTERVAL : REGULAR_SWAP_INTERVAL
}
