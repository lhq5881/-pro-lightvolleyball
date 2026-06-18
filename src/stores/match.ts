import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ScoringEngine, type TeamSide } from '@/engine/scoring-engine'
import { RotationEngine } from '@/engine/rotation-engine'
import type { Player, TeamConfig, Match, SetPlayerInfo } from '@/models/match'
import { createMatch } from '@/models/match'
import { TOTAL_SETS } from '@/engine/game-rules'
import type { SyncEvent, MatchStateSnapshot, MatchConfig, TimeoutEvent, Set3SwapEvent } from '@/services/sync-types'
import { syncService } from '@/services/sync-service'
import { useSyncStore } from '@/stores/sync'
import type { MatchAction } from '@/engine/action-history'
import { getUndoDescription } from '@/engine/action-history'

export const useMatchStore = defineStore('match', () => {
  // 比赛配置
  const match = ref<Match | null>(null)
  const scoringEngine = ref<ScoringEngine | null>(null)
  const rotationEngine = ref<RotationEngine | null>(null)

  // 队伍A替补队员（不在首发阵容中的）
  const teamABench = ref<Player[]>([])
  const teamBBench = ref<Player[]>([])
  // 替补上场的队员
  const teamASubIn = ref<Player[]>([])
  const teamBSubIn = ref<Player[]>([])

  // 场地是否交换（A/B侧显示互换）
  const courtSwapped = ref(false)
  // 第3局是否已经自动交换过场地
  const set3Swapped = ref(false)

  // 每局暂停次数：timeoutsA[setIndex] = 已用次数
  const timeoutsA = ref<number[]>([0, 0, 0])
  const timeoutsB = ref<number[]>([0, 0, 0])
  // 最近一次暂停事件（用于同步弹窗）
  const lastTimeout = ref<TimeoutEvent | null>(null)
  // 第3局8分换边事件（用于同步弹窗）
  const pendingSet3Swap = ref<Set3SwapEvent | null>(null)
  // 每局换人次数：subsA[setIndex] = 已用人次
  const subsA = ref<number[]>([0, 0, 0])
  const subsB = ref<number[]>([0, 0, 0])

  // 原始队长ID（比赛开始时设置的队长，用于换人后恢复队长标记）
  const teamAOriginalCaptainId = ref('')
  const teamBOriginalCaptainId = ref('')

  // 每局开始时的首发站位ID（1-5号位顺序），用于记录本局首发队员
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
  const isSetComplete = computed(() => scoringEngine.value?.isSetComplete ?? false)
  const isMatchComplete = computed(() => scoringEngine.value?.isMatchComplete ?? false)
  const canUndo = computed(() => actionHistory.value.length > 0)
  const undoDescription = computed(() => getUndoDescription(actionHistory.value[actionHistory.value.length - 1]))
  const isLive = computed(() => match.value?.status === 'live')

  /** 推送状态快照（替代事件重放） */
  function pushSyncSnapshot() {
    if (syncService.syncEnabled && scoringEngine.value && rotationEngine.value && match.value) {
      const snapshot = takeSnapshot()
      syncService.pushEvent('STATE_UPDATE', { snapshot })
    }
  }

  /** 开始新比赛 */
  function startMatch(
    teamAConfig: TeamConfig,
    teamBConfig: TeamConfig,
    initialServingTeam: TeamSide,
    teamABenchPlayers: Player[],
    teamBBenchPlayers: Player[],
    setCaps?: number[]
  ) {
    match.value = createMatch(teamAConfig, teamBConfig, initialServingTeam)
    match.value.status = 'live'

    scoringEngine.value = new ScoringEngine(initialServingTeam, setCaps)
    rotationEngine.value = new RotationEngine(teamAConfig.startingPositions, teamBConfig.startingPositions)

    teamABench.value = [...teamABenchPlayers]
    teamBBench.value = [...teamBBenchPlayers]
    courtSwapped.value = false
    set3Swapped.value = false
    lastTimeout.value = null
    pendingSet3Swap.value = null
    timeoutsA.value = [0, 0, 0]
    timeoutsB.value = [0, 0, 0]
    subsA.value = [0, 0, 0]
    subsB.value = [0, 0, 0]
    currentSetStartingA.value = [...teamAConfig.startingPositions]
    currentSetStartingB.value = [...teamBConfig.startingPositions]
    teamASubIn.value = []
    teamBSubIn.value = []
    setBreakEndTime.value = null
    actionHistory.value = []

    // 记录原始队长ID
    const captainA = teamAConfig.players.find(p => p.isCaptain)
    teamAOriginalCaptainId.value = captainA?.id ?? ''
    const captainB = teamBConfig.players.find(p => p.isCaptain)
    teamBOriginalCaptainId.value = captainB?.id ?? ''

    pushSyncSnapshot()
  }

  /** 得分 */
  function scorePoint(team: TeamSide) {
    if (!scoringEngine.value || !rotationEngine.value) return

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
      // 局结束时不推快照，等调用方处理完（如交换场地）后统一推送
      return
    }

    // 每得一分轮转，但局结束时不轮转（局间会重新设置站位）
    if (!scoringEngine.value.isSetComplete) {
      rotationEngine.value.rotate(team)
    }

    actionHistory.value.push({ type: 'score', team })
    pushSyncSnapshot()
  }

  /** 捕获某队本局首发和替补队员信息 */
  function captureSetPlayers(team: TeamSide): SetPlayerInfo {
    const startingIds = team === 'A' ? currentSetStartingA.value : currentSetStartingB.value
    const allPlayers = team === 'A' ? match.value!.teamA.players : match.value!.teamB.players
    const startingPlayers = startingIds.map(playerId => {
      const p = allPlayers.find(p => p.id === playerId)
      return p ?? { id: playerId, name: '?', number: '' }
    })
    const subInList = team === 'A' ? teamASubIn.value : teamBSubIn.value
    return {
      startingPlayers,
      subPlayers: [...subInList]
    }
  }

  /** 撤销上一次操作 */
  function undoAction() {
    if (actionHistory.value.length === 0) return
    const action = actionHistory.value.pop()!

    if (action.type === 'score') {
      undoScoreAction()
    } else if (action.type === 'timeout') {
      undoTimeoutAction(action)
    } else if (action.type === 'substitution') {
      undoSubstitutionAction(action)
    }

    pushSyncSnapshot()
  }

  /** 撤销得分 */
  function undoScoreAction() {
    if (!scoringEngine.value || !rotationEngine.value) return
    if (scoringEngine.value.pointHistory.length === 0) return

    const lastTeam = scoringEngine.value.pointHistory[scoringEngine.value.pointHistory.length - 1].team
    scoringEngine.value.undoPoint()
    rotationEngine.value.undoRotation(lastTeam)
  }

  /** 撤销暂停 */
  function undoTimeoutAction(action: Extract<MatchAction, { type: 'timeout' }>) {
    const timeouts = action.team === 'A' ? timeoutsA.value : timeoutsB.value
    timeouts[action.setIndex]--
    lastTimeout.value = action.previousLastTimeout
  }

  /** 撤销换人 */
  function undoSubstitutionAction(action: Extract<MatchAction, { type: 'substitution' }>) {
    if (!rotationEngine.value || !scoringEngine.value) return

    // 1. 撤销引擎中的换人
    rotationEngine.value.undoSubstitution()

    // 2. 减少换人次数
    const subs = action.team === 'A' ? subsA.value : subsB.value
    subs[action.setIndex]--

    const teamPlayers = action.team === 'A' ? match.value!.teamA.players : match.value!.teamB.players
    const bench = action.team === 'A' ? teamABench.value : teamBBench.value
    const subInList = action.team === 'A' ? teamASubIn.value : teamBSubIn.value

    // 3. 如果换上队员之前不在队伍中，从队伍中移除
    if (!action.wasPlayerInOnTeam && action.playerIn) {
      const idx = teamPlayers.findIndex(p => p.id === action.playerInId)
      if (idx !== -1) teamPlayers.splice(idx, 1)
    }

    // 4. 从替补席移除被换下的队员（换人时加入的）
    const benchOutIdx = bench.findIndex(p => p.id === action.playerOutId)
    if (benchOutIdx !== -1) bench.splice(benchOutIdx, 1)

    // 5. 如果换上队员之前在替补席，恢复
    if (action.wasPlayerInOnBench && action.playerIn) {
      bench.push(action.playerIn)
    }

    // 6. 从替补上场记录中移除
    const subInIdx = subInList.findIndex(p => p.id === action.playerInId)
    if (subInIdx !== -1) subInList.splice(subInIdx, 1)

    // 7. 恢复队长标记
    teamPlayers.forEach(p => {
      p.isCaptain = action.captainStateBefore.includes(p.id)
    })
  }

  /** 进入下一局 */
  function nextSet(servingTeam?: TeamSide) {
    if (!scoringEngine.value) return
    scoringEngine.value.nextSet(servingTeam)
    // 保存下一局首发站位（setNextSetPositions已更新rotationEngine）
    if (rotationEngine.value) {
      currentSetStartingA.value = [...rotationEngine.value.getRotation('A')]
      currentSetStartingB.value = [...rotationEngine.value.getRotation('B')]
    }
    // 重置本局替补上场记录
    teamASubIn.value = []
    teamBSubIn.value = []
    // 清除局间休息结束时间
    setBreakEndTime.value = null
    // 新一局清空操作历史
    actionHistory.value = []

    pushSyncSnapshot()
  }

  /** 设置下一局首发站位（不推快照，由调用方统一推送） */
  function setNextSetPositions(team: TeamSide, positionPlayerIds: string[]) {
    if (!rotationEngine.value) return
    rotationEngine.value.resetPositions(team, positionPlayerIds)
  }

  /** 设置下一局封顶分数 */
  function setNextSetCap(cap: number) {
    if (!scoringEngine.value) return
    const setIndex = scoringEngine.value.currentSet
    scoringEngine.value.setCap(setIndex, cap)

    pushSyncSnapshot()
  }

  /** 交换场地 */
  function swapCourts() {
    courtSwapped.value = !courtSwapped.value

    pushSyncSnapshot()
  }

  /** 检查第3局8分自动换边 */
  function checkSet3Swap() {
    if (!scoringEngine.value) return false
    if (scoringEngine.value.currentSet !== 3 || set3Swapped.value) return false
    if (scoringEngine.value.scoreA >= 8 || scoringEngine.value.scoreB >= 8) {
      courtSwapped.value = !courtSwapped.value
      set3Swapped.value = true
      pushSyncSnapshot()
      return true
    }
    return false
  }

  /** 设置局间休息结束时间 */
  function setSetBreakEndTime(endTime: number | null) {
    setBreakEndTime.value = endTime
    pushSyncSnapshot()
  }

  /** 获取上一局接发球方（用于下一局先发球） */
  function getPreviousReceiver(): TeamSide {
    if (!scoringEngine.value) return 'B'
    return scoringEngine.value.servingTeam === 'A' ? 'B' : 'A'
  }

  /** 换人 */
  function substitute(team: TeamSide, playerOutId: string, playerInId: string, playerIn?: Player): { success: boolean; captainReplaced?: boolean; originalCaptainRestored?: boolean } {
    if (!rotationEngine.value || !scoringEngine.value) return { success: false }

    const setIndex = scoringEngine.value.currentSet - 1
    const subs = team === 'A' ? subsA.value : subsB.value
    if (subs[setIndex] >= 5) return { success: false }

    // 换人前捕获状态用于撤销
    const teamPlayers = team === 'A' ? match.value!.teamA.players : match.value!.teamB.players
    const bench = team === 'A' ? teamABench.value : teamBBench.value
    const subInList = team === 'A' ? teamASubIn.value : teamBSubIn.value
    const captainStateBefore = teamPlayers.filter(p => p.isCaptain).map(p => p.id)
    const wasPlayerInOnBench = bench.findIndex(p => p.id === playerInId) !== -1
    const wasPlayerInOnTeam = !!teamPlayers.find(p => p.id === playerInId)

    const success = rotationEngine.value.substitute(team, playerOutId, playerInId, scoringEngine.value.currentSet)
    if (!success) return { success: false }

    subs[setIndex]++

    // 将换上队员加入场上队员列表
    if (!teamPlayers.find(p => p.id === playerInId) && playerIn) {
      teamPlayers.push(playerIn)
    }

    // 被换下的队员加入替补席
    const playerOut = teamPlayers.find(p => p.id === playerOutId)

    // 检查被换下的是否是队长
    const origCapId = team === 'A' ? teamAOriginalCaptainId.value : teamBOriginalCaptainId.value
    const captainReplaced = playerOut?.isCaptain || playerOutId === origCapId

    // 检查换上的是否是原始队长（自动恢复队长标记）
    let originalCaptainRestored = false
    if (playerInId === origCapId) {
      teamPlayers.forEach(p => { p.isCaptain = (p.id === playerInId) })
      originalCaptainRestored = true
    }

    if (playerOut && !bench.find(p => p.id === playerOutId)) {
      bench.push(playerOut)
    }

    // 换上队员从替补席移除（如果已在替补席中）
    const benchInIdx = bench.findIndex(p => p.id === playerInId)
    if (benchInIdx !== -1) {
      bench.splice(benchInIdx, 1)
    }

    // 换上队员记录为替补上场
    if (playerIn && !subInList.find(p => p.id === playerInId)) {
      subInList.push(playerIn)
    }

    actionHistory.value.push({
      type: 'substitution',
      team,
      playerOutId,
      playerInId,
      playerIn,
      setIndex,
      captainStateBefore,
      wasPlayerInOnBench,
      wasPlayerInOnTeam
    })

    pushSyncSnapshot()

    return { success: true, captainReplaced, originalCaptainRestored }
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
    match.value.teamASubPlayers = [...teamASubIn.value]
    match.value.teamBSubPlayers = [...teamBSubIn.value]

    pushSyncSnapshot()
  }

  /** 获取轮转站位 */
  function getRotation(team: TeamSide): string[] {
    return rotationEngine.value?.getRotation(team) ?? []
  }

  /** 获取发球队员 */
  function getServer(team: TeamSide): string {
    return rotationEngine.value?.getServer(team) ?? ''
  }

  /** 获取前排队员 */
  function getFrontRow(team: TeamSide): string[] {
    return rotationEngine.value?.getFrontRow(team) ?? []
  }

  /** 获取后排队员 */
  function getBackRow(team: TeamSide): string[] {
    return rotationEngine.value?.getBackRow(team) ?? []
  }

  /** 预览下次轮转 */
  function previewRotation(team: TeamSide): string[] {
    return rotationEngine.value?.previewRotation(team) ?? []
  }

  /** 获取队员信息 */
  function getPlayer(playerId: string): Player | undefined {
    if (!match.value) return undefined
    return match.value.teamA.players.find(p => p.id === playerId)
      ?? match.value.teamB.players.find(p => p.id === playerId)
  }

  /** 获取替补列表 */
  function getBench(team: TeamSide): Player[] {
    return team === 'A' ? teamABench.value : teamBBench.value
  }

  /** 暂停 */
  function callTimeout(team: TeamSide): boolean {
    if (!scoringEngine.value) return false
    const setIndex = scoringEngine.value.currentSet - 1
    const timeouts = team === 'A' ? timeoutsA.value : timeoutsB.value
    if (timeouts[setIndex] >= 2) return false

    const previousLastTimeout = lastTimeout.value ? { ...lastTimeout.value } : null
    timeouts[setIndex]++
    lastTimeout.value = { team, timestamp: Date.now() }

    actionHistory.value.push({ type: 'timeout', team, setIndex, previousLastTimeout })
    pushSyncSnapshot()
    return true
  }

  /** 清除暂停事件（关闭暂停弹窗时调用） */
  function clearLastTimeout() {
    lastTimeout.value = null
    pushSyncSnapshot()
  }

  /** 设置第3局8分换边事件（弹窗前调用） */
  function setPendingSet3Swap() {
    pendingSet3Swap.value = { timestamp: Date.now() }
    pushSyncSnapshot()
  }

  /** 确认第3局8分换边（一次性完成，只推一次快照） */
  function confirmSet3Swap() {
    courtSwapped.value = !courtSwapped.value
    set3Swapped.value = true
    pendingSet3Swap.value = null
    pushSyncSnapshot()
  }

  /** 获取当前局暂停次数 */
  function getTimeouts(team: TeamSide): number {
    if (!scoringEngine.value) return 0
    const setIndex = scoringEngine.value.currentSet - 1
    const timeouts = team === 'A' ? timeoutsA.value : timeoutsB.value
    return timeouts[setIndex]
  }

  /** 获取当前局换人次数 */
  function getSubs(team: TeamSide): number {
    if (!scoringEngine.value) return 0
    const setIndex = scoringEngine.value.currentSet - 1
    const subs = team === 'A' ? subsA.value : subsB.value
    return subs[setIndex]
  }

  /** 重置比赛 */
  function resetMatch() {
    match.value = null
    scoringEngine.value = null
    rotationEngine.value = null
    teamABench.value = []
    teamBBench.value = []
    courtSwapped.value = false
    set3Swapped.value = false
    lastTimeout.value = null
    pendingSet3Swap.value = null
    timeoutsA.value = [0, 0, 0]
    timeoutsB.value = [0, 0, 0]
    subsA.value = [0, 0, 0]
    subsB.value = [0, 0, 0]
    currentSetStartingA.value = []
    currentSetStartingB.value = []
    teamASubIn.value = []
    teamBSubIn.value = []
    setBreakEndTime.value = null
    actionHistory.value = []
  }

  /** 应用远程事件 - 现在只处理 STATE_UPDATE（状态快照同步） */
  function applyRemoteEvent(event: SyncEvent) {
    const { type, payload } = event

    if (type === 'STATE_UPDATE' && payload.snapshot) {
      loadSnapshot(payload.snapshot as MatchStateSnapshot)
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
        config.teamABenchPlayers,
        config.teamBBenchPlayers,
        config.setCaps
      )
    }
  }

  /** 生成状态快照 */
  function takeSnapshot(): MatchStateSnapshot {
    return {
      scoringState: scoringEngine.value!.getState(),
      rotationState: rotationEngine.value!.getState(),
      match: JSON.parse(JSON.stringify(match.value!)),
      courtSwapped: courtSwapped.value,
      set3Swapped: set3Swapped.value,
      timeoutsA: [...timeoutsA.value],
      timeoutsB: [...timeoutsB.value],
      subsA: [...subsA.value],
      subsB: [...subsB.value],
      teamABench: [...teamABench.value],
      teamBBench: [...teamBBench.value],
      teamASubIn: [...teamASubIn.value],
      teamBSubIn: [...teamBSubIn.value],
      currentSetStartingA: [...currentSetStartingA.value],
      currentSetStartingB: [...currentSetStartingB.value],
      lastTimeout: lastTimeout.value ? { ...lastTimeout.value } : null,
      pendingSet3Swap: pendingSet3Swap.value ? { ...pendingSet3Swap.value } : null,
      setBreakEndTime: setBreakEndTime.value,
      actionHistory: [...actionHistory.value],
      teamAOriginalCaptainId: teamAOriginalCaptainId.value,
      teamBOriginalCaptainId: teamBOriginalCaptainId.value
    }
  }

  /** 从快照恢复状态 */
  function loadSnapshot(snapshot: MatchStateSnapshot) {
    // 恢复引擎
    const engine = new ScoringEngine(snapshot.scoringState.servingTeam, snapshot.scoringState.setCaps)
    engine.setState(snapshot.scoringState)
    scoringEngine.value = engine

    const rotEngine = new RotationEngine(
      snapshot.rotationState.teamA.positions,
      snapshot.rotationState.teamB.positions
    )
    rotEngine.setState(snapshot.rotationState)
    rotationEngine.value = rotEngine

    // 恢复 match 对象
    match.value = JSON.parse(JSON.stringify(snapshot.match))

    // 恢复所有 ref
    courtSwapped.value = snapshot.courtSwapped
    set3Swapped.value = snapshot.set3Swapped
    timeoutsA.value = [...snapshot.timeoutsA]
    timeoutsB.value = [...snapshot.timeoutsB]
    subsA.value = [...snapshot.subsA]
    subsB.value = [...snapshot.subsB]
    teamABench.value = [...snapshot.teamABench]
    teamBBench.value = [...snapshot.teamBBench]
    teamASubIn.value = [...snapshot.teamASubIn]
    teamBSubIn.value = [...snapshot.teamBSubIn]
    currentSetStartingA.value = [...snapshot.currentSetStartingA]
    currentSetStartingB.value = [...snapshot.currentSetStartingB]
    lastTimeout.value = snapshot.lastTimeout ? { ...snapshot.lastTimeout } : null
    pendingSet3Swap.value = snapshot.pendingSet3Swap ? { ...snapshot.pendingSet3Swap } : null
    setBreakEndTime.value = (snapshot as any).setBreakEndTime ?? null
    actionHistory.value = [...(snapshot.actionHistory ?? [])]
    // 恢复原始队长ID（用于换人后自动恢复队长标记）
    teamAOriginalCaptainId.value = (snapshot as any).teamAOriginalCaptainId ?? ''
    teamBOriginalCaptainId.value = (snapshot as any).teamBOriginalCaptainId ?? ''
  }

  return {
    match,
    scoringEngine,
    rotationEngine,
    scoreA,
    scoreB,
    currentSet,
    setsWonA,
    setsWonB,
    servingTeam,
    isSetComplete,
    isMatchComplete,
    canUndo,
    undoDescription,
    isLive,
    courtSwapped,
    set3Swapped,
    lastTimeout,
    pendingSet3Swap,
    setBreakEndTime,
    startMatch,
    scorePoint,
    undoAction,
    nextSet,
    setNextSetPositions,
    setNextSetCap,
    swapCourts,
    checkSet3Swap,
    getPreviousReceiver,
    substitute,
    completeMatch,
    getRotation,
    getServer,
    getFrontRow,
    getBackRow,
    previewRotation,
    getPlayer,
    getBench,
    callTimeout,
    clearLastTimeout,
    setPendingSet3Swap,
    confirmSet3Swap,
    setSetBreakEndTime,
    getTimeouts,
    getSubs,
    resetMatch,
    applyRemoteEvent,
    pushSyncSnapshot,
    takeSnapshot,
    loadSnapshot
  }
})