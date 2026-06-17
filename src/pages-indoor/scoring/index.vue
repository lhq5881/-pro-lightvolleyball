<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onHide, onShow, onLoad } from '@dcloudio/uni-app'
import { useIndoorMatchStore } from '@/stores/indoor-match'
import { useHistoryStore } from '@/stores/history'
import { useSettingsStore } from '@/stores/settings'
import { feedbackScore, feedbackSetEnd, feedbackTimeout, playTimeoutSound, playTimeoutEndSound, playSwapCourtSound, playMatchEndSound } from '@/utils/feedback'
import type { TeamSide } from '@/engine/indoor-scoring-engine'
import type { Player } from '@/models/match'

const indoorMatchStore = useIndoorMatchStore()
const historyStore = useHistoryStore()
const settingsStore = useSettingsStore()

// 第一裁判员界面翻转标志
const isFlipped = ref(false)

onLoad((query) => {
  if (query?.flipped === 'true') {
    isFlipped.value = true
  }
})

// 操作端自己处理局结束跳转时设为true，防止watch重复跳转
const localSetComplete = ref(false)

const teamAName = computed(() => indoorMatchStore.match?.teamA.name ?? '队A')
const teamBName = computed(() => indoorMatchStore.match?.teamB.name ?? '队B')
const teamAPlayers = computed(() => indoorMatchStore.match?.teamA.players ?? [])
const teamBPlayers = computed(() => indoorMatchStore.match?.teamB.players ?? [])
const teamARotation = computed(() => indoorMatchStore.getRotation('A'))
const teamBRotation = computed(() => indoorMatchStore.getRotation('B'))
const setResults = computed(() => indoorMatchStore.scoringEngine?.setResults ?? [])

// 场地交换后，左侧显示的队伍和右侧显示的队伍
const leftTeam = computed<TeamSide>(() => {
  const baseTeam = indoorMatchStore.courtSwapped ? 'B' : 'A'
  return isFlipped.value ? (baseTeam === 'A' ? 'B' : 'A') : baseTeam
})
const rightTeam = computed<TeamSide>(() => {
  const baseTeam = indoorMatchStore.courtSwapped ? 'A' : 'B'
  return isFlipped.value ? (baseTeam === 'A' ? 'B' : 'A') : baseTeam
})

const leftTeamName = computed(() => leftTeam.value === 'A' ? teamAName.value : teamBName.value)
const rightTeamName = computed(() => rightTeam.value === 'A' ? teamAName.value : teamBName.value)
const leftTeamPlayers = computed(() => leftTeam.value === 'A' ? teamAPlayers.value : teamBPlayers.value)
const rightTeamPlayers = computed(() => rightTeam.value === 'A' ? teamAPlayers.value : teamBPlayers.value)
const leftTeamRotation = computed(() => leftTeam.value === 'A' ? teamARotation.value : teamBRotation.value)
const rightTeamRotation = computed(() => rightTeam.value === 'A' ? teamARotation.value : teamBRotation.value)
const leftTeamScore = computed(() => leftTeam.value === 'A' ? indoorMatchStore.scoreA : indoorMatchStore.scoreB)
const rightTeamScore = computed(() => rightTeam.value === 'A' ? indoorMatchStore.scoreA : indoorMatchStore.scoreB)
const leftTeamSets = computed(() => leftTeam.value === 'A' ? indoorMatchStore.setsWonA : indoorMatchStore.setsWonB)
const rightTeamSets = computed(() => rightTeam.value === 'A' ? indoorMatchStore.setsWonA : indoorMatchStore.setsWonB)
const leftTeamServing = computed(() => indoorMatchStore.servingTeam === leftTeam.value)
const rightTeamServing = computed(() => indoorMatchStore.servingTeam === rightTeam.value)

// 自由人号码（每队最多2名）
const leftTeamLibero1 = computed(() => leftTeam.value === 'A' ? indoorMatchStore.teamALibero1 : indoorMatchStore.teamBLibero1)
const leftTeamLibero2 = computed(() => leftTeam.value === 'A' ? indoorMatchStore.teamALibero2 : indoorMatchStore.teamBLibero2)
const rightTeamLibero1 = computed(() => rightTeam.value === 'A' ? indoorMatchStore.teamALibero1 : indoorMatchStore.teamBLibero1)
const rightTeamLibero2 = computed(() => rightTeam.value === 'A' ? indoorMatchStore.teamALibero2 : indoorMatchStore.teamBLibero2)

/** 获取底部任务栏显示的号码：
 *  - 初始状态：显示自由人号码（带L前缀）
 *  - 替换后：显示被替换下来的队员号码（不带L前缀）
 *  - 双自由人：一个替换上场后，另一个仍显示自由人号码
 */
function getToolbarNumbers(team: TeamSide): { number: string; isLibero: boolean; liberoNumber: string }[] {
  const rotation = team === leftTeam.value ? leftTeamRotation.value : rightTeamRotation.value
  const players = team === leftTeam.value ? leftTeamPlayers.value : rightTeamPlayers.value
  const libero1 = team === 'A' ? indoorMatchStore.teamALibero1 : indoorMatchStore.teamBLibero1
  const libero2 = team === 'A' ? indoorMatchStore.teamALibero2 : indoorMatchStore.teamBLibero2
  const replacements = team === 'A'
    ? (indoorMatchStore.teamALiberoReplacements || {})
    : (indoorMatchStore.teamBLiberoReplacements || {})

  console.log('[getToolbarNumbers] team:', team, 'libero1:', libero1, 'libero2:', libero2, 'replacements:', replacements)
  console.log('[getToolbarNumbers] rotation:', rotation)
  console.log('[getToolbarNumbers] players:', players.map(p => ({ id: p.id, number: p.number })))

  const result: { number: string; isLibero: boolean; liberoNumber: string }[] = []

  // 检查每个自由人的状态
  for (const liberoNumber of [libero1, libero2]) {
    if (!liberoNumber) continue

    // 在 rotation 中查找是否有球员的号码等于自由人号码（即自由人已在场上）
    const liberoPlayerId = rotation.find(pid => {
      const player = players.find(p => p.id === pid)
      return player && player.number === liberoNumber
    })

    console.log('[getToolbarNumbers] liberoNumber:', liberoNumber, 'liberoPlayerId:', liberoPlayerId)

    if (liberoPlayerId) {
      // 自由人在场上，显示被替换下来的队员号码
      const replacedPlayerId = replacements ? replacements[liberoNumber] : undefined
      console.log('[getToolbarNumbers] replacedPlayerId:', replacedPlayerId)
      if (replacedPlayerId) {
        const replacedPlayer = players.find(p => p.id === replacedPlayerId)
        if (replacedPlayer) {
          result.push({ number: replacedPlayer.number, isLibero: false, liberoNumber })
        }
      }
    } else {
      // 自由人不在场上，显示自由人号码（带L前缀）
      result.push({ number: liberoNumber, isLibero: true, liberoNumber })
    }
  }

  console.log('[getToolbarNumbers] result:', result)

  return result
}

