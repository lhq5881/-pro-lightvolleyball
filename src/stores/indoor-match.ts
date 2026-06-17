import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { IndoorScoringEngine, type TeamSide } from '@/engine/indoor-scoring-engine'
import { IndoorRotationEngine } from '@/engine/indoor-rotation-engine'
import type { Player, TeamConfig, Match, SetPlayerInfo } from '@/models/match'
import { createMatch } from '@/models/match'
import type { SyncEvent, MatchStateSnapshot, MatchConfig, TimeoutEvent, Set3SwapEvent } from '@/services/sync-types'
import { syncService } from '@/services/sync-service'
import { useSyncStore } from '@/stores/sync'
import type { MatchAction } from '@/engine/action-history'
import { getUndoDescription } from '@/engine/action-history'

export const useIndoorMatchStore = defineStore('indoorMatch', () => {
  // 比赛配置
  const match = ref<Match | null>(null)
  const scoringEngine = ref<IndoorScoringEngine | null>(null)
  const rotationEngine = ref<IndoorRotationEngine | null>(null)
  const totalSets = ref(3) // 总局数：3或5

  // 自由人号码（每队最多2名）
  const teamALibero1 = ref('')
  const teamALibero2 = ref('')
  const teamBLibero1 = ref('')
  const teamBLibero2 = ref('')

  // 自由人替换记录：记录每个自由人当前替换的是谁
  // { liberoNumber: replacedPlayerId }
  const teamALiberoReplacements = ref<Record<string, string>>({})
  const teamBLiberoReplacements = ref<Record<string, string>>({})

  // 用于触发 rotation 响应式更新的版本号
  const rotationVersion = ref(0)

  // 队伍A替补队员（不在首发阵容中的）
  const teamABench = ref<Player[]>([])
  const teamBBench = ref<Player[]>([])
  // 替补上场的队员
  const teamASubIn = ref<Player[]>([])
  const teamBSubIn = ref<Player[]>([])

  // 场地是否交换（A/B侧显示互换）
  const courtSwapped = ref(false)
  // 第5局是否已经自动交换过场地
  const set5Swapped = ref(false)

  // 每局暂停次数：timeoutsA[setIndex] = 已用次数
  const timeoutsA = ref<number[]>([0, 0, 0, 0, 0])
  const timeoutsB = ref<number[]>([0, 0, 0, 0, 0])
  // 最近一次暂停事件（用于同步弹窗）
  const lastTimeout = ref<TimeoutEvent | null>(null)
  // 决胜局8分换边事件（用于同步弹窗）
  const pendingSet5Swap = ref<Set3SwapEvent | null>(null)
  // 每局换人次数：subsA[setIndex] = 已用人次
  const subsA = ref<number[]>([0, 0, 0, 0, 0])
  const subsB = ref<number[]>([0, 0, 0, 0, 0])

  // 原始队长ID（比赛开始时设置的队长，用于换人后恢复队长标记）
  const teamAOriginalCaptainId = ref('')
  const teamBOriginalCaptainId = ref('')

  // 每局开始时的首发站位ID（1-6号位顺序），用于记录本局首发队员
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

  /** 开始新比赛 */
  function startMatch(
    teamAConfig: TeamConfig,
    teamBConfig: TeamConfig,
    initialServingTeam: TeamSide,
    sets: 3 | 5 = 3,
    teamABenchPlayers: Player[] = [],
    teamBBenchPlayers: Player[] = []
  ) {
    totalSets.value = sets
    match.value = createMatch(teamAConfig, teamBConfig, initialServingTeam)
    match.value.status = 'live'

    scoringEngine.value = new IndoorScoringEngine(initialServingTeam, sets)
    rotationEngine.value = new IndoorRotationEngine(teamAConfig.startingPositions, teamBConfig.startingPositions)

    teamABench.value = [...teamABenchPlayers]
    teamBBench.value = [...teamBBenchPlayers]
    courtSwapped.value = false
    set5Swapped.value = false
    timeoutsA.value = [0, 0, 0, 0, 0]
    timeoutsB.value = [0, 0, 0, 0, 0]
    subsA.value = [0, 0, 0, 0, 0]
    subsB.value = [0, 0, 0, 0, 0]
    currentSetStartingA.value = [...teamAConfig.startingPositions]
    currentSetStartingB.value = [...teamBConfig.startingPositions]
    teamASubIn.value = []
    teamBSubIn.value = []
    actionHistory.value = []

    // 记录原始队长ID
    const captainA = teamAConfig.players.find(p => p.isCaptain)
    teamAOriginalCaptainId.value = captainA?.id ?? ''
    const captainB = teamBConfig.players.find(p => p.isCaptain)
    teamBOriginalCaptainId.value = captainB?.id ?? ''
  }

  /** 得分 */
  function scorePoint(team: TeamSide) {
    if (!scoringEngine.value || !rotationEngine.value) return

    const wasSetComplete = scoringEngine.value.isSetComplete

    // 室内排球：接发球方得分时，先轮转再获得发球权
    // 发球方得分不轮转，继续发球
    const willGainServe = team !== scoringEngine.value.servingTeam
    if (!wasSetComplete && willGainServe) {
      // 接发球方得分，先轮转
      rotationEngine.value.rotate(team)
      rotationVersion.value++
    }

    scoringEngine.value.scorePoint(team)

    // 保存自动自由人轮转前的状态
    const prevPositionsA = [...rotationEngine.value!.getRotation('A')]
    const prevPositionsB = [...rotationEngine.value!.getRotation('B')]
    const prevReplacementsA = { ...teamALiberoReplacements.value }
    const prevReplacementsB = { ...teamBLiberoReplacements.value }
    const captainBefore = match.value
      ? [...match.value.teamA.players, ...match.value.teamB.players].filter(p => p.isCaptain).map(p => p.id)
      : []

    // 检查自由人是否轮转到前排，如果是则自动换下
    checkLiberoFrontRow('A')
    checkLiberoFrontRow('B')

    // 检测自由人自动轮转是否发生
    const positionsChanged =
      JSON.stringify(prevPositionsA) !== JSON.stringify(rotationEngine.value!.getRotation('A')) ||
      JSON.stringify(prevPositionsB) !== JSON.stringify(rotationEngine.value!.getRotation('B'))

    const action: MatchAction = { type: 'score', team }
    if (positionsChanged) {
      action.previousPositions = [...prevPositionsA, ...prevPositionsB]
      action.previousLiberoReplacements = { A: prevReplacementsA, B: prevReplacementsB } as any
      action.captainStateBefore = captainBefore
    }

    // 局结束时，记录本局人员信息到setResults
    if (!wasSetComplete && scoringEngine.value.isSetComplete) {
      const lastResult = scoringEngine.value.setResults[scoringEngine.value.setResults.length - 1]
      if (lastResult && match.value) {
        lastResult.teamAPlayers = captureSetPlayers('A')
        lastResult.teamBPlayers = captureSetPlayers('B')
      }
      actionHistory.value.push(action)
      return
    }

    // 检查决胜局8分换边（不自动换边，只设置标志让UI显示弹窗）
    checkAndSetPendingSet5Swap()

    actionHistory.value.push(action)
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
      undoScoreAction(action)
    } else if (action.type === 'timeout') {
      undoTimeoutAction(action)
    } else if (action.type === 'substitution') {
      undoSubstitutionAction(action)
    } else if (action.type === 'libero_swap') {
      undoLiberoSwapAction(action)
    }

    pushSyncSnapshot()
  }

  /** 撤销得分（含自动自由人轮转） */
  function undoScoreAction(action: Extract<MatchAction, { type: 'score' }>) {
    if (!scoringEngine.value || !rotationEngine.value) return
    if (scoringEngine.value.pointHistory.length === 0) return

    const lastTeam = scoringEngine.value.pointHistory[scoringEngine.value.pointHistory.length - 1].team
    const currentServer = scoringEngine.value.servingTeam

    if (lastTeam === currentServer) {
      rotationEngine.value.undoRotation(lastTeam)
      rotationVersion.value++
    }

    scoringEngine.value.undoPoint()

    // 恢复自动自由人轮转状态
    if (action.previousPositions) {
      const posA = action.previousPositions.slice(0, 6)
      const posB = action.previousPositions.slice(6)
      rotationEngine.value.setPositions('A', posA)
      rotationEngine.value.setPositions('B', posB)
      rotationVersion.value++
    }
    if (action.previousLiberoReplacements) {
      const rep = action.previousLiberoReplacements as any
      teamALiberoReplacements.value = { ...rep.A }
      teamBLiberoReplacements.value = { ...rep.B }
    }
    if (action.captainStateBefore && match.value) {
      const teamPlayers = [...match.value.teamA.players, ...match.value.teamB.players]
      teamPlayers.forEach(p => {
        p.isCaptain = action.captainStateBefore!.includes(p.id)
      })
    }
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

    rotationEngine.value.undoSubstitution()
    rotationVersion.value++

    const subs = action.team === 'A' ? subsA.value : subsB.value
    subs[action.setIndex]--

    const teamPlayers = action.team === 'A' ? match.value!.teamA.players : match.value!.teamB.players
    const bench = action.team === 'A' ? teamABench.value : teamBBench.value
    const subInList = action.team === 'A' ? teamASubIn.value : teamBSubIn.value

    if (!action.wasPlayerInOnTeam && action.playerIn) {
      const idx = teamPlayers.findIndex(p => p.id === action.playerInId)
      if (idx !== -1) teamPlayers.splice(idx, 1)
    }

    const benchOutIdx = bench.findIndex(p => p.id === action.playerOutId)
    if (benchOutIdx !== -1) bench.splice(benchOutIdx, 1)

    if (action.wasPlayerInOnBench && action.playerIn) {
      bench.push(action.playerIn)
    }

    const subInIdx = subInList.findIndex(p => p.id === action.playerInId)
    if (subInIdx !== -1) subInList.splice(subInIdx, 1)

    teamPlayers.forEach(p => {
      p.isCaptain = action.captainStateBefore.includes(p.id)
    })
  }

  /** 撤销自由人替换 */
  function undoLiberoSwapAction(action: Extract<MatchAction, { type: 'libero_swap' }>) {
    if (!rotationEngine.value || !match.value) return

    rotationEngine.value.setPositions(action.team, action.previousPositions)
    rotationVersion.value++

    if (action.team === 'A') {
      teamALiberoReplacements.value = { ...action.previousLiberoReplacements }
    } else {
      teamBLiberoReplacements.value = { ...action.previousLiberoReplacements }
    }

    const teamPlayers = action.team === 'A'
      ? match.value!.teamA.players
      : match.value!.teamB.players
    teamPlayers.forEach(p => {
      p.isCaptain = action.captainStateBefore.includes(p.id)
    })
  }

  /** 进入下一局 */
  function nextSet(servingTeam?: TeamSide) {
    if (!scoringEngine.value) return
    scoringEngine.value.nextSet(servingTeam)
    // 保存下一局首发站位
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

  /** 设置下一局首发站位 */
  function setNextSetPositions(team: TeamSide, positionPlayerIds: string[]) {
    if (!rotationEngine.value) return
    rotationEngine.value.resetPositions(team, positionPlayerIds)
    rotationVersion.value++
  }

  /** 交换场地 */
  function swapCourts() {
    courtSwapped.value = !courtSwapped.value
    pushSyncSnapshot()
  }

  /** 检查决胜局8分是否需要换边（只设置标志，不自动换边） */
  function checkAndSetPendingSet5Swap(): boolean {
    if (!scoringEngine.value) return false
    // 只有决胜局（最后一局）需要8分换边
    const decidingSet = totalSets.value // 3局2胜制决胜局是第3局，5局3胜制决胜局是第5局
    if (scoringEngine.value.currentSet !== decidingSet || set5Swapped.value) return false
    // 任一队伍先到8分时换边
    if ((scoringEngine.value.scoreA >= 8 || scoringEngine.value.scoreB >= 8) && !pendingSet5Swap.value) {
      // 设置标志让UI显示弹窗
      pendingSet5Swap.value = { timestamp: Date.now() }
      pushSyncSnapshot()
      return true
    }
    return false
  }

  /** 检查自由人是否在前排，如果是则自动换下 */
  function checkLiberoFrontRow(team: TeamSide) {
    if (!rotationEngine.value) return

    const state = team === 'A' ? rotationEngine.value.getRotation('A') : rotationEngine.value.getRotation('B')
    const teamPlayers = team === 'A' ? match.value!.teamA.players : match.value!.teamB.players
    const libero1 = team === 'A' ? teamALibero1.value : teamBLibero1.value
    const libero2 = team === 'A' ? teamALibero2.value : teamBLibero2.value
    const replacements = team === 'A' ? teamALiberoReplacements.value : teamBLiberoReplacements.value

    // 前排位置索引：2号位(1)、3号位(2)、4号位(3)
    const frontRowIndices = [1, 2, 3]

    for (const liberoNumber of [libero1, libero2]) {
      if (!liberoNumber) continue

      const liberoPlayer = teamPlayers.find(p => p.number === liberoNumber)
      if (!liberoPlayer) continue

      const liberoPosIndex = state.indexOf(liberoPlayer.id)
      if (liberoPosIndex === -1) continue

      // 检查自由人是否在前排
      if (frontRowIndices.includes(liberoPosIndex)) {
        // 自由人在前排，需要将其换下
        const originalPlayerId = replacements[liberoNumber]
        if (originalPlayerId) {
          // 找到原始球员替换自由人
          const newPositions = [...state]
          newPositions[liberoPosIndex] = originalPlayerId

          if (team === 'A') {
            rotationEngine.value.setPositions('A', newPositions)
            const newReplacements = { ...teamALiberoReplacements.value }
            delete newReplacements[liberoNumber]
            teamALiberoReplacements.value = newReplacements
          } else {
            rotationEngine.value.setPositions('B', newPositions)
            const newReplacements = { ...teamBLiberoReplacements.value }
            delete newReplacements[liberoNumber]
            teamBLiberoReplacements.value = newReplacements
          }
          rotationVersion.value++
        }
      }
    }
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

  /** 换人 */
  function substitute(team: TeamSide, playerOutId: string, playerInId: string, playerIn?: Player): { success: boolean; captainReplaced?: boolean; originalCaptainRestored?: boolean } {
    if (!rotationEngine.value || !scoringEngine.value) return { success: false }

    const setIndex = scoringEngine.value.currentSet - 1
    const subs = team === 'A' ? subsA.value : subsB.value
    if (subs[setIndex] >= 6) return { success: false }

    // 换人前捕获状态用于撤销
    const teamPlayers = team === 'A' ? match.value!.teamA.players : match.value!.teamB.players
    const bench = team === 'A' ? teamABench.value : teamBBench.value
    const subInList = team === 'A' ? teamASubIn.value : teamBSubIn.value
    const captainStateBefore = teamPlayers.filter(p => p.isCaptain).map(p => p.id)
    const wasPlayerInOnBench = bench.findIndex(p => p.id === playerInId) !== -1
    const wasPlayerInOnTeam = !!teamPlayers.find(p => p.id === playerInId)

    const success = rotationEngine.value.substitute(team, playerOutId, playerInId, scoringEngine.value.currentSet)
    if (!success) return { success: false }
    rotationVersion.value++

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

    const benchInIdx = bench.findIndex(p => p.id === playerInId)
    if (benchInIdx !== -1) {
      bench.splice(benchInIdx, 1)
    }

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
  }

  /** 获取轮转站位 */
  function getRotation(team: TeamSide): string[] {
    // 依赖 rotationVersion 以触发响应式更新
    rotationVersion.value
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

  /** 清除暂停弹窗 */
  function clearLastTimeout() {
    lastTimeout.value = null
    pushSyncSnapshot()
  }

  /** 设置决胜局8分换边事件 */
  function setPendingSet5Swap() {
    pendingSet5Swap.value = { timestamp: Date.now() }
    pushSyncSnapshot()
  }

  /** 确认决胜局8分换边（一次性完成，只推一次快照） */
  function confirmSet5Swap() {
    courtSwapped.value = !courtSwapped.value
    set5Swapped.value = true
    pendingSet5Swap.value = null
    if (scoringEngine.value) scoringEngine.value.confirmSet5Swap()
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
    set5Swapped.value = false
    timeoutsA.value = [0, 0, 0, 0, 0]
    timeoutsB.value = [0, 0, 0, 0, 0]
    subsA.value = [0, 0, 0, 0, 0]
    subsB.value = [0, 0, 0, 0, 0]
    currentSetStartingA.value = []
    currentSetStartingB.value = []
    teamASubIn.value = []
    teamBSubIn.value = []
    setBreakEndTime.value = null
    actionHistory.value = []
  }

  /** 推送状态快照 */
  function pushSyncSnapshot() {
    const syncStore = useSyncStore()
    console.log('[IndoorMatch] pushSyncSnapshot called')
    console.log('[IndoorMatch] syncEnabled:', syncService.syncEnabled)
    console.log('[IndoorMatch] syncStore.status:', syncStore.status)
    console.log('[IndoorMatch] scoringEngine:', !!scoringEngine.value)
    console.log('[IndoorMatch] rotationEngine:', !!rotationEngine.value)
    console.log('[IndoorMatch] match:', !!match.value)
    if (syncService.syncEnabled && scoringEngine.value && rotationEngine.value && match.value) {
      const snapshot = takeSnapshot()
      console.log('[IndoorMatch] 推送 STATE_UPDATE 事件')
      syncService.pushEvent('STATE_UPDATE', { snapshot })
    }
  }

  /** 应用远程事件 */
  function applyRemoteEvent(event: SyncEvent) {
    const { type, payload } = event
    console.log('[IndoorMatch] applyRemoteEvent, type:', type, 'payload:', payload)

    if (type === 'STATE_UPDATE' && payload.snapshot) {
      console.log('[IndoorMatch] 调用 loadSnapshot')
      loadSnapshot(payload.snapshot as MatchStateSnapshot)
      return
    }

    // START_MATCH 事件用于加入者端首次接收比赛配置
    if (type === 'START_MATCH' && payload.matchConfig) {
      console.log('[IndoorMatch] 处理 START_MATCH')
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
        (config as any).totalSets ?? 3,
        config.teamABenchPlayers,
        config.teamBBenchPlayers
      )
    }
  }

  /** 生成状态快照 */
  function takeSnapshot(): MatchStateSnapshot {
    return {
      scoringState: scoringEngine.value!.getState() as any,
      rotationState: rotationEngine.value!.getState(),
      match: JSON.parse(JSON.stringify(match.value!)),
      courtSwapped: courtSwapped.value,
      set3Swapped: set5Swapped.value,
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
      pendingSet3Swap: pendingSet5Swap.value ? { ...pendingSet5Swap.value } : null,
      setBreakEndTime: setBreakEndTime.value,
      actionHistory: [...actionHistory.value]
    }
  }

  /** 从快照恢复状态 */
  function loadSnapshot(snapshot: MatchStateSnapshot) {
    console.log('[IndoorMatch] loadSnapshot, lastTimeout:', snapshot.lastTimeout, 'pendingSet3Swap:', snapshot.pendingSet3Swap)
    // 恢复引擎
    const engine = new IndoorScoringEngine(snapshot.scoringState.servingTeam, (snapshot.scoringState as any).totalSets ?? 3)
    engine.setState(snapshot.scoringState as any)
    scoringEngine.value = engine
    totalSets.value = (snapshot.scoringState as any).totalSets ?? 3

    const rotEngine = new IndoorRotationEngine(
      snapshot.rotationState.teamA.positions,
      snapshot.rotationState.teamB.positions
    )
    rotEngine.setState(snapshot.rotationState)
    rotationEngine.value = rotEngine

    // 恢复 match 对象
    match.value = JSON.parse(JSON.stringify(snapshot.match))

    // 恢复所有 ref
    courtSwapped.value = snapshot.courtSwapped
    set5Swapped.value = snapshot.set3Swapped
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
    pendingSet5Swap.value = snapshot.pendingSet3Swap ? { ...snapshot.pendingSet3Swap } : null
    setBreakEndTime.value = (snapshot as any).setBreakEndTime ?? null
    actionHistory.value = [...(snapshot.actionHistory ?? [])]
    console.log('[IndoorMatch] loadSnapshot done, lastTimeout:', lastTimeout.value, 'pendingSet5Swap:', pendingSet5Swap.value)
  }

  /** 设置自由人号码 */
  function setLiberoNumbers(aLibero1: string, aLibero2: string, bLibero1: string, bLibero2: string) {
    teamALibero1.value = aLibero1
    teamALibero2.value = aLibero2
    teamBLibero1.value = bLibero1
    teamBLibero2.value = bLibero2
  }

  /** 自由人替换：自由人与后排队员互换位置 */
  function liberoSwap(team: TeamSide, backRowPlayerId: string, liberoNumber: string): { success: boolean; captainReplaced?: boolean; originalCaptainRestored?: boolean } {
    if (!rotationEngine.value || !match.value) return { success: false }
    if (!liberoNumber) return { success: false }

    const state = team === 'A' ? rotationEngine.value.getRotation('A') : rotationEngine.value.getRotation('B')
    const backRowPosIndex = state.indexOf(backRowPlayerId)
    if (backRowPosIndex === -1) return { success: false }

    // 检查被替换的是否是后排队员（5、6、1号位 = 索引4、5、0）
    const backRowIndices = [0, 4, 5]
    if (!backRowIndices.includes(backRowPosIndex)) return { success: false }

    // 保存撤销所需的状态（在任何修改之前）
    const previousPositions = [...state]
    const replacements = team === 'A' ? teamALiberoReplacements.value : teamBLiberoReplacements.value
    const previousLiberoReplacements = { ...replacements }
    const teamPlayers = team === 'A' ? match.value!.teamA.players : match.value!.teamB.players
    const captainStateBefore = teamPlayers.filter(p => p.isCaptain).map(p => p.id)

    // 找到或创建自由人球员
    let liberoPlayer = teamPlayers.find(p => p.number === liberoNumber)

    if (!liberoPlayer) {
      liberoPlayer = {
        id: `libero_${team}_${liberoNumber}`,
        name: `自由人${liberoNumber}`,
        number: liberoNumber,
        isCaptain: false
      }
      teamPlayers.push(liberoPlayer)
    }

    const liberoPosIndex = state.indexOf(liberoPlayer.id)

    // 检查被点击的队员是否是自由人（自由人下场）
    const replacedPlayerId = replacements[liberoNumber]
    if (liberoPosIndex !== -1 && replacedPlayerId) {
      const newPositions = [...state]
      newPositions[liberoPosIndex] = replacedPlayerId

      const originalCaptainId = team === 'A' ? teamAOriginalCaptainId.value : teamBOriginalCaptainId.value
      let originalCaptainRestored = false
      if (replacedPlayerId === originalCaptainId) {
        teamPlayers.forEach(p => { p.isCaptain = (p.id === replacedPlayerId) })
        originalCaptainRestored = true
      }

      const newReplacements = { ...replacements }
      delete newReplacements[liberoNumber]
      if (team === 'A') {
        teamALiberoReplacements.value = newReplacements
        rotationEngine.value.setPositions('A', newPositions)
      } else {
        teamBLiberoReplacements.value = newReplacements
        rotationEngine.value.setPositions('B', newPositions)
      }
      rotationVersion.value++

      actionHistory.value.push({
        type: 'libero_swap',
        team,
        liberoNumber,
        previousPositions,
        previousLiberoReplacements,
        captainStateBefore
      })

      pushSyncSnapshot()
      return { success: true, originalCaptainRestored }
    }

    // 检查是否已经有其他自由人在场上
    const libero1 = team === 'A' ? teamALibero1.value : teamBLibero1.value
    const libero2 = team === 'A' ? teamALibero2.value : teamBLibero2.value
    const otherLiberoNumber = liberoNumber === libero1 ? libero2 : libero1

    if (otherLiberoNumber && liberoPosIndex === -1) {
      const otherLiberoPlayer = teamPlayers.find(p => p.number === otherLiberoNumber)
      if (otherLiberoPlayer) {
        const otherLiberoPosIndex = state.indexOf(otherLiberoPlayer.id)
        if (otherLiberoPosIndex !== -1) {
          const otherReplacedPlayerId = replacements[otherLiberoNumber]

          if (otherReplacedPlayerId) {
            const newState = [...state]
            newState[otherLiberoPosIndex] = liberoPlayer.id

            const otherReplacedPlayer = teamPlayers.find(p => p.id === otherReplacedPlayerId)
            const origCapId = team === 'A' ? teamAOriginalCaptainId.value : teamBOriginalCaptainId.value
            const captainReplaced = otherReplacedPlayer?.isCaptain || otherReplacedPlayerId === origCapId

            const newReplacements = { ...replacements }
            delete newReplacements[otherLiberoNumber]
            newReplacements[liberoNumber] = otherReplacedPlayerId
            if (team === 'A') {
              teamALiberoReplacements.value = newReplacements
              rotationEngine.value.setPositions('A', newState)
            } else {
              teamBLiberoReplacements.value = newReplacements
              rotationEngine.value.setPositions('B', newState)
            }
            rotationVersion.value++

            actionHistory.value.push({
              type: 'libero_swap',
              team,
              liberoNumber,
              previousPositions,
              previousLiberoReplacements,
              captainStateBefore
            })

            pushSyncSnapshot()
            return { success: true, captainReplaced }
          }
        }
      }
    }

    // 自由人已经在场上时，不允许再替换其他队员
    if (liberoPosIndex !== -1) {
      return { success: false }
    }

    // 自由人不在场上，直接替换
    const newPositions = [...state]
    newPositions[backRowPosIndex] = liberoPlayer.id

    const replacedPlayer = teamPlayers.find(p => p.id === backRowPlayerId)
    const origCapId = team === 'A' ? teamAOriginalCaptainId.value : teamBOriginalCaptainId.value
    const captainReplaced = replacedPlayer?.isCaptain || backRowPlayerId === origCapId

    if (team === 'A') {
      teamALiberoReplacements.value = { ...replacements, [liberoNumber]: backRowPlayerId }
      rotationEngine.value.setPositions('A', newPositions)
    } else {
      teamBLiberoReplacements.value = { ...replacements, [liberoNumber]: backRowPlayerId }
      rotationEngine.value.setPositions('B', newPositions)
    }
    rotationVersion.value++

    actionHistory.value.push({
      type: 'libero_swap',
      team,
      liberoNumber,
      previousPositions,
      previousLiberoReplacements,
      captainStateBefore
    })

    pushSyncSnapshot()
    return { success: true, captainReplaced }
  }

  return {
    match,
    scoringEngine,
    rotationEngine,
    totalSets,
    teamALibero1,
    teamALibero2,
    teamBLibero1,
    teamBLibero2,
    teamALiberoReplacements,
    teamBLiberoReplacements,
    rotationVersion,
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
    set5Swapped,
    setBreakEndTime,
    lastTimeout,
    pendingSet5Swap,
    startMatch,
    scorePoint,
    undoAction,
    nextSet,
    setNextSetPositions,
    swapCourts,
    getPreviousReceiver,
    substitute,
    liberoSwap,
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
    setPendingSet5Swap,
    confirmSet5Swap,
    setSetBreakEndTime,
    setLiberoNumbers,
    getTimeouts,
    getSubs,
    resetMatch,
    applyRemoteEvent,
    pushSyncSnapshot,
    takeSnapshot,
    loadSnapshot
  }
})