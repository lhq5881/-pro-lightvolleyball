<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { useBeachMatchStore } from '@/stores/beach-match'
import { useHistoryStore } from '@/stores/history'
import { useSettingsStore } from '@/stores/settings'
import { useSyncStore } from '@/stores/sync'
import { feedbackScore, feedbackSetEnd, feedbackTimeout, playTimeoutSound, playTimeoutEndSound, playSwapCourtSound, playMatchEndSound, playTechTimeoutSound } from '@/utils/feedback'
import { getSwapInterval } from '@/engine/beach-game-rules'
import type { TeamSide } from '@/engine/beach-scoring-engine'
import type { Player } from '@/models/match'

const beachMatchStore = useBeachMatchStore()
const historyStore = useHistoryStore()
const settingsStore = useSettingsStore()
const syncStore = useSyncStore()

// 第一裁判员界面翻转标志
const isFlipped = ref(false)

onLoad((query) => {
  if (query?.flipped === 'true') {
    isFlipped.value = true
  }
})

// 操作端自己处理局结束跳转时设为true，防止watch重复跳转
const localSetComplete = ref(false)

const teamAName = computed(() => beachMatchStore.match?.teamA.name ?? '队A')
const teamBName = computed(() => beachMatchStore.match?.teamB.name ?? '队B')
const teamAPlayers = computed(() => beachMatchStore.match?.teamA.players ?? [])
const teamBPlayers = computed(() => beachMatchStore.match?.teamB.players ?? [])
const setResults = computed(() => beachMatchStore.scoringEngine?.setResults ?? [])

// 场地交换后，左侧显示的队伍和右侧显示的队伍
const leftTeam = computed<TeamSide>(() => {
  const baseTeam = beachMatchStore.courtSwapped ? 'B' : 'A'
  return isFlipped.value ? (baseTeam === 'A' ? 'B' : 'A') : baseTeam
})
const rightTeam = computed<TeamSide>(() => {
  const baseTeam = beachMatchStore.courtSwapped ? 'A' : 'B'
  return isFlipped.value ? (baseTeam === 'A' ? 'B' : 'A') : baseTeam
})

const leftTeamName = computed(() => leftTeam.value === 'A' ? teamAName.value : teamBName.value)
const rightTeamName = computed(() => rightTeam.value === 'A' ? teamAName.value : teamBName.value)
const leftTeamPlayers = computed(() => leftTeam.value === 'A' ? teamAPlayers.value : teamBPlayers.value)
const rightTeamPlayers = computed(() => rightTeam.value === 'A' ? teamAPlayers.value : teamBPlayers.value)
const leftTeamScore = computed(() => leftTeam.value === 'A' ? beachMatchStore.scoreA : beachMatchStore.scoreB)
const rightTeamScore = computed(() => rightTeam.value === 'A' ? beachMatchStore.scoreA : beachMatchStore.scoreB)
const leftTeamSets = computed(() => leftTeam.value === 'A' ? beachMatchStore.setsWonA : beachMatchStore.setsWonB)
const rightTeamSets = computed(() => rightTeam.value === 'A' ? beachMatchStore.setsWonA : beachMatchStore.setsWonB)
const leftTeamServing = computed(() => beachMatchStore.servingTeam === leftTeam.value)
const rightTeamServing = computed(() => beachMatchStore.servingTeam === rightTeam.value)

// 获取发球队员显示
const leftServerIndex = computed(() => leftTeam.value === 'A' ? beachMatchStore.serverIndexA : beachMatchStore.serverIndexB)
const rightServerIndex = computed(() => rightTeam.value === 'A' ? beachMatchStore.serverIndexA : beachMatchStore.serverIndexB)