function handleScore(team: TeamSide) {
  if (indoorMatchStore.isMatchComplete) return
  const { soundEnabled, vibrateEnabled } = settingsStore.settings
  indoorMatchStore.scorePoint(team)
  feedbackScore(soundEnabled, vibrateEnabled)
  if (indoorMatchStore.isMatchComplete) {
    localMatchComplete.value = true
    indoorMatchStore.completeMatch()
    historyStore.addMatch(indoorMatchStore.match!)
    uni.reLaunch({ url: '/pages-indoor/match-result/index' })
  } else if (indoorMatchStore.isSetComplete) {
    feedbackSetEnd(soundEnabled, vibrateEnabled)
    handleSetComplete()
  }
}

function handleSetComplete() {
  localSetComplete.value = true
  initBreakData()
  setBreakVisible.value = true
  // 开始局间休息倒计时
  startSetBreakCountdown()
}

function initBreakData() {
  const teamARotation = indoorMatchStore.getRotation('A')
  const teamBRotation = indoorMatchStore.getRotation('B')
  for (let i = 0; i < 6; i++) {
    const aPlayer = indoorMatchStore.getPlayer(teamARotation[i])
    breakTeamANumbers.value[i] = aPlayer ? aPlayer.number : ''
    breakTeamAIds.value[i] = teamARotation[i]
    const bPlayer = indoorMatchStore.getPlayer(teamBRotation[i])
    breakTeamBNumbers.value[i] = bPlayer ? bPlayer.number : ''
    breakTeamBIds.value[i] = teamBRotation[i]
  }
  breakServingTeam.value = indoorMatchStore.getPreviousReceiver()
}

function handleUndo() {
  if (!indoorMatchStore.canUndo) return
  uni.showModal({
    title: '撤销',
    content: indoorMatchStore.undoDescription,
    success: (res) => {
      if (res.confirm) indoorMatchStore.undoAction()
    }
  })
}

function goToSubstitution() {
  uni.navigateTo({ url: '/pages-indoor/substitution/index' })
}

function handleSwapCourts() {
  indoorMatchStore.swapCourts()
  playSwapCourtSound()
}

const timeoutTimer = ref<ReturnType<typeof setInterval> | null>(null)
const timeoutCountdown = ref(30)
const timeoutVisible = ref(false)
const timeoutTeamName = ref('')
const set5SwapVisible = ref(false)
const setBreakVisible = ref(false)
const breakServingTeam = ref<'A' | 'B'>('A')
const localNextSet = ref(false)
const breakTeamANumbers = ref<string[]>(['', '', '', '', '', ''])
const breakTeamBNumbers = ref<string[]>(['', '', '', '', '', ''])
const breakTeamAIds = ref<string[]>(['', '', '', '', '', ''])
const breakTeamBIds = ref<string[]>(['', '', '', '', '', ''])
// 局间休息倒计时
const setBreakCountdown = ref(0)
const setBreakTimer = ref<ReturnType<typeof setInterval> | null>(null)

/** 获取当前局间休息时长（秒）- 室内排球除第一局外每局3分钟 */
function getSetBreakDuration(): number {
  const currentSet = indoorMatchStore.currentSet
  // 除第一局外，每局休息3分钟
  if (currentSet >= 1) return 180
  return 0
}

/** 开始局间休息倒计时 */
function startSetBreakCountdown() {
  const duration = getSetBreakDuration()
  if (duration <= 0) return

  // 设置结束时间戳并同步到 store
  const endTime = Date.now() + duration * 1000
  indoorMatchStore.setSetBreakEndTime(endTime)

  setBreakCountdown.value = duration
  if (setBreakTimer.value) clearInterval(setBreakTimer.value)
  setBreakTimer.value = setInterval(() => {
    setBreakCountdown.value--
    if (setBreakCountdown.value <= 0) {
      if (setBreakTimer.value) clearInterval(setBreakTimer.value)
      setBreakTimer.value = null
    }
  }, 1000)
}

/** 根据结束时间戳同步倒计时（用于加入端） */
function syncCountdownFromEndTime() {
  const endTime = indoorMatchStore.setBreakEndTime
  if (!endTime) return

  const now = Date.now()
  const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
  setBreakCountdown.value = remaining

  if (remaining > 0) {
    if (setBreakTimer.value) clearInterval(setBreakTimer.value)
    setBreakTimer.value = setInterval(() => {
      setBreakCountdown.value--
      if (setBreakCountdown.value <= 0) {
        if (setBreakTimer.value) clearInterval(setBreakTimer.value)
        setBreakTimer.value = null
      }
    }, 1000)
  }
}

/** 格式化倒计时显示 */
function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function handleTimeout(team: TeamSide) {
  console.log('[IndoorScoring] handleTimeout called, team:', team)
  const success = indoorMatchStore.callTimeout(team)
  console.log('[IndoorScoring] callTimeout result:', success)
  if (success) {
    feedbackTimeout(settingsStore.settings.vibrateEnabled)
    // 暂停开始时播放语音
    playTimeoutSound()
    timeoutTeamName.value = team === leftTeam.value ? leftTeamName.value : rightTeamName.value
    timeoutCountdown.value = 30
    timeoutVisible.value = true
    if (timeoutTimer.value) clearInterval(timeoutTimer.value)
    timeoutTimer.value = setInterval(() => {
      timeoutCountdown.value--
      if (timeoutCountdown.value <= 0) {
        if (timeoutTimer.value) clearInterval(timeoutTimer.value)
        timeoutTimer.value = null
        timeoutVisible.value = false
        // 暂停结束时播放语音
        playTimeoutEndSound()
      }
    }, 1000)
  } else {
    uni.showToast({ title: '暂停次数已用完', icon: 'none' })
  }
}

