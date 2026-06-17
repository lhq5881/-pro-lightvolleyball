<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onHide, onShow, onLoad } from '@dcloudio/uni-app'
import { useMatchStore } from '@/stores/match'
import { useHistoryStore } from '@/stores/history'
import { useSyncStore } from '@/stores/sync'
import { useSettingsStore } from '@/stores/settings'
import { syncService } from '@/services/sync-service'
import { feedbackScore, feedbackSetEnd, feedbackTimeout, playTimeoutSound, playTimeoutEndSound, playSwapCourtSound, playMatchEndSound } from '@/utils/feedback'
import type { TeamSide } from '@/engine/scoring-engine'
import type { Player } from '@/models/match'

const matchStore = useMatchStore()
const historyStore = useHistoryStore()
const syncStore = useSyncStore()
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

const teamAName = computed(() => matchStore.match?.teamA.name ?? '队A')
const teamBName = computed(() => matchStore.match?.teamB.name ?? '队B')
const teamAPlayers = computed(() => matchStore.match?.teamA.players ?? [])
const teamBPlayers = computed(() => matchStore.match?.teamB.players ?? [])
const teamARotation = computed(() => matchStore.getRotation('A'))
const teamBRotation = computed(() => matchStore.getRotation('B'))
const setResults = computed(() => matchStore.scoringEngine?.setResults ?? [])

// 场地交换后，左侧显示的队伍和右侧显示的队伍
// 第一裁判员看到的是翻转的界面（与记录员相反）
const leftTeam = computed<TeamSide>(() => {
  const baseTeam = matchStore.courtSwapped ? 'B' : 'A'
  return isFlipped.value ? (baseTeam === 'A' ? 'B' : 'A') : baseTeam
})
const rightTeam = computed<TeamSide>(() => {
  const baseTeam = matchStore.courtSwapped ? 'A' : 'B'
  return isFlipped.value ? (baseTeam === 'A' ? 'B' : 'A') : baseTeam
})

const leftTeamName = computed(() => leftTeam.value === 'A' ? teamAName.value : teamBName.value)
const rightTeamName = computed(() => rightTeam.value === 'A' ? teamAName.value : teamBName.value)
const leftTeamPlayers = computed(() => leftTeam.value === 'A' ? teamAPlayers.value : teamBPlayers.value)
const rightTeamPlayers = computed(() => rightTeam.value === 'A' ? teamAPlayers.value : teamBPlayers.value)
const leftTeamRotation = computed(() => leftTeam.value === 'A' ? teamARotation.value : teamBRotation.value)
const rightTeamRotation = computed(() => rightTeam.value === 'A' ? teamARotation.value : teamBRotation.value)
const leftTeamScore = computed(() => leftTeam.value === 'A' ? matchStore.scoreA : matchStore.scoreB)
const rightTeamScore = computed(() => rightTeam.value === 'A' ? matchStore.scoreA : matchStore.scoreB)
const leftTeamSets = computed(() => leftTeam.value === 'A' ? matchStore.setsWonA : matchStore.setsWonB)
const rightTeamSets = computed(() => rightTeam.value === 'A' ? matchStore.setsWonA : matchStore.setsWonB)
const leftTeamServing = computed(() => matchStore.servingTeam === leftTeam.value)
const rightTeamServing = computed(() => matchStore.servingTeam === rightTeam.value)

function handleScore(team: TeamSide) {
  if (matchStore.isMatchComplete) return
  const { soundEnabled, vibrateEnabled } = settingsStore.settings
  matchStore.scorePoint(team)
  feedbackScore(soundEnabled, vibrateEnabled)
  if (matchStore.isMatchComplete) {
    localMatchComplete.value = true
    matchStore.completeMatch()
    historyStore.addMatch(matchStore.match!)
    uni.reLaunch({ url: '/pages/match-result/index' })
  } else if (matchStore.isSetComplete) {
    feedbackSetEnd(soundEnabled, vibrateEnabled)
    handleSetComplete()
  } else {
    // 第3局8分弹窗提示换边
    checkSet3SwapPrompt()
  }
}