function handleScore(team: TeamSide) {
  if (beachMatchStore.isMatchComplete) return
  const { soundEnabled, vibrateEnabled } = settingsStore.settings
  beachMatchStore.scorePoint(team)
  feedbackScore(soundEnabled, vibrateEnabled)
  if (beachMatchStore.isMatchComplete) {
    // 由 watch 处理比赛结束逻辑和跳转
  } else if (beachMatchStore.isSetComplete) {
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
  // 默认：接发球方先发球
  breakServingTeam.value = beachMatchStore.getPreviousReceiver()
  // 每队默认首发发球队员为当前设置的首发队员
  breakTeamAServerIndex.value = 0
  breakTeamBServerIndex.value = 0
}

function handleUndo() {
  if (!beachMatchStore.canUndo) return
  uni.showModal({
    title: '撤销',
    content: beachMatchStore.undoDescription,
    success: (res) => {
      if (res.confirm) beachMatchStore.undoAction()
    }
  })
}

function handleSwapCourts() {
  beachMatchStore.swapCourts()
  playSwapCourtSound()
}

const timeoutTimer = ref<ReturnType<typeof setInterval> | null>(null)
const timeoutCountdown = ref(30)
const timeoutVisible = ref(false)
const timeoutTeamName = ref('')
const courtSwapVisible = ref(false)
const setBreakVisible = ref(false)
const breakServingTeam = ref<'A' | 'B'>('A')
const breakTeamAServerIndex = ref(0)
const breakTeamBServerIndex = ref(0)
const localNextSet = ref(false)
// 局间休息倒计时
const setBreakCountdown = ref(0)
const setBreakTimer = ref<ReturnType<typeof setInterval> | null>(null)

// 技术暂停
const techTimeoutVisible = ref(false)
const techTimeoutCountdown = ref(30)
const techTimeoutTimer = ref<ReturnType<typeof setInterval> | null>(null)

/** 获取当前局间休息时长（秒）- 沙滩排球第2、3局1分钟 */
function getSetBreakDuration(): number {
  const currentSet = beachMatchStore.currentSet
  // 第2局、第3局休息1分钟
  if (currentSet >= 1) return 60
  return 0
}

/** 开始局间休息倒计时 */
function startSetBreakCountdown() {
  const duration = getSetBreakDuration()
  if (duration <= 0) return

  // 设置结束时间戳并同步到 store
  const endTime = Date.now() + duration * 1000
  beachMatchStore.setSetBreakEndTime(endTime)

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
  const endTime = beachMatchStore.setBreakEndTime
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
  const success = beachMatchStore.callTimeout(team)
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
  beachMatchStore.clearLastTimeout()
}

/** 监听远程暂停弹窗 */
watch(() => beachMatchStore.lastTimeout, (newVal, oldVal) => {
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
  timeoutTeamName.value = team === leftTeam.value ? leftTeamName.value : rightTeamName.value
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
      // 暂停结束时播放语音
      playTimeoutEndSound()
    }
  }, 1000)
})

/** 监听换边弹窗 */
watch(() => beachMatchStore.pendingCourtSwap, (val, oldVal) => {
  if (!val) {
    // 远端确认了换边，关闭弹窗
    if (courtSwapVisible.value) {
      courtSwapVisible.value = false
    }
    return
  }
  // 只在换边事件是新的（timestamp不同）时弹窗
  if (oldVal && val.timestamp === oldVal.timestamp) return
  // 如果本地已经在显示换边弹窗，不重复弹
  if (courtSwapVisible.value) return

  // 远程端触发了换边
  courtSwapVisible.value = true
  // 弹出提示时播放交换场地语音
  playSwapCourtSound()
})