function dismissTimeout() {
  console.log('[IndoorScoring] dismissTimeout called')
  if (timeoutTimer.value) clearInterval(timeoutTimer.value)
  timeoutTimer.value = null
  timeoutVisible.value = false
  // 清除暂停事件，让远端也关闭弹窗
  indoorMatchStore.clearLastTimeout()
}

/** 监听局结束 */
watch(() => indoorMatchStore.isSetComplete, (val) => {
  console.log('[IndoorScoring] isSetComplete变化:', val, 'setsWonA:', indoorMatchStore.setsWonA, 'setsWonB:', indoorMatchStore.setsWonB, 'needSelectServing:', needSelectServing.value)
  if (val && !indoorMatchStore.isMatchComplete && !localSetComplete.value) {
    setBreakVisible.value = true
    // 加入端根据结束时间戳同步倒计时
    syncCountdownFromEndTime()
  }
  if (!val) {
    localSetComplete.value = false
    if (setBreakVisible.value && !localNextSet.value) {
      setBreakVisible.value = false
    }
  }
})

/** 监听 setBreakEndTime 变化（用于加入端同步倒计时） */
watch(() => indoorMatchStore.setBreakEndTime, (endTime) => {
  if (endTime && setBreakVisible.value) {
    syncCountdownFromEndTime()
  }
})

/** 监听第5局8分换边 */
watch(() => indoorMatchStore.set5Swapped, (val) => {
  if (val) {
    set5SwapVisible.value = false
  }
})

/** 监听远程暂停弹窗 */
watch(() => indoorMatchStore.lastTimeout, (newVal, oldVal) => {
  console.log('[IndoorScoring] watch lastTimeout, newVal:', newVal, 'oldVal:', oldVal)
  if (!newVal) {
    // 远端关闭了暂停，本地也关闭
    if (timeoutVisible.value) {
      if (timeoutTimer.value) clearInterval(timeoutTimer.value)
      timeoutTimer.value = null
      timeoutVisible.value = false
    }
    return
  }
  // 只在暂停事件是新的（timestamp不同）时弹窗
  if (oldVal && newVal.timestamp === oldVal.timestamp) return
  // 如果本地已经在显示暂停弹窗，不重复弹
  if (timeoutVisible.value) return

  // 远程端触发了暂停
  const team = newVal.team
  timeoutTeamName.value = team === 'A' ? teamAName.value : teamBName.value
  timeoutCountdown.value = 30
  timeoutVisible.value = true
  feedbackTimeout(settingsStore.settings.vibrateEnabled)
  // 暂停开始时播放语音
  playTimeoutSound()
  if (timeoutTimer.value) clearInterval(timeoutTimer.value)
  timeoutTimer.value = setInterval(() => {
    timeoutCountdown.value--
    if (timeoutCountdown.value <= 0) {
      if (timeoutTimer.value) clearInterval(timeoutTimer.value)
      timeoutTimer.value = null
      timeoutVisible.value = false
    }
  }, 1000)
})

/** 监听远程决胜局8分换边弹窗 */
watch(() => indoorMatchStore.pendingSet5Swap, (val, oldVal) => {
  console.log('[IndoorScoring] watch pendingSet5Swap:', val, 'oldVal:', oldVal)
  if (val && !oldVal) {
    // 新的换边事件，显示弹窗并播放语音
    set5SwapVisible.value = true
    playSwapCourtSound()
  }
})

watch(() => [indoorMatchStore.scoreA, indoorMatchStore.scoreB], () => {
  // 得分变化时的逻辑（决胜局8分换边由 store 的 scorePoint 处理）
})

function confirmSet5Swap() {
  console.log('[IndoorScoring] confirmSet5Swap called')
  indoorMatchStore.confirmSet5Swap()
  set5SwapVisible.value = false
}

/** 局间休息：开始下一局 */
function handleNextSet() {
  // 清除倒计时
  if (setBreakTimer.value) clearInterval(setBreakTimer.value)
  setBreakTimer.value = null

  localNextSet.value = true
  const newAPositions: string[] = []
  const newBPositions: string[] = []
  for (let i = 0; i < 6; i++) {
    const aId = breakTeamAIds.value[i]
    const bId = breakTeamBIds.value[i]
    newAPositions.push(aId)
    newBPositions.push(bId)
    const aPlayer = indoorMatchStore.getPlayer(aId)
    if (aPlayer) aPlayer.number = breakTeamANumbers.value[i]
    const bPlayer = indoorMatchStore.getPlayer(bId)
    if (bPlayer) bPlayer.number = breakTeamBNumbers.value[i]
  }
  indoorMatchStore.match!.teamA.startingPositions = newAPositions
  indoorMatchStore.match!.teamB.startingPositions = newBPositions
  indoorMatchStore.setNextSetPositions('A', newAPositions)
  indoorMatchStore.setNextSetPositions('B', newBPositions)
  indoorMatchStore.courtSwapped = !indoorMatchStore.courtSwapped

  // 决胜局使用用户选择的发球方，否则自动交替（不传参数）
  if (needSelectServing.value) {
    console.log('[IndoorScoring] 决胜局，用户选择发球方:', breakServingTeam.value)
    indoorMatchStore.nextSet(breakServingTeam.value)
  } else {
    console.log('[IndoorScoring] 非决胜局，自动交替发球权')
    indoorMatchStore.nextSet()
  }

  setBreakVisible.value = false
  localNextSet.value = false
}

// 决胜局需要选择发球方：5局3胜制在2:2时，3局2胜制在1:1时
const needSelectServing = computed(() => {
  const totalSets = indoorMatchStore.totalSets
  const setsToWin = Math.ceil(totalSets / 2) // 5局->3, 3局->2
  // 决胜局前：双方各赢 setsToWin-1 局
  // 5局3胜制：2:2 时需要选择
  // 3局2胜制：1:1 时需要选择
  return indoorMatchStore.setsWonA === setsToWin - 1 && indoorMatchStore.setsWonB === setsToWin - 1
})

const localMatchComplete = ref(false)
const selectedLibero = ref<{ side: 'left' | 'right'; number: string } | null>(null)

watch(() => indoorMatchStore.isMatchComplete, (val) => {
  if (val && !localMatchComplete.value) {
    playMatchEndSound()
    indoorMatchStore.completeMatch()
    historyStore.addMatch(indoorMatchStore.match!)
    uni.reLaunch({ url: '/pages-indoor/match-result/index' })
  }
})