function checkSet3SwapPrompt() {
  if (!matchStore.scoringEngine) return
  if (matchStore.scoringEngine.currentSet !== 3 || matchStore.set3Swapped) return
  if (matchStore.scoreA >= 8 || matchStore.scoreB >= 8) {
    // 设置换边事件，推送快照让远端也弹窗
    matchStore.setPendingSet3Swap()
    set3SwapVisible.value = true
    // 弹出提示时播放交换场地语音
    playSwapCourtSound()
  }
}

function confirmSet3Swap() {
  matchStore.confirmSet3Swap()
  set3SwapVisible.value = false
}

function handleSetComplete() {
  localSetComplete.value = true
  matchStore.pushSyncSnapshot()
  initBreakData()
  setBreakVisible.value = true
  // 开始局间休息倒计时
  startSetBreakCountdown()
}

function initBreakData() {
  const teamARotation = matchStore.getRotation('A')
  const teamBRotation = matchStore.getRotation('B')
  for (let i = 0; i < 5; i++) {
    const aPlayer = matchStore.getPlayer(teamARotation[i])
    breakTeamANumbers.value[i] = aPlayer ? aPlayer.number : ''
    breakTeamAIds.value[i] = teamARotation[i]
    const bPlayer = matchStore.getPlayer(teamBRotation[i])
    breakTeamBNumbers.value[i] = bPlayer ? bPlayer.number : ''
    breakTeamBIds.value[i] = teamBRotation[i]
  }
  breakServingTeam.value = matchStore.getPreviousReceiver()
}

function handleUndo() {
  if (!matchStore.canUndo) return
  uni.showModal({
    title: '撤销',
    content: matchStore.undoDescription,
    success: (res) => {
      if (res.confirm) matchStore.undoAction()
    }
  })
}

function goToSubstitution() {
  uni.navigateTo({ url: '/pages/substitution/index' })
}

function handleSwapCourts() {
  matchStore.swapCourts()
  playSwapCourtSound()
}

const timeoutTimer = ref<ReturnType<typeof setInterval> | null>(null)
const timeoutCountdown = ref(30)
const timeoutVisible = ref(false)
const timeoutTeamName = ref('')
const set3SwapVisible = ref(false)
const setBreakVisible = ref(false)
const breakServingTeam = ref<'A' | 'B'>('A')
const localNextSet = ref(false)
const breakTeamANumbers = ref<string[]>(['', '', '', '', ''])
const breakTeamBNumbers = ref<string[]>(['', '', '', '', ''])
const breakTeamAIds = ref<string[]>(['', '', '', '', ''])
const breakTeamBIds = ref<string[]>(['', '', '', '', ''])
// 局间休息倒计时
const setBreakCountdown = ref(0)
const setBreakTimer = ref<ReturnType<typeof setInterval> | null>(null)

/** 获取当前局间休息时长（秒） */
function getSetBreakDuration(): number {
  const currentSet = matchStore.currentSet
  // 第2局休息2分钟，第3局休息3分钟
  if (currentSet === 1) return 120  // 第1局结束，准备第2局
  if (currentSet === 2) return 180  // 第2局结束，准备第3局
  return 0
}

/** 开始局间休息倒计时 */
function startSetBreakCountdown() {
  const duration = getSetBreakDuration()
  if (duration <= 0) return

  // 设置结束时间戳并同步到 store
  const endTime = Date.now() + duration * 1000
  matchStore.setSetBreakEndTime(endTime)

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
  const endTime = matchStore.setBreakEndTime
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
  const success = matchStore.callTimeout(team)
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
  if (timeoutTimer.value) clearInterval(timeoutTimer.value)
  timeoutTimer.value = null
  timeoutVisible.value = false
  matchStore.clearLastTimeout()
}