/** 监听局结束 */
watch(() => beachMatchStore.isSetComplete, (val) => {
  if (val && !beachMatchStore.isMatchComplete && !localSetComplete.value) {
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
watch(() => beachMatchStore.setBreakEndTime, (endTime) => {
  if (endTime && setBreakVisible.value) {
    syncCountdownFromEndTime()
  }
})

function confirmCourtSwap() {
  console.log('[BeachScoring] confirmCourtSwap clicked, isHost:', syncStore.isHost, 'roomCode:', syncStore.roomCode)
  // 任何一端都可以确认换边（裁判操作）
  beachMatchStore.confirmCourtSwap(false)
  courtSwapVisible.value = false
}

/** 关闭技术暂停 */
function dismissTechTimeout() {
  if (techTimeoutTimer.value) clearInterval(techTimeoutTimer.value)
  techTimeoutTimer.value = null
  techTimeoutVisible.value = false
  // 任何一端都可以确认技术暂停（裁判操作）
  beachMatchStore.clearPendingTechTimeout()
}

/** 监听技术暂停弹窗 */
watch(() => beachMatchStore.pendingTechTimeout, (val, oldVal) => {
  console.log('[BeachScoring] watch pendingTechTimeout, val:', val, 'oldVal:', oldVal)
  if (!val) {
    // 远端关闭了技术暂停，本地也关闭
    if (techTimeoutVisible.value) {
      if (techTimeoutTimer.value) clearInterval(techTimeoutTimer.value)
      techTimeoutTimer.value = null
      techTimeoutVisible.value = false
    }
    return
  }
  // 只在技术暂停事件是新的（timestamp不同）时弹窗
  if (oldVal && val.timestamp === oldVal.timestamp) return
  // 如果本地已经在显示技术暂停弹窗，不重复弹
  if (techTimeoutVisible.value) return

  // 远程端触发了技术暂停
  console.log('[BeachScoring] 显示技术暂停弹窗')
  techTimeoutCountdown.value = 30
  techTimeoutVisible.value = true
  playTechTimeoutSound()
  if (techTimeoutTimer.value) clearInterval(techTimeoutTimer.value)
  techTimeoutTimer.value = setInterval(() => {
    techTimeoutCountdown.value--
    if (techTimeoutCountdown.value <= 0) {
      if (techTimeoutTimer.value) clearInterval(techTimeoutTimer.value)
      techTimeoutTimer.value = null
      techTimeoutVisible.value = false
      // 技术暂停结束时播放语音
      playTimeoutEndSound()
    }
  }, 1000)
})

/** 局间休息：开始下一局 */
function handleNextSet() {
  // 清除倒计时
  if (setBreakTimer.value) clearInterval(setBreakTimer.value)
  setBreakTimer.value = null

  localNextSet.value = true
  const serving = breakServingTeam.value
  const teamAServer = breakTeamAServerIndex.value
  const teamBServer = breakTeamBServerIndex.value
  const serverIdx = serving === 'A' ? teamAServer : teamBServer
  beachMatchStore.nextSet(serving, serverIdx, teamAServer, teamBServer)
  setBreakVisible.value = false
  localNextSet.value = false
}

// 决胜局（第3局）前需要重新选择发球方
const needSelectServing = computed(() => beachMatchStore.setsWonA === 1 && beachMatchStore.setsWonB === 1)

// 第一局结束且存在挑边信息时，显示提示询问挑边失利队伍
const showTossLoserHint = computed(() => {
  // 只有第一局结束时显示
  if (beachMatchStore.currentSet !== 1) return false
  // 需要有挑边信息
  if (!beachMatchStore.tossWinner) return false
  return true
})

// 挑边失利队伍名称
const tossLoserName = computed(() => {
  if (!beachMatchStore.tossWinner) return ''
  const loser = beachMatchStore.tossWinner === 'A' ? 'B' : 'A'
  return loser === 'A' ? teamAName.value : teamBName.value
})

const localMatchComplete = ref(false)

watch(() => beachMatchStore.isMatchComplete, (val) => {
  if (val && !localMatchComplete.value) {
    localMatchComplete.value = true
    playMatchEndSound()
    beachMatchStore.completeMatch()
    historyStore.addMatch(beachMatchStore.match!)
    setTimeout(() => {
      uni.reLaunch({ url: '/pages-beach/match-result/index' })
    }, 100)
  }
})

function pName(playerId: string, players: Player[]): string {
  const p = players.find(p => p.id === playerId)
  return p ? (p.number || p.name.slice(0, 2)) : '?'
}

/** 获取队员显示文本：序号+姓名 */
function playerDisplay(index: number, players: Player[]): string {
  const player = players[index]
  const romanNums = ['I', 'II']
  if (!player) return `${romanNums[index]}`
  const name = player.number || player.name.slice(0, 4)
  return `${romanNums[index]} ${name}号`
}

function isCaptain(index: number, players: Player[]): boolean {
  const player = players[index]
  return player?.isCaptain || false
}

// 获取当前局换边间隔提示
const swapIntervalText = computed(() => {
  const interval = getSwapInterval(beachMatchStore.currentSet)
  return `每${interval}分换边`
})

// PC端横屏模式检测
const isPcLandscapeMode = ref(false)

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
  <view class="page" :class="{ 'pc-landscape-mode': isPcLandscapeMode }" v-if="beachMatchStore.isLive || beachMatchStore.isMatchComplete">
    <!-- 球场区域 -->
    <view class="court-area">
      <!-- 左侧队伍外侧：暂停+比分+得分按钮 -->
      <view class="side-col side-col-left">
        <view class="timeout-btn timeout-btn-left" @tap="handleTimeout(leftTeam)">
          <text class="timeout-text">停{{ beachMatchStore.getTimeouts(leftTeam) }}/1</text>
        </view>
        <view class="side-score">
          <text class="score-num left-score">{{ leftTeamScore }}</text>
        </view>
        <view class="score-btn score-btn-left" hover-class="score-btn-hover" @tap="handleScore(leftTeam)">
          <text class="score-btn-text">+1</text>
        </view>
      </view>

      <!-- 左侧队伍半场：沙滩排球2人上下排列 -->
      <view class="court-half court-half-left">
        <view class="beach-court">
          <!-- 显示两名队员，上下排列 -->
          <view class="player-box" :class="{ serving: leftTeamServing && leftServerIndex === 0 }">
            <text class="player-num" :class="{ 'captain-name': isCaptain(0, leftTeamPlayers) }">{{ playerDisplay(0, leftTeamPlayers) }}</text>
            <text v-if="leftTeamServing && leftServerIndex === 0" class="server-tag">发球</text>
          </view>
          <view class="player-box" :class="{ serving: leftTeamServing && leftServerIndex === 1 }">
            <text class="player-num" :class="{ 'captain-name': isCaptain(1, leftTeamPlayers) }">{{ playerDisplay(1, leftTeamPlayers) }}</text>
            <text v-if="leftTeamServing && leftServerIndex === 1" class="server-tag">发球</text>
          </view>
        </view>
      </view>

      <!-- 球网 -->
      <view class="net-col">
        <view class="net-line" />
        <view class="net-label">
          <text>第</text>
          <text>{{ beachMatchStore.currentSet }}</text>
          <text>局</text>
        </view>
        <view class="net-line" />
      </view>

      <!-- 右侧队伍半场：沙滩排球2人上下排列 -->
      <view class="court-half court-half-right">
        <view class="beach-court">
          <view class="player-box" :class="{ serving: rightTeamServing && rightServerIndex === 0 }">
            <text class="player-num" :class="{ 'captain-name': isCaptain(0, rightTeamPlayers) }">{{ playerDisplay(0, rightTeamPlayers) }}</text>
            <text v-if="rightTeamServing && rightServerIndex === 0" class="server-tag">发球</text>
          </view>
          <view class="player-box" :class="{ serving: rightTeamServing && rightServerIndex === 1 }">
            <text class="player-num" :class="{ 'captain-name': isCaptain(1, rightTeamPlayers) }">{{ playerDisplay(1, rightTeamPlayers) }}</text>
            <text v-if="rightTeamServing && rightServerIndex === 1" class="server-tag">发球</text>
          </view>
        </view>
      </view>

      <!-- 右侧队伍外侧 -->
      <view class="side-col side-col-right">
        <view class="timeout-btn timeout-btn-right" @tap="handleTimeout(rightTeam)">
          <text class="timeout-text">停{{ beachMatchStore.getTimeouts(rightTeam) }}/1</text>
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

    <!-- 换边弹窗 -->
    <view v-if="courtSwapVisible" class="timeout-overlay">
      <view class="timeout-modal">
        <text class="timeout-modal-title">交换场地</text>
        <text class="swap-content">{{ swapIntervalText }}，请交换场地</text>
        <view class="swap-btn" @tap="confirmCourtSwap">
          <text class="swap-btn-text">确认换边</text>
        </view>
      </view>
    </view>

    <!-- 技术暂停弹窗 -->
    <view v-if="techTimeoutVisible" class="timeout-overlay" @tap="dismissTechTimeout">
      <view class="timeout-modal">
        <text class="timeout-modal-title">技术暂停</text>
        <view class="timeout-modal-countdown-row">
          <text class="timeout-modal-countdown">{{ techTimeoutCountdown }}</text>
          <text class="timeout-modal-unit">秒</text>
        </view>
        <text class="timeout-modal-hint">点击关闭</text>
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
          <text class="sb-score">{{ beachMatchStore.scoreA }} : {{ beachMatchStore.scoreB }}</text>
          <text class="sb-team">{{ teamBName }}</text>
        </view>
        <text class="sb-sets">局分 {{ beachMatchStore.setsWonA }} : {{ beachMatchStore.setsWonB }}</text>

        <!-- 第一局结束：提示询问挑边失利队伍 -->
        <view v-if="showTossLoserHint" class="sb-toss-hint">
          <text class="sb-toss-hint-text">请询问 {{ tossLoserName }} 选择</text>
        </view>

        <!-- 先发球方选择（每一局都显示） -->
        <view class="sb-serving">
          <text class="sb-serving-label">第{{ beachMatchStore.currentSet + 1 }}局先发球方</text>
          <view class="sb-serving-opts">
            <view :class="['sb-serving-btn', breakServingTeam === 'A' ? 'active' : '']" @tap="breakServingTeam = 'A'">
              <text>{{ teamAName }}</text>
            </view>
            <view :class="['sb-serving-btn', breakServingTeam === 'B' ? 'active' : '']" @tap="breakServingTeam = 'B'">
              <text>{{ teamBName }}</text>
            </view>
          </view>
        </view>

        <!-- 每队首发发球队员选择 -->
        <view class="sb-team-servers">
          <view class="sb-team-server">
            <text class="sb-team-server-name">{{ teamAName }} 首发发球队员</text>
            <view class="sb-serving-opts">
              <view :class="['sb-serving-btn', breakTeamAServerIndex === 0 ? 'active' : '']" @tap="breakTeamAServerIndex = 0">
                <text>I</text>
              </view>
              <view :class="['sb-serving-btn', breakTeamAServerIndex === 1 ? 'active' : '']" @tap="breakTeamAServerIndex = 1">
                <text>II</text>
              </view>
            </view>
          </view>
          <view class="sb-team-server">
            <text class="sb-team-server-name">{{ teamBName }} 首发发球队员</text>
            <view class="sb-serving-opts">
              <view :class="['sb-serving-btn', breakTeamBServerIndex === 0 ? 'active' : '']" @tap="breakTeamBServerIndex = 0">
                <text>I</text>
              </view>
              <view :class="['sb-serving-btn', breakTeamBServerIndex === 1 ? 'active' : '']" @tap="breakTeamBServerIndex = 1">
                <text>II</text>
              </view>
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
          <view class="tool-btn" @tap="handleSwapCourts">
            <text class="tool-icon">⇆</text>
            <text class="tool-label">场地互换</text>
          </view>
        </view>
      </view>
      <view class="tb-team tb-team-right">
        <text class="tb-team-name right-name">{{ rightTeamName }}</text>
        <text class="tb-sets">{{ rightTeamSets }}</text>
      </view>
    </view>
  </view>

  <!-- 未在比赛中 -->
  <view v-else class="page empty-page">
    <text class="empty-text">暂无进行中的比赛</text>
    <view class="empty-btn" @tap="uni.navigateTo({ url: '/pages-beach/match-setup/index' })">
      <text class="empty-btn-text">开始新比赛</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

$beach-color: #ff9800;
$beach-team-a: #ff9800;
$beach-team-b: #00bcd4;

.page {
  // 响应式尺寸变量 - 使用 clamp 实现自适应
  --score-size: clamp(48px, 10vw, 96px);
  --server-tag-size: clamp(10px, 2.5vw, 18px);
  --player-num-size: clamp(22px, 5vw, 40px);
  --countdown-size: clamp(64px, 15vw, 140px);

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
  width: clamp(60px, 15vw, 120px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(8px, 2vh, 16px);
  padding: clamp(8px, 1vh, 16px);
}

.side-col-left { background-color: rgba($beach-team-a, 0.04); }
.side-col-right { background-color: rgba($beach-team-b, 0.04); }

.timeout-btn {
  padding: clamp(4px, 1vh, 8px) clamp(8px, 2vw, 16px);
  border-radius: 8rpx;
  border: 2rpx solid;
}

.timeout-btn-left { border-color: $beach-team-a; background-color: rgba($beach-team-a, 0.1); }
.timeout-btn-right { border-color: $beach-team-b; background-color: rgba($beach-team-b, 0.1); }

.timeout-text { font-size: clamp(12px, 2.5vw, 20px); font-weight: bold; }
.timeout-btn-left .timeout-text { color: $beach-team-a; }
.timeout-btn-right .timeout-text { color: $beach-team-b; }

.side-score { display: flex; align-items: center; justify-content: center; }
.score-num { font-size: var(--score-size); font-weight: bold; line-height: 1; }
.left-score { color: $beach-team-a; }
.right-score { color: $beach-team-b; }

.court-half {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(4px, 1vh, 12px);
}

.court-half-left { background-color: #fff8e1; }
.court-half-right { background-color: #e0f7fa; }

.beach-court {
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 3vh, 28px);
  border-radius: $border-radius-sm;
  padding: clamp(12px, 3vh, 28px) clamp(16px, 4vw, 36px);
  background-color: rgba(255, 255, 255, 0.85);
}

.player-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(12px, 2.5vh, 24px) clamp(24px, 5vw, 48px);
  border-radius: 10rpx;
  background-color: $bg-white;

  &.serving {
    border: 3rpx solid #39ff14;
    background-color: rgba(57, 255, 20, 0.25);
  }
}

.player-num { font-size: var(--player-num-size); color: $text-color; font-weight: bold; white-space: nowrap; }
.player-num.captain-name { border-bottom: 2rpx solid $primary-color; padding-bottom: 2rpx; }
.server-tag { font-size: var(--server-tag-size); color: #39ff14; font-weight: bold; margin-top: 4rpx; }

.net-col {
  width: clamp(20px, 5vw, 36px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.03);
}

.net-line { flex: 1; width: 4rpx; background-color: #333; }

.net-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: clamp(10px, 2vw, 18px);
  color: $text-light;
  padding: 6rpx 0;
  gap: 2rpx;
}

.score-btn {
  width: clamp(48px, 12vw, 100px);
  height: clamp(36px, 8vh, 72px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $border-radius;
}

.score-btn-left { background-color: $beach-team-a; }
.score-btn-right { background-color: $beach-team-b; }
.score-btn-hover { opacity: 0.8; }
.score-btn-text { font-size: clamp(16px, 4vw, 28px); color: $text-white; font-weight: bold; }

.toolbar {
  height: clamp(36px, 8vh, 72px);
  display: flex;
  align-items: center;
  background-color: $bg-white;
  border-top: 1rpx solid $border-color;
  padding: 0 clamp(8px, 2vw, 16px);
}

.tb-team { display: flex; align-items: center; gap: 6rpx; }
.tb-team-name { font-size: clamp(12px, 2.5vw, 20px); font-weight: bold; }
.left-name { color: $beach-team-a; }
.right-name { color: $beach-team-b; }
.tb-sets { font-size: clamp(14px, 3vw, 24px); font-weight: bold; color: $text-color; }

.tb-center { display: flex; align-items: center; gap: 8rpx; margin: 0 auto; }
.tb-set-scores { display: flex; gap: 6rpx; }

.tb-set-item {
  font-size: clamp(10px, 2vw, 16px);
  color: $text-light;
  padding: 0 6rpx;
  border-radius: 4rpx;
  background-color: $bg-color;
  &.a-win { color: $beach-team-a; background-color: rgba($beach-team-a, 0.1); }
  &.b-win { color: $beach-team-b; background-color: rgba($beach-team-b, 0.1); }
}

.tb-tools { display: flex; align-items: center; gap: 16rpx; margin-left: auto; }
.tool-btn { display: flex; flex-direction: row; align-items: center; gap: 4rpx; padding: 4rpx 8rpx; }
.tool-icon { font-size: clamp(14px, 3vw, 24px); color: $beach-color; }
.tool-label { font-size: clamp(10px, 2vw, 18px); color: $text-secondary; }

.timeout-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: clamp(16px, 4vw, 32px);
  box-sizing: border-box;
}

.timeout-modal {
  width: 70%;
  max-width: 350px;
  min-width: 200px;
  max-height: 80vh;
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  padding: clamp(16px, 4vw, 32px) clamp(12px, 3vw, 24px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.timeout-modal-title { font-size: clamp(18px, 4vw, 32px); font-weight: bold; color: $text-color; margin-bottom: 12rpx; }
.timeout-modal-countdown-row { display: flex; align-items: baseline; }
.timeout-modal-countdown { font-size: var(--countdown-size); font-weight: bold; color: $beach-color; line-height: 1; }
.timeout-modal-unit { font-size: clamp(20px, 5vw, 40px); font-weight: bold; color: $beach-color; margin-left: 8rpx; }
.timeout-modal-hint { font-size: clamp(12px, 2.5vw, 22px); color: $text-light; margin-top: 12rpx; }

.swap-content { font-size: clamp(14px, 3vw, 26px); color: $text-color; margin-bottom: 16rpx; }
.swap-btn { padding: clamp(8px, 2vh, 16px) clamp(24px, 6vw, 48px); background-color: $beach-color; border-radius: $border-radius; }
.swap-btn-text { font-size: clamp(14px, 3vw, 26px); color: $text-white; font-weight: bold; }

.empty-page { display: flex; flex-direction: column; align-items: center; justify-content: center; }
.empty-text { font-size: clamp(14px, 3vw, 18px); color: $text-light; margin-bottom: $spacing-md; }
.empty-btn { padding: $spacing-sm $spacing-xl; background-color: $beach-color; border-radius: $border-radius; }
.empty-btn-text { font-size: clamp(14px, 3vw, 18px); color: $text-white; }

.sb-modal {
  width: 85%;
  max-width: 400px;
  max-height: 90vh;
  background-color: $bg-white;
  border-radius: 12rpx;
  padding: clamp(12px, 3vw, 24px) clamp(10px, 2.5vw, 20px);
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
}

.sb-title { font-size: clamp(16px, 3.5vw, 28px); font-weight: bold; color: $beach-color; margin-bottom: 10rpx; }
.sb-countdown { display: flex; justify-content: center; margin-bottom: 10rpx; }
.sb-countdown-num { font-size: clamp(28px, 6vw, 48px); font-weight: bold; color: $beach-color; }
.sb-score-row { display: flex; align-items: center; gap: 12rpx; margin-bottom: 8rpx; }
.sb-team { font-size: clamp(12px, 2.5vw, 24px); color: $text-color; }
.sb-score { font-size: clamp(20px, 5vw, 40px); font-weight: bold; color: $text-color; }
.sb-sets { font-size: clamp(12px, 2.5vw, 22px); color: $text-secondary; margin-bottom: 10rpx; }

.sb-toss-hint {
  width: 100%;
  padding: clamp(8px, 2vw, 16px);
  background-color: rgba($beach-color, 0.1);
  border-radius: $border-radius-sm;
  margin-bottom: 10rpx;
  text-align: center;
}

.sb-toss-hint-text {
  font-size: clamp(14px, 3vw, 26px);
  color: $beach-color;
  font-weight: bold;
}

.sb-serving { width: 100%; margin-bottom: 10rpx; }
.sb-serving-label { font-size: clamp(12px, 2.5vw, 22px); color: $text-color; text-align: center; display: block; margin-bottom: 6rpx; }
.sb-serving-opts { display: flex; gap: 10rpx; justify-content: center; margin-bottom: 8rpx; }

.sb-serving-btn {
  padding: clamp(6px, 1.5vh, 12px) clamp(12px, 3vw, 24px);
  border: 1rpx solid $border-color;
  border-radius: 6rpx;
  font-size: clamp(12px, 2.5vw, 22px);
  color: $text-color;
  &.active { border-color: $beach-color; color: $beach-color; background-color: rgba($beach-color, 0.1); }
  &.disabled { opacity: 0.5; color: $text-light; }
}

.sb-team-servers {
  width: 100%;
  margin-bottom: 12rpx;
}

.sb-team-server {
  margin-bottom: 10rpx;
}

.sb-team-server-name {
  font-size: clamp(12px, 2.5vw, 22px);
  color: $text-secondary;
  display: block;
  text-align: center;
  margin-bottom: 6rpx;
}

.sb-action { width: 100%; padding: clamp(10px, 2vh, 18px); background-color: $beach-color; border-radius: 8rpx; text-align: center; }
.sb-action-text { font-size: clamp(14px, 3vw, 28px); color: $text-white; font-weight: bold; }
</style>