function pName(playerId: string, players: Player[]): string {
  const p = players.find(p => p.id === playerId)
  if (!p) return '?'
  const display = p.number || p.name.slice(0, 2)
  return display
}

function isCaptain(playerId: string, players: Player[]): boolean {
  const p = players.find(p => p.id === playerId)
  return p?.isCaptain || false
}

/** 长按后排队员触发自由人替换 */
function handleLiberoLongPress(team: TeamSide, playerId: string) {
  const libero1 = team === leftTeam.value ? leftTeamLibero1.value : rightTeamLibero1.value
  const libero2 = team === leftTeam.value ? leftTeamLibero2.value : rightTeamLibero2.value

  if (!libero1 && !libero2) {
    uni.showToast({ title: '未设置自由人', icon: 'none' })
    return
  }

  // 如果只有一名自由人，直接替换
  if (!libero2) {
    const result = indoorMatchStore.liberoSwap(team, playerId, libero1)
    if (result.success) {
      uni.showToast({ title: '自由人已替换', icon: 'none' })
      // 如果被替换的是队长，弹出选择新队长对话框
      if (result.captainReplaced) {
        showCaptainSelectDialog(team)
      }
      // 如果原始队长被恢复，显示提示
      if (result.originalCaptainRestored) {
        uni.showToast({ title: '原队长已恢复', icon: 'none' })
      }
    } else {
      uni.showToast({ title: '替换失败', icon: 'none' })
    }
    return
  }

  // 如果有两名自由人，弹出选择
  const liberoOptions = [libero1, libero2].filter(Boolean) as string[]
  uni.showActionSheet({
    title: '选择替换的自由人',
    itemList: liberoOptions.map(n => '自由人 ' + n),
    success: (res) => {
      const selectedLibero = liberoOptions[res.tapIndex]
      const result = indoorMatchStore.liberoSwap(team, playerId, selectedLibero)
      if (result.success) {
        uni.showToast({ title: '自由人已替换', icon: 'none' })
        // 如果被替换的是队长，弹出选择新队长对话框
        if (result.captainReplaced) {
          showCaptainSelectDialog(team)
        }
        // 如果原始队长被恢复，显示提示
        if (result.originalCaptainRestored) {
          uni.showToast({ title: '原队长已恢复', icon: 'none' })
        }
      } else {
        uni.showToast({ title: '替换失败', icon: 'none' })
      }
    }
  })
}

/** 点击自由人触发替换 */
function handleLiberoClick(side: 'left' | 'right', liberoNumber: string) {
  // 如果已经选中了该自由人，取消选中
  if (selectedLibero.value?.side === side && selectedLibero.value?.number === liberoNumber) {
    selectedLibero.value = null
    return
  }
  // 选中自由人
  selectedLibero.value = { side, number: liberoNumber }
  uni.showToast({ title: '请点击后排队员位置进行替换', icon: 'none' })
}

/** 点击后排位置进行自由人替换 */
function handleBackRowClick(team: TeamSide, playerId: string) {
  if (!selectedLibero.value) return

  const targetTeam = selectedLibero.value.side === 'left' ? leftTeam.value : rightTeam.value
  if (team !== targetTeam) {
    uni.showToast({ title: '请选择同队后排队员', icon: 'none' })
    return
  }

  const result = indoorMatchStore.liberoSwap(team, playerId, selectedLibero.value.number)
  if (result.success) {
    uni.showToast({ title: '自由人已替换', icon: 'none' })
    // 如果被替换的是队长，弹出选择新队长对话框
    if (result.captainReplaced) {
      showCaptainSelectDialog(team)
    }
    // 如果原始队长被恢复，显示提示
    if (result.originalCaptainRestored) {
      uni.showToast({ title: '原队长已恢复', icon: 'none' })
    }
  } else {
    uni.showToast({ title: '替换失败', icon: 'none' })
  }
  selectedLibero.value = null
}

// PC端横屏模式检测
const isPcLandscapeMode = ref(false)

/** 显示选择新队长对话框 */
function showCaptainSelectDialog(team: TeamSide) {
  const rotation = indoorMatchStore.getRotation(team)
  const players = rotation.map(pid => indoorMatchStore.getPlayer(pid)).filter(Boolean) as Player[]
  const items = players.map((p, i) => ({
    name: p.number || p.name || `队员${i + 1}`,
    id: p.id
  }))

  uni.showActionSheet({
    title: '请指定场上队长',
    itemList: items.map(item => item.name),
    success: (res: any) => {
      const selectedId = items[res.tapIndex].id
      // 清除原队长标记，设置新队长
      const teamPlayers = team === 'A' ? indoorMatchStore.match!.teamA.players : indoorMatchStore.match!.teamB.players
      teamPlayers.forEach(p => { p.isCaptain = (p.id === selectedId) })
      uni.showToast({ title: '新队长已设置', icon: 'success' })
    }
  })
}

function checkPcLandscape() {
  const systemInfo = uni.getSystemInfoSync()
  const { windowWidth, windowHeight, platform } = systemInfo
  if ((platform === 'windows' || platform === 'mac') && windowWidth < windowHeight) {
    isPcLandscapeMode.value = true
  } else {
    isPcLandscapeMode.value = false
  }
}

// 同步生命周期 - 仅处理心跳恢复
onShow(() => {
  checkPcLandscape()
})
</script>

