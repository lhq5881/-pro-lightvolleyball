// 气排球规则常量

/** 常规局（第1、2局）目标分数 */
export const POINTS_REGULAR = 21

/** 决胜局（第3局）目标分数 */
export const POINTS_DECIDING = 15

/** 常规局默认封顶分数 */
export const DEFAULT_CAP_REGULAR = 25

/** 决胜局默认封顶分数 */
export const DEFAULT_CAP_DECIDING = 17

/** 最低领先分 */
export const MIN_LEAD = 2

/** 获胜所需局数 */
export const SETS_TO_WIN = 2

/** 总局数 */
export const TOTAL_SETS = 3

/** 每队上场人数 */
export const PLAYER_COUNT = 5

/** 轮转位置 */
export const ROTATION_POSITIONS = [1, 2, 3, 4, 5] as const

/** 获取当前局的目标分数 */
export function getTargetPoints(currentSet: number): number {
  return currentSet === TOTAL_SETS ? POINTS_DECIDING : POINTS_REGULAR
}

/** 判断是否局结束 */
export function isSetOver(scoreA: number, scoreB: number, currentSet: number, cap?: number): boolean {
  const target = getTargetPoints(currentSet)
  const capPoints = cap ?? (currentSet === TOTAL_SETS ? DEFAULT_CAP_DECIDING : DEFAULT_CAP_REGULAR)

  // 任一方达到封顶分
  if (scoreA >= capPoints || scoreB >= capPoints) return true

  // 任一方达到目标分且领先2分
  if (scoreA >= target && scoreA - scoreB >= MIN_LEAD) return true
  if (scoreB >= target && scoreB - scoreA >= MIN_LEAD) return true

  return false
}

/** 判断是否比赛结束 */
export function isMatchOver(setsWonA: number, setsWonB: number): boolean {
  return setsWonA >= SETS_TO_WIN || setsWonB >= SETS_TO_WIN
}