/** 监听远程暂停事件，自动弹出倒计时 */
watch(() => matchStore.lastTimeout, (newVal, oldVal) => {
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

  const team = newVal.team
  timeoutTeamName.value = team === leftTeam.value ? leftTeamName.value : rightTeamName.value
  timeoutCountdown.value = 30
  timeoutVisible.value = true
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

/** 监听第3局8分换边事件，远端自动弹窗 */
watch(() => matchStore.pendingSet3Swap, (newVal) => {
  if (!newVal) {
    // 远端确认了换边，关闭本地弹窗
    set3SwapVisible.value = false
    return
  }
  // 如果已经换过了，不重复弹
  if (matchStore.set3Swapped) return
  set3SwapVisible.value = true
})

/** 监听局结束，远端自动显示局间休息弹窗；远端开始下一局时关闭弹窗 */
watch(() => matchStore.isSetComplete, (val) => {
  if (val && !matchStore.isMatchComplete && !localSetComplete.value) {
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
watch(() => matchStore.setBreakEndTime, (endTime) => {
  if (endTime && setBreakVisible.value) {
    syncCountdownFromEndTime()
  }
})

/** 局间休息：开始下一局 */
function handleNextSet() {
  // 清除倒计时
  if (setBreakTimer.value) clearInterval(setBreakTimer.value)
  setBreakTimer.value = null

  localNextSet.value = true
  const newAPositions: string[] = []
  const newBPositions: string[] = []
  for (let i = 0; i < 5; i++) {
    const aId = breakTeamAIds.value[i]
    const bId = breakTeamBIds.value[i]
    newAPositions.push(aId)
    newBPositions.push(bId)
    const aPlayer = matchStore.getPlayer(aId)
    if (aPlayer) aPlayer.number = breakTeamANumbers.value[i]
    const bPlayer = matchStore.getPlayer(bId)
    if (bPlayer) bPlayer.number = breakTeamBNumbers.value[i]
  }
  matchStore.match!.teamA.startingPositions = newAPositions
  matchStore.match!.teamB.startingPositions = newBPositions
  matchStore.setNextSetPositions('A', newAPositions)
  matchStore.setNextSetPositions('B', newBPositions)
  matchStore.courtSwapped = !matchStore.courtSwapped
  const serving = needSelectServing.value ? breakServingTeam.value : matchStore.getPreviousReceiver()
  matchStore.nextSet(serving)
  setBreakVisible.value = false
  localNextSet.value = false
}

const needSelectServing = computed(() => matchStore.setsWonA === 1 && matchStore.setsWonB === 1)

const localMatchComplete = ref(false)

watch(() => matchStore.isMatchComplete, (val) => {
  if (val && !localMatchComplete.value) {
    playMatchEndSound()
    matchStore.completeMatch()
    historyStore.addMatch(matchStore.match!)
    uni.reLaunch({ url: '/pages/match-result/index' })
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

// PC端横屏模式检测
const isPcLandscapeMode = ref(false)

function checkPcLandscape() {
  // 获取系统信息
  const systemInfo = uni.getSystemInfoSync()
  const { windowWidth, windowHeight, platform } = systemInfo

  // PC端（windows 或 mac）且窗口较窄时启用横屏旋转
  if ((platform === 'windows' || platform === 'mac') && windowWidth < windowHeight) {
    isPcLandscapeMode.value = true
  } else {
    isPcLandscapeMode.value = false
  }
}

// 同步生命周期 - 仅处理心跳恢复
onShow(() => {
  // 检测PC端横屏模式
  checkPcLandscape()
  if (syncStore.status === 'connected' || syncStore.status === 'disconnected') {
    syncService.onShow()
  }
})
</script>

<template>
  <view class="page" :class="{ 'pc-landscape-mode': isPcLandscapeMode }" v-if="matchStore.isLive || matchStore.isMatchComplete">
    <!-- 球场区域 -->
    <view class="court-area">
      <!-- 左侧队伍外侧：暂停+比分+得分按钮 -->
      <view class="side-col side-col-left">
        <view class="timeout-btn timeout-btn-left" @tap="handleTimeout(leftTeam)">
          <text class="timeout-text">停{{ matchStore.getTimeouts(leftTeam) }}/2</text>
        </view>
        <view class="side-score">
          <text class="score-num left-score">{{ leftTeamScore }}</text>
        </view>
        <view class="score-btn score-btn-left" hover-class="score-btn-hover" @tap="handleScore(leftTeam)">
          <text class="score-btn-text">+1</text>
        </view>
      </view>

      <!-- 左侧队伍半场：左列后排(5,1)，右列前排(4,3,2)，面向球网(左侧) -->
      <view class="court-half court-half-left">
        <view class="court-rotated">
          <view class="rot-col">
            <view class="pos">
              <text class="pos-name" :class="{ 'captain-name': isCaptain(leftTeamRotation[4], leftTeamPlayers) }">{{ pName(leftTeamRotation[4], leftTeamPlayers) }}</text>
            </view>
            <view class="pos" :class="{ 'pos-serving': leftTeamServing }" :style="leftTeamServing ? 'border-color: #39ff14; border-width: 3rpx; background-color: rgba(57, 255, 20, 0.25)' : ''">
              <text class="pos-name" :class="{ 'captain-name': isCaptain(leftTeamRotation[0], leftTeamPlayers) }">{{ pName(leftTeamRotation[0], leftTeamPlayers) }}</text>
            </view>
          </view>
          <view class="rot-col">
            <view class="pos">
              <text class="pos-name" :class="{ 'captain-name': isCaptain(leftTeamRotation[3], leftTeamPlayers) }">{{ pName(leftTeamRotation[3], leftTeamPlayers) }}</text>
            </view>
            <view class="pos">
              <text class="pos-name" :class="{ 'captain-name': isCaptain(leftTeamRotation[2], leftTeamPlayers) }">{{ pName(leftTeamRotation[2], leftTeamPlayers) }}</text>
            </view>
            <view class="pos">
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
          <text>{{ matchStore.currentSet }}</text>
          <text>局</text>
        </view>
        <view class="net-line" />
      </view>

      <!-- 右侧队伍半场：左列前排(2,3,4)，右列后排(1,5)，面向球网(右侧) -->
      <view class="court-half court-half-right">
        <view class="court-rotated">
          <view class="rot-col">
            <view class="pos">
              <text class="pos-name" :class="{ 'captain-name': isCaptain(rightTeamRotation[1], rightTeamPlayers) }">{{ pName(rightTeamRotation[1], rightTeamPlayers) }}</text>
            </view>
            <view class="pos">
              <text class="pos-name" :class="{ 'captain-name': isCaptain(rightTeamRotation[2], rightTeamPlayers) }">{{ pName(rightTeamRotation[2], rightTeamPlayers) }}</text>
            </view>
            <view class="pos">
              <text class="pos-name" :class="{ 'captain-name': isCaptain(rightTeamRotation[3], rightTeamPlayers) }">{{ pName(rightTeamRotation[3], rightTeamPlayers) }}</text>
            </view>
          </view>
          <view class="rot-col">
            <view class="pos" :class="{ 'pos-serving': rightTeamServing }" :style="rightTeamServing ? 'border-color: #39ff14; border-width: 3rpx; background-color: rgba(57, 255, 20, 0.25)' : ''">
              <text class="pos-name" :class="{ 'captain-name': isCaptain(rightTeamRotation[0], rightTeamPlayers) }">{{ pName(rightTeamRotation[0], rightTeamPlayers) }}</text>
            </view>
            <view class="pos">
              <text class="pos-name" :class="{ 'captain-name': isCaptain(rightTeamRotation[4], rightTeamPlayers) }">{{ pName(rightTeamRotation[4], rightTeamPlayers) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 右侧队伍外侧：暂停+比分+得分按钮 -->
      <view class="side-col side-col-right">
        <view class="timeout-btn timeout-btn-right" @tap="handleTimeout(rightTeam)">
          <text class="timeout-text">停{{ matchStore.getTimeouts(rightTeam) }}/2</text>
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

    <!-- 第3局8分换边弹窗 -->
    <view v-if="set3SwapVisible" class="timeout-overlay">
      <view class="timeout-modal">
        <text class="timeout-modal-title">交换场地</text>
        <text class="set3swap-content">决胜局达到8分，请交换场地</text>
        <view class="set3swap-btn" @tap="confirmSet3Swap">
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
          <text class="sb-score">{{ matchStore.scoreA }} : {{ matchStore.scoreB }}</text>
          <text class="sb-team">{{ teamBName }}</text>
        </view>
        <text class="sb-sets">局分 {{ matchStore.setsWonA }} : {{ matchStore.setsWonB }}</text>
        <view class="sb-positions">
          <view class="sb-pos-col">
            <text class="sb-pos-label">{{ teamAName }}</text>
            <view v-for="i in 5" :key="'a'+i" class="sb-pos-row">
              <input class="sb-pos-input" :value="breakTeamANumbers[i-1]" @input="breakTeamANumbers[i-1] = $event.detail.value" placeholder="号码" />
            </view>
          </view>
          <view class="sb-pos-col">
            <text class="sb-pos-label">{{ teamBName }}</text>
            <view v-for="i in 5" :key="'b'+i" class="sb-pos-row">
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
        <text class="tb-stat">换{{ matchStore.getSubs(leftTeam) }}/5</text>
      </view>
      <view class="tb-center">
        <SyncIndicator v-if="syncStore.status !== 'idle'" />
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
        <text class="tb-team-name right-name">{{ rightTeamName }}</text>
        <text class="tb-sets">{{ rightTeamSets }}</text>
        <text class="tb-stat">换{{ matchStore.getSubs(rightTeam) }}/5</text>
      </view>
    </view>
  </view>

  <!-- 未在比赛中 -->
  <view v-else class="page empty-page">
    <text class="empty-text">暂无进行中的比赛</text>
    <view class="empty-btn" @tap="uni.navigateTo({ url: '/pages/match-setup/index' })">
      <text class="empty-btn-text">开始新比赛</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

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

// PC端强制横屏显示（窗口宽度大于600px时启用）
// 使用JavaScript检测并在onShow中设置页面样式
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

// 球场区域
.court-area {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

// 外侧比分+按钮列
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
  background-color: rgba($team-a-color, 0.04);
}

.side-col-right {
  background-color: rgba($team-b-color, 0.04);
}

// 暂停按钮
.timeout-btn {
  padding: clamp(4px, 1vw, 8rpx) clamp(8px, 2vw, 16rpx);
  border-radius: clamp(4px, 1vw, 8rpx);
  border: 1px solid;
}

.timeout-btn-left {
  border-color: $team-a-color;
  background-color: rgba($team-a-color, 0.1);
}

.timeout-btn-right {
  border-color: $team-b-color;
  background-color: rgba($team-b-color, 0.1);
}

.timeout-text {
  font-size: clamp(10px, 2vw, 18rpx);
  font-weight: bold;
}

.timeout-btn-left .timeout-text { color: $team-a-color; }
.timeout-btn-right .timeout-text { color: $team-b-color; }

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

.left-score { color: $team-a-color; }
.right-score { color: $team-b-color; }

// 半场
.court-half {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $page-padding;
}

.court-half-left {
  background-color: $bg-court;
}

.court-half-right {
  background-color: $bg-court;
}

// 旋转后的站位图
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

// 球网
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

// 得分按钮
.score-btn {
  width: $btn-width;
  height: $btn-height;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $border-radius;
}

.score-btn-left { background-color: $team-a-color; }
.score-btn-right { background-color: $team-b-color; }
.score-btn-hover { opacity: 0.8; }

.score-btn-text {
  font-size: clamp(14px, 3vw, 24rpx);
  color: $text-white;
  font-weight: bold;
}

// 底部工具栏
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

.left-name { color: $team-a-color; }
.right-name { color: $team-b-color; }

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

  &.a-win { color: $team-a-color; background-color: rgba($team-a-color, 0.1); }
  &.b-win { color: $team-b-color; background-color: rgba($team-b-color, 0.1); }
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
  color: $primary-color;
}

.tool-label {
  font-size: clamp(10px, 2vw, 16rpx);
  color: $text-secondary;
}

// 暂停倒计时弹窗
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
  color: $primary-color;
  line-height: 1;
}

.timeout-modal-unit {
  font-size: clamp(20px, 5vw, 36rpx);
  font-weight: bold;
  color: $primary-color;
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
  background-color: $primary-color;
  border-radius: $border-radius;
}

.set3swap-btn-text {
  font-size: clamp(14px, 3vw, 26rpx);
  color: $text-white;
  font-weight: bold;
}

// 空状态
.empty-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

// 局间休息弹窗（横屏适配，紧凑布局）
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
  color: $primary-color;
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
  color: $primary-color;
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
  color: $primary-color;
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
  color: $primary-color;
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
    border-color: $primary-color;
    color: $primary-color;
    background-color: rgba($primary-color, 0.1);
  }
}

.sb-action {
  width: 100%;
  padding: clamp(10px, 2.5vw, 16rpx);
  background-color: $primary-color;
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
  background-color: $primary-color;
  border-radius: $border-radius;
}

.empty-btn-text {
  font-size: $font-size-base;
  color: $text-white;
}
</style>