<template>
  <view class="page" :class="{ 'pc-landscape-mode': isPcLandscapeMode }" v-if="indoorMatchStore.isLive || indoorMatchStore.isMatchComplete">
    <!-- 球场区域 -->
    <view class="court-area">
      <!-- 左侧队伍外侧：暂停+比分+得分按钮 -->
      <view class="side-col side-col-left">
        <view class="timeout-btn timeout-btn-left" @tap="handleTimeout(leftTeam)">
          <text class="timeout-text">停{{ indoorMatchStore.getTimeouts(leftTeam) }}/2</text>
        </view>
        <view class="side-score">
          <text class="score-num left-score">{{ leftTeamScore }}</text>
        </view>
        <view class="score-btn score-btn-left" hover-class="score-btn-hover" @tap="handleScore(leftTeam)">
          <text class="score-btn-text">+1</text>
        </view>
      </view>

      <!-- 左侧队伍半场：室内排球6人站位 -->
      <!-- 后排：5号位(左)、6号位(中)、1号位(右-发球)
           前排：4号位(左)、3号位(中)、2号位(右) -->
      <view class="court-half court-half-left">
        <view class="court-rotated">
          <view class="rot-col">
            <view class="pos" :class="{ 'libero-target': selectedLibero?.side === 'left' }" @longpress="handleLiberoLongPress(leftTeam, leftTeamRotation[4])" @tap="handleBackRowClick(leftTeam, leftTeamRotation[4])">
              <text class="pos-num">V</text>
              <text class="pos-name" :class="{ 'captain-name': isCaptain(leftTeamRotation[4], leftTeamPlayers) }">{{ pName(leftTeamRotation[4], leftTeamPlayers) }}</text>
            </view>
            <view class="pos" :class="{ 'libero-target': selectedLibero?.side === 'left' }" @longpress="handleLiberoLongPress(leftTeam, leftTeamRotation[5])" @tap="handleBackRowClick(leftTeam, leftTeamRotation[5])">
              <text class="pos-num">VI</text>
              <text class="pos-name" :class="{ 'captain-name': isCaptain(leftTeamRotation[5], leftTeamPlayers) }">{{ pName(leftTeamRotation[5], leftTeamPlayers) }}</text>
            </view>
            <view class="pos" :class="{ 'pos-serving': leftTeamServing, 'libero-target': selectedLibero?.side === 'left' }" @longpress="handleLiberoLongPress(leftTeam, leftTeamRotation[0])" @tap="handleBackRowClick(leftTeam, leftTeamRotation[0])">
              <text class="pos-num">I</text>
              <text class="pos-name" :class="{ 'captain-name': isCaptain(leftTeamRotation[0], leftTeamPlayers) }">{{ pName(leftTeamRotation[0], leftTeamPlayers) }}</text>
            </view>
          </view>
          <view class="rot-col">
            <view class="pos">
              <text class="pos-num">IV</text>
              <text class="pos-name" :class="{ 'captain-name': isCaptain(leftTeamRotation[3], leftTeamPlayers) }">{{ pName(leftTeamRotation[3], leftTeamPlayers) }}</text>
            </view>
            <view class="pos">
              <text class="pos-num">III</text>
              <text class="pos-name" :class="{ 'captain-name': isCaptain(leftTeamRotation[2], leftTeamPlayers) }">{{ pName(leftTeamRotation[2], leftTeamPlayers) }}</text>
            </view>
            <view class="pos">
              <text class="pos-num">II</text>
              <text class="pos-name" :class="{ 'captain-name': isCaptain(leftTeamRotation[1], leftTeamPlayers) }">{{ pName(leftTeamRotation[1], leftTeamPlayers) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 球网 -->
      <view class="net-col">
        <view class="net-line" />
        <view class="net-label">
          <text>第</text>
          <text>{{ indoorMatchStore.currentSet }}</text>
          <text>局</text>
        </view>
        <view class="net-line" />
      </view>

      <!-- 右侧队伍半场 -->
      <view class="court-half court-half-right">
        <view class="court-rotated">
          <view class="rot-col">
            <view class="pos">
              <text class="pos-num">II</text>
              <text class="pos-name" :class="{ 'captain-name': isCaptain(rightTeamRotation[1], rightTeamPlayers) }">{{ pName(rightTeamRotation[1], rightTeamPlayers) }}</text>
            </view>
            <view class="pos">
              <text class="pos-num">III</text>
              <text class="pos-name" :class="{ 'captain-name': isCaptain(rightTeamRotation[2], rightTeamPlayers) }">{{ pName(rightTeamRotation[2], rightTeamPlayers) }}</text>
            </view>
            <view class="pos">
              <text class="pos-num">IV</text>
              <text class="pos-name" :class="{ 'captain-name': isCaptain(rightTeamRotation[3], rightTeamPlayers) }">{{ pName(rightTeamRotation[3], rightTeamPlayers) }}</text>
            </view>
          </view>
          <view class="rot-col">
            <view class="pos" :class="{ 'pos-serving': rightTeamServing, 'libero-target': selectedLibero?.side === 'right' }" @longpress="handleLiberoLongPress(rightTeam, rightTeamRotation[0])" @tap="handleBackRowClick(rightTeam, rightTeamRotation[0])">
              <text class="pos-num">I</text>
              <text class="pos-name" :class="{ 'captain-name': isCaptain(rightTeamRotation[0], rightTeamPlayers) }">{{ pName(rightTeamRotation[0], rightTeamPlayers) }}</text>
            </view>
            <view class="pos" :class="{ 'libero-target': selectedLibero?.side === 'right' }" @longpress="handleLiberoLongPress(rightTeam, rightTeamRotation[5])" @tap="handleBackRowClick(rightTeam, rightTeamRotation[5])">
              <text class="pos-num">VI</text>
              <text class="pos-name" :class="{ 'captain-name': isCaptain(rightTeamRotation[5], rightTeamPlayers) }">{{ pName(rightTeamRotation[5], rightTeamPlayers) }}</text>
            </view>
            <view class="pos" :class="{ 'libero-target': selectedLibero?.side === 'right' }" @longpress="handleLiberoLongPress(rightTeam, rightTeamRotation[4])" @tap="handleBackRowClick(rightTeam, rightTeamRotation[4])">
              <text class="pos-num">V</text>
              <text class="pos-name" :class="{ 'captain-name': isCaptain(rightTeamRotation[4], rightTeamPlayers) }">{{ pName(rightTeamRotation[4], rightTeamPlayers) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 右侧队伍外侧 -->
      <view class="side-col side-col-right">
        <view class="timeout-btn timeout-btn-right" @tap="handleTimeout(rightTeam)">
          <text class="timeout-text">停{{ indoorMatchStore.getTimeouts(rightTeam) }}/2</text>
        </view>
        <view class="side-score">
          <text class="score-num right-score">{{ rightTeamScore }}</text>
        </view>
        <view class="score-btn score-btn-right" hover-class="score-btn-hover" @tap="handleScore(rightTeam)">
          <text class="score-btn-text">+1</text>
        </view>
      </view>
    </view>

    <!-- 暂停倒计时弹窗 -->
    <view v-if="timeoutVisible" class="timeout-overlay" @tap="dismissTimeout">
      <view class="timeout-modal">
        <text class="timeout-modal-title">{{ timeoutTeamName }} 请求暂停</text>
        <view class="timeout-modal-countdown-row">
          <text class="timeout-modal-countdown">{{ timeoutCountdown }}</text>
          <text class="timeout-modal-unit">秒</text>
        </view>
        <text class="timeout-modal-hint">点击关闭</text>
      </view>
    </view>

    <!-- 第5局8分换边弹窗 -->
    <view v-if="set5SwapVisible" class="timeout-overlay">
      <view class="timeout-modal">
        <text class="timeout-modal-title">交换场地</text>
        <text class="set3swap-content">决胜局达到8分，请交换场地</text>
        <view class="set3swap-btn" @tap="confirmSet5Swap">
          <text class="set3swap-btn-text">确认换边</text>
        </view>
      </view>
    </view>

    <!-- 局间休息弹窗 -->
    <view v-if="setBreakVisible" class="timeout-overlay">
      <view class="sb-modal">
        <text class="sb-title">局间休息</text>
        <view v-if="setBreakCountdown > 0" class="sb-countdown">
          <text class="sb-countdown-num">{{ formatCountdown(setBreakCountdown) }}</text>
        </view>
        <view class="sb-score-row">
          <text class="sb-team">{{ teamAName }}</text>
          <text class="sb-score">{{ indoorMatchStore.scoreA }} : {{ indoorMatchStore.scoreB }}</text>
          <text class="sb-team">{{ teamBName }}</text>
        </view>
        <text class="sb-sets">局分 {{ indoorMatchStore.setsWonA }} : {{ indoorMatchStore.setsWonB }}</text>
        <view class="sb-positions">
          <view class="sb-pos-col">
            <text class="sb-pos-label">{{ teamAName }}</text>
            <view v-for="i in 6" :key="'a'+i" class="sb-pos-row">
              <text class="sb-pos-num">{{ ['I','II','III','IV','V','VI'][i-1] }}</text>
              <input class="sb-pos-input" :value="breakTeamANumbers[i-1]" @input="breakTeamANumbers[i-1] = $event.detail.value" placeholder="号码" />
            </view>
          </view>
          <view class="sb-pos-col">
            <text class="sb-pos-label">{{ teamBName }}</text>
            <view v-for="i in 6" :key="'b'+i" class="sb-pos-row">
              <text class="sb-pos-num">{{ ['I','II','III','IV','V','VI'][i-1] }}</text>
              <input class="sb-pos-input" :value="breakTeamBNumbers[i-1]" @input="breakTeamBNumbers[i-1] = $event.detail.value" placeholder="号码" />
            </view>
          </view>
        </view>
        <view v-if="needSelectServing" class="sb-serving">
          <text class="sb-serving-label">决胜局发球方</text>
          <view class="sb-serving-opts">
            <view :class="['sb-serving-btn', breakServingTeam === 'A' ? 'active' : '']" @tap="breakServingTeam = 'A'">
              <text>{{ teamAName }}</text>
            </view>
            <view :class="['sb-serving-btn', breakServingTeam === 'B' ? 'active' : '']" @tap="breakServingTeam = 'B'">
              <text>{{ teamBName }}</text>
            </view>
          </view>
        </view>
        <view class="sb-action" @tap="handleNextSet">
          <text class="sb-action-text">开始下一局</text>
        </view>
      </view>
    </view>

    <!-- 底部工具栏 -->
    <view class="toolbar">
      <view class="tb-team tb-team-left">
        <text class="tb-team-name left-name">{{ leftTeamName }}</text>
        <text class="tb-sets">{{ leftTeamSets }}</text>
        <text class="tb-stat">换{{ indoorMatchStore.getSubs(leftTeam) }}/6</text>
        <view class="tb-liberos">
          <text v-for="item in getToolbarNumbers(leftTeam)" :key="item.number" class="tb-libero" :class="{ 'tb-libero-active': selectedLibero?.side === 'left' && selectedLibero?.number === item.liberoNumber }" @tap="handleLiberoClick('left', item.liberoNumber)">
            <text v-if="item.isLibero">L{{ item.number }}</text>
            <text v-else>{{ item.number }}</text>
          </text>
        </view>
      </view>
      <view class="tb-center">
        <view class="tb-set-scores">
          <text
            v-for="s in setResults"
            :key="s.scoreA + '-' + s.scoreB"
            class="tb-set-item"
            :class="{ 'a-win': s.winner === 'A', 'b-win': s.winner === 'B' }"
          >{{ s.scoreA }}:{{ s.scoreB }}</text>
        </view>
        <view class="tb-tools">
          <view class="tool-btn" @tap="handleUndo">
            <text class="tool-icon">↩</text>
            <text class="tool-label">撤销</text>
          </view>
          <view class="tool-btn" @tap="goToSubstitution">
            <text class="tool-icon">⇄</text>
            <text class="tool-label">换人</text>
          </view>
          <view class="tool-btn" @tap="handleSwapCourts">
            <text class="tool-icon">⇆</text>
            <text class="tool-label">场地互换</text>
          </view>
        </view>
      </view>
      <view class="tb-team tb-team-right">
        <view class="tb-liberos">
          <text v-for="item in getToolbarNumbers(rightTeam)" :key="item.number" class="tb-libero" :class="{ 'tb-libero-active': selectedLibero?.side === 'right' && selectedLibero?.number === item.liberoNumber }" @tap="handleLiberoClick('right', item.liberoNumber)">
            <text v-if="item.isLibero">L{{ item.number }}</text>
            <text v-else>{{ item.number }}</text>
          </text>
        </view>
        <text class="tb-team-name right-name">{{ rightTeamName }}</text>
        <text class="tb-sets">{{ rightTeamSets }}</text>
        <text class="tb-stat">换{{ indoorMatchStore.getSubs(rightTeam) }}/6</text>
      </view>
    </view>
  </view>

  <!-- 未在比赛中 -->
  <view v-else class="page empty-page">
    <text class="empty-text">暂无进行中的比赛</text>
    <view class="empty-btn" @tap="uni.navigateTo({ url: '/pages-indoor/match-setup/index' })">
      <text class="empty-btn-text">开始新比赛</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

// 室内排球使用蓝色主题
$indoor-color: #1565c0;
$indoor-team-a: #1565c0;
$indoor-team-b: #f44336;

// 响应式尺寸变量
$page-padding: clamp(8px, 2vw, 16px);
$side-col-width: clamp(60px, 12vw, 100px);
$score-size: clamp(36px, 8vw, 72px);
$pos-size: clamp(40px, 8vw, 68px);
$pos-name-size: clamp(14px, 3vw, 24px);
$btn-width: clamp(48px, 10vw, 80px);
$btn-height: clamp(36px, 7vw, 56px);
$toolbar-height: clamp(36px, 7vw, 56px);
$net-width: clamp(20px, 4vw, 28px);

.page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: $bg-color;
  overflow: hidden;
}

// PC端强制横屏模式
.pc-landscape-mode {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vh;
  height: 100vw;
  transform-origin: top left;
  transform: rotate(90deg) translateY(-100%);
  overflow: hidden;
}

.court-area {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

.side-col {
  width: $side-col-width;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(6px, 1.5vw, 12rpx);
  padding: $page-padding clamp(4px, 1vw, 8rpx);
}

.side-col-left {
  background-color: rgba($indoor-team-a, 0.04);
}

.side-col-right {
  background-color: rgba($indoor-team-b, 0.04);
}

.timeout-btn {
  padding: clamp(4px, 1vw, 4rpx) clamp(8px, 2vw, 12rpx);
  border-radius: clamp(4px, 1vw, 8rpx);
  border: 2rpx solid;
}

.timeout-btn-left {
  border-color: $indoor-team-a;
  background-color: rgba($indoor-team-a, 0.1);
}

.timeout-btn-right {
  border-color: $indoor-team-b;
  background-color: rgba($indoor-team-b, 0.1);
}

.timeout-text {
  font-size: clamp(10px, 2vw, 18rpx);
  font-weight: bold;
}

.timeout-btn-left .timeout-text { color: $indoor-team-a; }
.timeout-btn-right .timeout-text { color: $indoor-team-b; }

.side-score {
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-num {
  font-size: $score-size;
  font-weight: bold;
  line-height: 1;
}

.left-score { color: $indoor-team-a; }
.right-score { color: $indoor-team-b; }

.court-half {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $page-padding;
}

.court-half-left { background-color: #e3f2fd; }
.court-half-right { background-color: #ffebee; }

.court-rotated {
  display: flex;
  flex-direction: row;
  gap: clamp(6px, 1.5vw, 12rpx);
  padding: clamp(6px, 1.5vw, 12rpx);
}

.rot-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(4px, 1vw, 8rpx);
}

.pos {
  width: clamp(52px, 10vw, 84px);
  height: clamp(52px, 10vw, 84px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.85);
  border-radius: clamp(6px, 1.5vw, 10rpx);
  position: relative;

  &.pos-serving {
    border: 3rpx solid #39ff14;
    background-color: rgba(57, 255, 20, 0.25);
  }
}

.pos-num {
  font-size: clamp(8px, 1.5vw, 14rpx);
  color: $text-light;
  position: absolute;
  top: 2rpx;
  left: 4rpx;
}

.pos-name {
  font-size: $pos-name-size;
  color: $text-color;
  font-weight: bold;

  &.captain-name {
    border-bottom: 2rpx solid $primary-color;
    padding-bottom: 2rpx;
  }
}

.net-col {
  width: $net-width;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.03);
}

.net-line {
  flex: 1;
  width: clamp(2px, 0.5vw, 4rpx);
  background-color: #333;
}

.net-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: clamp(10px, 2vw, 16rpx);
  color: $text-light;
  padding: clamp(4px, 1vw, 6rpx) 0;
  gap: 2rpx;
}

.score-btn {
  width: $btn-width;
  height: $btn-height;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $border-radius;
}

.score-btn-left { background-color: $indoor-team-a; }
.score-btn-right { background-color: $indoor-team-b; }
.score-btn-hover { opacity: 0.8; }

.score-btn-text {
  font-size: clamp(14px, 3vw, 24rpx);
  color: $text-white;
  font-weight: bold;
}

.toolbar {
  height: $toolbar-height;
  display: flex;
  align-items: center;
  background-color: $bg-white;
  border-top: 1rpx solid $border-color;
  padding: 0 clamp(8px, 2vw, 12rpx);
}

.tb-team {
  display: flex;
  align-items: center;
  gap: clamp(4px, 1vw, 6rpx);
}

.tb-team-name {
  font-size: clamp(12px, 2.5vw, 18rpx);
  font-weight: bold;
}

.left-name { color: $indoor-team-a; }
.right-name { color: $indoor-team-b; }

.tb-sets {
  font-size: clamp(14px, 3vw, 20rpx);
  font-weight: bold;
  color: $text-color;
}

.tb-stat {
  font-size: clamp(10px, 2vw, 14rpx);
  color: $text-secondary;
  background-color: $bg-color;
  padding: 0 clamp(4px, 1vw, 6rpx);
  border-radius: 4rpx;
}

.tb-liberos {
  display: flex;
  gap: clamp(2px, 0.5vw, 4rpx);
}

.tb-libero {
  font-size: clamp(10px, 2vw, 14rpx);
  color: #fff;
  background-color: #ff9800;
  padding: 0 clamp(4px, 1vw, 6rpx);
  border-radius: 4rpx;
  font-weight: bold;

  &.tb-libero-active {
    background-color: #e65100;
    border: 2rpx solid #fff;
  }
}

.pos.libero-target {
  border: 3rpx solid #ff9800;
  animation: libero-pulse 1s infinite;
}

@keyframes libero-pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.4); }
  70% { box-shadow: 0 0 0 6rpx rgba(255, 152, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0); }
}

.tb-center {
  display: flex;
  align-items: center;
  gap: clamp(6px, 1.5vw, 8rpx);
  margin: 0 auto;
}

.tb-set-scores {
  display: flex;
  gap: clamp(4px, 1vw, 6rpx);
}

.tb-set-item {
  font-size: clamp(10px, 2vw, 14rpx);
  color: $text-light;
  padding: 0 clamp(4px, 1vw, 6rpx);
  border-radius: 4rpx;
  background-color: $bg-color;

  &.a-win { color: $indoor-team-a; background-color: rgba($indoor-team-a, 0.1); }
  &.b-win { color: $indoor-team-b; background-color: rgba($indoor-team-b, 0.1); }
}

.tb-tools {
  display: flex;
  align-items: center;
  gap: clamp(12px, 3vw, 16rpx);
  margin-left: auto;
}

.tool-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: clamp(2px, 0.5vw, 4rpx);
  padding: clamp(2px, 0.5vw, 4rpx) clamp(6px, 1.5vw, 8rpx);
}

