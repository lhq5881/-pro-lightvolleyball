import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { BeachScoringEngine, type TeamSide } from '@/engine/beach-scoring-engine'
import { needsCourtSwap, TOTAL_SETS, TIMEOUTS_PER_SET } from '@/engine/beach-game-rules'
import type { Player, TeamConfig, Match, SetPlayerInfo } from '@/models/match'
import { createMatch } from '@/models/match'
import type { SyncEvent, MatchStateSnapshot, MatchConfig, TimeoutEvent, CourtSwapEvent, TechTimeoutEvent } from '@/services/sync-types'
import { syncService } from '@/services/sync-service'
import { useSyncStore } from '@/stores/sync'
import type { MatchAction } from '@/engine/action-history'
import { getUndoDescription } from '@/engine/action-history'

export const useBeachMatchStore = defineStore('beachMatch', () => {
  // 比赛配置
  const match = ref<Match | null>(null)
  const scoringEngine = ref<BeachScoringEngine | null>(null)

  // 挑边信息（用于第一局结束后询问挑边失利队伍）
  const tossWinner = ref<TeamSide | null>(null)
  const tossWinnerChoice = ref<'serve' | 'receive' | null>(null)

  // 场地是否交换（A/B侧显示互换）
  const courtSwapped = ref(false)
  // 当前局上次换边时的总得分
  const lastSwapPoints = ref(0)
  // 换边弹窗是否显示
  const pendingCourtSwap = ref<CourtSwapEvent | null>(null)
  // 21分换边待处理（技术暂停确认后需要换边）
  const pending21Swap = ref<CourtSwapEvent | null>(null)

  // 每局暂停次数：timeoutsA[setIndex] = 已用次数
  const timeoutsA = ref<number[]>([0, 0, 0])
  const timeoutsB = ref<number[]>([0, 0, 0])
  // 最近一次暂停事件（用于同步弹窗）
  const lastTimeout = ref<TimeoutEvent | null>(null)
  // 技术暂停事件（用于同步弹窗）
  const pendingTechTimeout = ref<TechTimeoutEvent | null>(null)

  // 每局开始时的首发站位ID（用于记录本局首发队员）
  const currentSetStartingA = ref<string[]>([])
  const currentSetStartingB = ref<string[]>([])

  // 局间休息结束时间戳（用于同步倒计时）
  const setBreakEndTime = ref<number | null>(null)

  // 操作历史（用于统一撤销）
  const actionHistory = ref<MatchAction[]>([])

  // 当前比分
  const scoreA = computed(() => scoringEngine.value?.scoreA ?? 0)
  const scoreB = computed(() => scoringEngine.value?.scoreB ?? 0)
  const currentSet = computed(() => scoringEngine.value?.currentSet ?? 1)
  const setsWonA = computed(() => scoringEngine.value?.setsWonA ?? 0)
  const setsWonB = computed(() => scoringEngine.value?.setsWonB ?? 0)
  const servingTeam = computed(() => scoringEngine.value?.servingTeam ?? 'A')
  const serverIndexA = computed(() => scoringEngine.value?.serverIndexA ?? 0)
  const serverIndexB = computed(() => scoringEngine.value?.serverIndexB ?? 0)
  const isSetComplete = computed(() => scoringEngine.value?.isSetComplete ?? false)
  const isMatchComplete = computed(() => scoringEngine.value?.isMatchComplete ?? false)
  const canUndo = computed(() => actionHistory.value.length > 0)
  const undoDescription = computed(() => getUndoDescription(actionHistory.value[actionHistory.value.length - 1]))
  const isLive = computed(() => match.value?.status === 'live')

  /** 开始新比赛 */
  function startMatch(
    teamAConfig: TeamConfig,
    teamBConfig: TeamConfig,
    initialServingTeam: TeamSide,
    teamAInitialServer: number = 0,
    teamBInitialServer: number = 0,
    tossWinnerTeam?: TeamSide,
    tossChoice?: 'serve' | 'receive'
  ) {
    match.value = createMatch(teamAConfig, teamBConfig, initialServingTeam)
    match.value.status = 'live'

    const initialServerIndex = initialServingTeam === 'A' ? teamAInitialServer : teamBInitialServer
    scoringEngine.value = new BeachScoringEngine(
      initialServingTeam,
      initialServerIndex,
      teamAInitialServer,
      teamBInitialServer
    )

    // 保存挑边信息
    tossWinner.value = tossWinnerTeam ?? null
    tossWinnerChoice.value = tossChoice ?? null

    courtSwapped.value = false
    lastSwapPoints.value = 0
    pendingCourtSwap.value = null
    timeoutsA.value = [0, 0, 0]
    timeoutsB.value = [0, 0, 0]
    lastTimeout.value = null
    currentSetStartingA.value = [...teamAConfig.startingPositions]
    currentSetStartingB.value = [...teamBConfig.startingPositions]
    actionHistory.value = []
  } */
  function scorePoint(team: TeamSide) {
    if (!scoringEngine.value) return

    const wasSetComplete = scoringEngine.value.isSetComplete
    scoringEngine.value.scorePoint(team)

    // 局结束时，记录本局人员信息到setResults
    if (!wasSetComplete && scoringEngine.value.isSetComplete) {
      const lastResult = scoringEngine.value.setResults[scoringEngine.value.setResults.length - 1]
      if (lastResult && match.value) {
        lastResult.teamAPlayers = captureSetPlayers('A')
        lastResult.teamBPlayers = captureSetPlayers('B')
      }
      actionHistory.value.push({ type: 'score', team })
      pushSyncSnapshot()
      return
    }

    actionHistory.value.push({ type: 'score', team })

    // 检查换边（沙滩排球特殊规则），内部会调用 pushSyncSnapshot
    const courtSwapTriggered = checkCourtSwap()

    if (!courtSwapTriggered) {
      pushSyncSnapshot()
    }
  }

  /** 捕获某队本局首发和替补队员信息 */
  function captureSetPlayers(team: TeamSide): SetPlayerInfo {
    const startingIds = team === 'A' ? currentSetStartingA.value : currentSetStartingB.value
    const allPlayers = team === 'A' ? match.value!.teamA.players : match.value!.teamB.players
    const startingPlayers = startingIds.map(playerId => {
      const p = allPlayers.find(p => p.id === playerId)
      return p ?? { id: playerId, name: '?', number: '' }
    })
    return {
      startingPlayers,
      subPlayers: [] // 沙滩排球无换人
    }
  }

  /** 撤销上一次操作 */
  function undoAction() {
    if (actionHistory.value.length === 0) return
    const action = actionHistory.value.pop()!

    if (action.type === 'score') {
      if (!scoringEngine.value) return
      if (scoringEngine.value.pointHistory.length === 0) return
      scoringEngine.value.undoPoint()
    } else if (action.type === 'timeout') {
      const timeouts = action.team === 'A' ? timeoutsA.value : timeoutsB.value
      timeouts[action.setIndex]--
      lastTimeout.value = action.previousLastTimeout
    }

    pushSyncSnapshot()
  }

  /** 进入下一局 */
  function nextSet(servingTeam?: TeamSide, serverIndex?: number, teamAServer?: number, teamBServer?: number) {
    if (!scoringEngine.value) return
    scoringEngine.value.nextSet(servingTeam, serverIndex, teamAServer, teamBServer)
    // 保存下一局首发站位
    currentSetStartingA.value = [...match.value!.teamA.startingPositions]
    currentSetStartingB.value = [...match.value!.teamB.startingPositions]
    // 重置换边状态
    courtSwapped.value = false
    lastSwapPoints.value = 0
    pendingCourtSwap.value = null
    // 清除局间休息结束时间
    setBreakEndTime.value = null
    // 新一局清空操作历史
    actionHistory.value = []
    pushSyncSnapshot()
  }

  /** 交换场地 */
  function swapCourts() {
    courtSwapped.value = !courtSwapped.value
    pushSyncSnapshot()
  }

  /** 检查换边（沙滩排球特殊规则） */
  function checkCourtSwap(): boolean {
    if (!scoringEngine.value) {
      console.log('[BeachMatch] checkCourtSwap: no scoringEngine')
      return false
    }
    if (scoringEngine.value.isSetComplete) {
      console.log('[BeachMatch] checkCourtSwap: set is complete')
      return false
    }

    const totalPoints = scoringEngine.value.scoreA + scoringEngine.value.scoreB
    const setNumber = scoringEngine.value.currentSet

    console.log('[BeachMatch] checkCourtSwap, set:', setNumber, 'totalPoints:', totalPoints, 'lastSwapPoints:', lastSwapPoints.value)

    // 第1-2局21分时，先触发技术暂停，不触发换边弹窗
    // 使用 lastSwapPoints < 21 确保只触发一次
    if (setNumber <= 2 && totalPoints === 21 && lastSwapPoints.value < 21) {
      console.log('[BeachMatch] 触发21分技术暂停')
      // 21分技术暂停：先弹出技术暂停，确认后再换边
      pendingTechTimeout.value = { timestamp: Date.now() }
      // 标记21分换边待处理（技术暂停确认后再换边）
      pending21Swap.value = { timestamp: Date.now() }
      // 立即更新引擎的 lastSwapPoints 防止重复触发
      scoringEngine.value.confirmCourtSwap()
      lastSwapPoints.value = scoringEngine.value.lastSwapPoints
      console.log('[BeachMatch] 技术暂停设置完成, lastSwapPoints:', lastSwapPoints.value)
      pushSyncSnapshot()
      return true
    }

    // 检查是否需要换边
    const interval = setNumber === 3 ? 5 : 7
    const needSwap = totalPoints > lastSwapPoints.value && totalPoints % interval === 0
    console.log('[BeachMatch] needsCourtSwap check:', needSwap, 'interval:', interval, 'totalPoints > lastSwapPoints:', totalPoints > lastSwapPoints.value, 'totalPoints % interval === 0:', totalPoints % interval === 0)

    if (needSwap) {
      console.log('[BeachMatch] 触发换边弹窗')
      // 设置换边事件用于同步弹窗
      pendingCourtSwap.value = { timestamp: Date.now() }
      pushSyncSnapshot()
      return true
    }
    return false
  }

  /** 确认换边 */
  function confirmCourtSwap(needTechTimeout: boolean = false) {
    if (!scoringEngine.value) return
    console.log('[BeachMatch] confirmCourtSwap called, courtSwapped before:', courtSwapped.value)
    courtSwapped.value = !courtSwapped.value
    scoringEngine.value.confirmCourtSwap()
    lastSwapPoints.value = scoringEngine.value.lastSwapPoints
    pendingCourtSwap.value = null
    console.log('[BeachMatch] confirmCourtSwap done, courtSwapped after:', courtSwapped.value, 'lastSwapPoints:', lastSwapPoints.value)

    // 如果需要技术暂停，在同一个同步中设置
    if (needTechTimeout) {
      pendingTechTimeout.value = { timestamp: Date.now() }
    }

    pushSyncSnapshot()
  }

  /** 获取上一局接发球方（用于下一局先发球） */
  function getPreviousReceiver(): TeamSide {
    if (!scoringEngine.value) return 'B'
    return scoringEngine.value.servingTeam === 'A' ? 'B' : 'A'
  }

  /** 设置局间休息结束时间 */
  function setSetBreakEndTime(endTime: number | null) {
    setBreakEndTime.value = endTime
    pushSyncSnapshot()
  }

  /** 获取队员信息 */
  function getPlayer(playerId: string): Player | undefined {
    if (!match.value) return undefined
    return match.value.teamA.players.find(p => p.id === playerId)
      ?? match.value.teamB.players.find(p => p.id === playerId)
  }

  /** 获取当前发球队员 */
  function getCurrentServer(team: TeamSide): string {
    if (!match.value) return ''
    const players = team === 'A' ? match.value.teamA.players : match.value.teamB.players
    const index = scoringEngine.value?.getCurrentServerIndex(team) ?? 0
    const rotation = team === 'A' ? currentSetStartingA.value : currentSetStartingB.value
    return rotation[index] || players[index]?.id || ''
  }

  /** 暂停 */
  function callTimeout(team: TeamSide): boolean {
    if (!scoringEngine.value) return false
    const setIndex = scoringEngine.value.currentSet - 1
    const timeouts = team === 'A' ? timeoutsA.value : timeoutsB.value
    if (timeouts[setIndex] >= TIMEOUTS_PER_SET) return false

    const previousLastTimeout = lastTimeout.value ? { ...lastTimeout.value } : null
    timeouts[setIndex]++
    lastTimeout.value = { team, timestamp: Date.now() }

    actionHistory.value.push({ type: 'timeout', team, setIndex, previousLastTimeout })
    pushSyncSnapshot()
    return true
  }

  /** 清除暂停弹窗 */
  function clearLastTimeout() {
    lastTimeout.value = null
    pushSyncSnapshot()
  }

  /** 清除换边弹窗 */
  function clearPendingCourtSwap() {
    pendingCourtSwap.value = null
    pushSyncSnapshot()
  }

  /** 开始技术暂停 */
  function startTechTimeout() {
    console.log('[BeachMatch] startTechTimeout called')
    pendingTechTimeout.value = { timestamp: Date.now() }
    console.log('[BeachMatch] pendingTechTimeout set:', pendingTechTimeout.value)
    pushSyncSnapshot()
  }

  /** 清除技术暂停弹窗 */
  function clearPendingTechTimeout() {
    pendingTechTimeout.value = null
    // 如果有21分换边待处理，触发换边弹窗
    if (pending21Swap.value) {
      pendingCourtSwap.value = pending21Swap.value
      pending21Swap.value = null
    }
    pushSyncSnapshot()
  }

  /** 获取当前局暂停次数 */
  function getTimeouts(team: TeamSide): number {
    if (!scoringEngine.value) return 0
    const setIndex = scoringEngine.value.currentSet - 1
    const timeouts = team === 'A' ? timeoutsA.value : timeoutsB.value
    return timeouts[setIndex]
  }

  /** 完成比赛 */
  function completeMatch() {
    if (!match.value || !scoringEngine.value) return

    match.value.setScores = scoringEngine.value.setResults.map(r => ({
      scoreA: r.scoreA,
      scoreB: r.scoreB,
      winner: r.winner,
      pointLog: [...r.pointLog],
      teamAPlayers: r.teamAPlayers ?? { startingPlayers: [], subPlayers: [] },
      teamBPlayers: r.teamBPlayers ?? { startingPlayers: [], subPlayers: [] }
    }))
    match.value.setsWonA = scoringEngine.value.setsWonA
    match.value.setsWonB = scoringEngine.value.setsWonB
    match.value.winner = scoringEngine.value.setsWonA > scoringEngine.value.setsWonB ? 'A' : 'B'
    match.value.status = 'completed'
    match.value.endTime = Date.now()
  }

  /** 重置比赛 */
  function resetMatch() {
    match.value = null
    scoringEngine.value = null
    courtSwapped.value = false
    lastSwapPoints.value = 0
    pendingCourtSwap.value = null
    timeoutsA.value = [0, 0, 0]
    timeoutsB.value = [0, 0, 0]
    lastTimeout.value = null
    currentSetStartingA.value = []
    currentSetStartingB.value = []
    pendingTechTimeout.value = null
    pending21Swap.value = null
    tossWinner.value = null
    tossWinnerChoice.value = null
    setBreakEndTime.value = null
    actionHistory.value = []
  }

  /** 推送状态快照 */
  function pushSyncSnapshot() {
    const syncStore = useSyncStore()
    if (syncService.syncEnabled && scoringEngine.value && match.value) {
      const snapshot = takeSnapshot()
      syncService.pushEvent('STATE_UPDATE', { snapshot })
    }
  }

  /** 应用远程事件 */
  function applyRemoteEvent(event: SyncEvent) {
    const { type, payload } = event

    if (type === 'STATE_UPDATE' && payload.snapshot) {
      loadSnapshot(payload.snapshot as BeachMatchStateSnapshot)
      return
    }

    // START_MATCH 事件用于加入者端首次接收比赛配置
    if (type === 'START_MATCH' && payload.matchConfig) {
      const config = payload.matchConfig as MatchConfig
      const teamAConfig: TeamConfig = {
        name: config.teamAName,
        players: config.teamAPlayers,
        startingPositions: config.teamAStartingPositions
      }
      const teamBConfig: TeamConfig = {
        name: config.teamBName,
        players: config.teamBPlayers,
        startingPositions: config.teamBStartingPositions
      }
      startMatch(
        teamAConfig, teamBConfig,
        config.initialServingTeam,
        (config as any).teamAInitialServer ?? 0,
        (config as any).teamBInitialServer ?? 0,
        (config as any).tossWinner ?? undefined,
        (config as any).tossWinnerChoice ?? undefined
      )
    }
  }

  /** 生成状态快照 */
  function takeSnapshot(): BeachMatchStateSnapshot {
    return {
      scoringState: scoringEngine.value!.getState(),
      match: JSON.parse(JSON.stringify(match.value!)),
      courtSwapped: courtSwapped.value,
      lastSwapPoints: scoringEngine.value!.lastSwapPoints,
      pendingCourtSwap: pendingCourtSwap.value ? { ...pendingCourtSwap.value } : null,
      pending21Swap: pending21Swap.value ? { ...pending21Swap.value } : null,
      timeoutsA: [...timeoutsA.value],
      timeoutsB: [...timeoutsB.value],
      currentSetStartingA: [...currentSetStartingA.value],
      currentSetStartingB: [...currentSetStartingB.value],
      lastTimeout: lastTimeout.value ? { ...lastTimeout.value } : null,
      pendingTechTimeout: pendingTechTimeout.value ? { ...pendingTechTimeout.value } : null,
      tossWinner: tossWinner.value,
      tossWinnerChoice: tossWinnerChoice.value,
      setBreakEndTime: setBreakEndTime.value,
      actionHistory: [...actionHistory.value]
    }
  }

  /** 从快照恢复状态 */
  function loadSnapshot(snapshot: BeachMatchStateSnapshot) {
    console.log('[BeachMatch] loadSnapshot, pendingTechTimeout:', (snapshot as any).pendingTechTimeout)
    // 恢复引擎
    const engine = new BeachScoringEngine(
      snapshot.scoringState.servingTeam,
      snapshot.scoringState.serverIndexA ?? 0,
      snapshot.scoringState.initialServerA ?? 0,
      snapshot.scoringState.initialServerB ?? 0
    )
    engine.setState(snapshot.scoringState)
    scoringEngine.value = engine

    // 恢复 match 对象
    match.value = JSON.parse(JSON.stringify(snapshot.match))

    // 恢复所有 ref（lastSwapPoints 从引擎获取，确保一致）
    courtSwapped.value = snapshot.courtSwapped
    lastSwapPoints.value = engine.lastSwapPoints
    pendingCourtSwap.value = snapshot.pendingCourtSwap ? { ...snapshot.pendingCourtSwap } : null
    pending21Swap.value = (snapshot as any).pending21Swap ? { ...(snapshot as any).pending21Swap } : null
    timeoutsA.value = [...snapshot.timeoutsA]
    timeoutsB.value = [...snapshot.timeoutsB]
    currentSetStartingA.value = [...snapshot.currentSetStartingA]
    currentSetStartingB.value = [...snapshot.currentSetStartingB]
    lastTimeout.value = snapshot.lastTimeout ? { ...snapshot.lastTimeout } : null
    pendingTechTimeout.value = (snapshot as any).pendingTechTimeout ? { ...(snapshot as any).pendingTechTimeout } : null
    tossWinner.value = (snapshot as any).tossWinner ?? null
    tossWinnerChoice.value = (snapshot as any).tossWinnerChoice ?? null
    setBreakEndTime.value = (snapshot as any).setBreakEndTime ?? null
    actionHistory.value = [...(snapshot.actionHistory ?? [])]
    console.log('[BeachMatch] loadSnapshot done, pendingTechTimeout:', pendingTechTimeout.value, 'tossWinner:', tossWinner.value)
  }

  return {
    match,
    scoringEngine,
    scoreA,
    scoreB,
    currentSet,
    setsWonA,
    setsWonB,
    servingTeam,
    serverIndexA,
    serverIndexB,
    isSetComplete,
    isMatchComplete,
    canUndo,
    isLive,
    courtSwapped,
    lastSwapPoints,
    pendingCourtSwap,
    lastTimeout,
    setBreakEndTime,
    pendingTechTimeout,
    tossWinner,
    tossWinnerChoice,
    startMatch,
    scorePoint,
    undoAction,
    undoDescription,
    nextSet,
    swapCourts,
    checkCourtSwap,
    confirmCourtSwap,
    getPreviousReceiver,
    getPlayer,
    getCurrentServer,
    callTimeout,
    clearLastTimeout,
    clearPendingCourtSwap,
    startTechTimeout,
    clearPendingTechTimeout,
    getTimeouts,
    completeMatch,
    resetMatch,
    setSetBreakEndTime,
    applyRemoteEvent,
    pushSyncSnapshot,
    takeSnapshot,
    loadSnapshot
  }
})

/** 沙滩排球比赛状态快照 */
interface BeachMatchStateSnapshot {
  scoringState: any
  match: Match
  courtSwapped: boolean
  lastSwapPoints: number
  pendingCourtSwap: CourtSwapEvent | null
  pending21Swap: CourtSwapEvent | null
  timeoutsA: number[]
  timeoutsB: number[]
  currentSetStartingA: string[]
  currentSetStartingB: string[]
  lastTimeout: TimeoutEvent | null
  pendingTechTimeout: TechTimeoutEvent | null
  tossWinner: TeamSide | null
  tossWinnerChoice: 'serve' | 'receive' | null
  setBreakEndTime: number | null
  actionHistory?: MatchAction[]
}