.tool-icon {
  font-size: clamp(14px, 3vw, 22rpx);
  color: $indoor-color;
}

.tool-label {
  font-size: clamp(10px, 2vw, 16rpx);
  color: $text-secondary;
}

.timeout-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: clamp(16px, 4vw, 32rpx);
  box-sizing: border-box;
}

.timeout-modal {
  width: 70%;
  max-width: clamp(280px, 50vw, 500rpx);
  min-width: clamp(200px, 35vw, 280rpx);
  max-height: 80vh;
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  padding: clamp(16px, 4vw, 32rpx) clamp(12px, 3vw, 24rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.timeout-modal-title {
  font-size: clamp(18px, 4vw, 32rpx);
  font-weight: bold;
  color: $text-color;
  margin-bottom: clamp(8px, 2vw, 16rpx);
}

.timeout-modal-countdown-row {
  display: flex;
  align-items: baseline;
}

.timeout-modal-countdown {
  font-size: clamp(48px, 12vw, 100rpx);
  font-weight: bold;
  color: $indoor-color;
  line-height: 1;
}

.timeout-modal-unit {
  font-size: clamp(20px, 5vw, 36rpx);
  font-weight: bold;
  color: $indoor-color;
  margin-left: clamp(4px, 1vw, 8rpx);
}

.timeout-modal-hint {
  font-size: clamp(12px, 2.5vw, 22rpx);
  color: $text-light;
  margin-top: clamp(8px, 2vw, 16rpx);
}

.set3swap-content {
  font-size: clamp(14px, 3vw, 26rpx);
  color: $text-color;
  margin-bottom: clamp(12px, 3vw, 24rpx);
}

.set3swap-btn {
  padding: clamp(8px, 2vw, 12rpx) clamp(24px, 6vw, 48rpx);
  background-color: $indoor-color;
  border-radius: $border-radius;
}

.set3swap-btn-text {
  font-size: clamp(14px, 3vw, 26rpx);
  color: $text-white;
  font-weight: bold;
}

.empty-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.sb-modal {
  width: 85%;
  max-width: clamp(400px, 60vw, 700rpx);
  max-height: 90vh;
  background-color: $bg-white;
  border-radius: clamp(8px, 2vw, 12rpx);
  padding: clamp(12px, 3vw, 24rpx) clamp(10px, 2.5vw, 20rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
}

.sb-title {
  font-size: clamp(16px, 4vw, 28rpx);
  font-weight: bold;
  color: $indoor-color;
  margin-bottom: clamp(6px, 1.5vw, 12rpx);
}

.sb-countdown {
  display: flex;
  justify-content: center;
  margin-bottom: clamp(6px, 1.5vw, 12rpx);
}

.sb-countdown-num {
  font-size: clamp(28px, 7vw, 48rpx);
  font-weight: bold;
  color: $indoor-color;
}

.sb-score-row {
  display: flex;
  align-items: center;
  gap: clamp(8px, 2vw, 12rpx);
  margin-bottom: clamp(4px, 1vw, 8rpx);
}

.sb-team {
  font-size: clamp(14px, 3vw, 24rpx);
  color: $text-color;
}

.sb-score {
  font-size: clamp(20px, 5vw, 36rpx);
  font-weight: bold;
  color: $text-color;
}

.sb-sets {
  font-size: clamp(12px, 2.5vw, 22rpx);
  color: $text-secondary;
  margin-bottom: clamp(6px, 1.5vw, 12rpx);
}

.sb-positions {
  display: flex;
  gap: clamp(10px, 2.5vw, 16rpx);
  width: 100%;
  margin-bottom: clamp(6px, 1.5vw, 12rpx);
}

.sb-pos-col {
  flex: 1;
}

.sb-pos-label {
  font-size: clamp(12px, 2.5vw, 22rpx);
  font-weight: bold;
  color: $indoor-color;
  text-align: center;
  display: block;
  margin-bottom: clamp(4px, 1vw, 6rpx);
}

.sb-pos-row {
  display: flex;
  align-items: center;
  gap: clamp(4px, 1vw, 6rpx);
  margin-bottom: clamp(2px, 0.5vw, 4rpx);
}

.sb-pos-num {
  width: clamp(20px, 5vw, 36rpx);
  font-size: clamp(12px, 2.5vw, 20rpx);
  color: $indoor-color;
  font-weight: bold;
}

.sb-pos-input {
  flex: 1;
  padding: clamp(2px, 0.5vw, 4rpx) clamp(4px, 1vw, 8rpx);
  border: 1rpx solid $border-color;
  border-radius: 4rpx;
  font-size: clamp(12px, 2.5vw, 20rpx);
  height: clamp(24px, 5vw, 40rpx);
}

.sb-serving {
  width: 100%;
  margin-bottom: clamp(6px, 1.5vw, 12rpx);
}

.sb-serving-label {
  font-size: clamp(12px, 2.5vw, 22rpx);
  color: $text-color;
  text-align: center;
  display: block;
  margin-bottom: clamp(4px, 1vw, 6rpx);
}

.sb-serving-opts {
  display: flex;
  gap: clamp(8px, 2vw, 12rpx);
  justify-content: center;
}

.sb-serving-btn {
  padding: clamp(6px, 1.5vw, 10rpx) clamp(14px, 3.5vw, 24rpx);
  border: 1rpx solid $border-color;
  border-radius: 6rpx;
  font-size: clamp(12px, 2.5vw, 22rpx);
  color: $text-color;

  &.active {
    border-color: $indoor-color;
    color: $indoor-color;
    background-color: rgba($indoor-color, 0.1);
  }
}

.sb-action {
  width: 100%;
  padding: clamp(10px, 2.5vw, 16rpx);
  background-color: $indoor-color;
  border-radius: 8rpx;
  text-align: center;
}

.sb-action-text {
  font-size: clamp(14px, 3.5vw, 26rpx);
  color: $text-white;
  font-weight: bold;
}

.empty-text {
  font-size: $font-size-base;
  color: $text-light;
  margin-bottom: $spacing-md;
}

.empty-btn {
  padding: $spacing-sm $spacing-xl;
  background-color: $indoor-color;
  border-radius: $border-radius;
}

.empty-btn-text {
  font-size: $font-size-base;
  color: $text-white;
}
</style>