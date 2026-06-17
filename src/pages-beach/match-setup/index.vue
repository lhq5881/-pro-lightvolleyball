<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBeachMatchStore } from '@/stores/beach-match'
import { useSettingsStore } from '@/stores/settings'
import { useSyncStore } from '@/stores/sync'
import { syncService } from '@/services/sync-service'
import { createPlayer } from '@/models/match'
import type { Player, TeamConfig } from '@/models/match'
import type { TeamSide } from '@/engine/beach-scoring-engine'
import type { MatchConfig } from '@/services/sync-types'

const beachMatchStore = useBeachMatchStore()
const settingsStore = useSettingsStore()
const syncStore = useSyncStore()

// 队伍A
const teamAName = ref(settingsStore.settings.defaultTeamAName)
const teamAPlayers = ref<Player[]>([
  createPlayer('', ''),
  createPlayer('', '')
])

// 队伍B
const teamBName = ref(settingsStore.settings.defaultTeamBName)
const teamBPlayers = ref<Player[]>([
  createPlayer('', ''),
  createPlayer('', '')
])

/** 设置队伍A队长（只能有一人） */
function setTeamACaptain(index: number) {
  teamAPlayers.value.forEach((p, i) => {
    p.isCaptain = (i === index)
  })
}

/** 设置队伍B队长（只能有一人） */
function setTeamBCaptain(index: number) {
  teamBPlayers.value.forEach((p, i) => {
    p.isCaptain = (i === index)
  })
}

// 挑边获胜队
const tossWinner = ref<TeamSide>('A')
// 挑边获胜队的选择：'serve' = 选择发球，'receive' = 选择接发球（即选择场地）
const tossWinnerChoice = ref<'serve' | 'receive'>('serve')

// 计算先发球方：如果挑边获胜队选择发球，则获胜队先发球；否则另一队先发球
const initialServingTeam = computed<TeamSide>(() => {
  if (tossWinnerChoice.value === 'serve') {
    return tossWinner.value
  } else {
    return tossWinner.value === 'A' ? 'B' : 'A'
  }
})

// 各队首发发球队员索引（0=1号，1=2号）
const teamAServerIndex = ref(0)
const teamBServerIndex = ref(0)

/** 检查某队号码是否有重复 */
function hasDuplicateNumbers(players: Player[]): boolean {
  const numbers = players.map(p => p.number.trim()).filter(Boolean)
  return new Set(numbers).size !== numbers.length
}

const canStart = computed(() => {
  return teamAName.value.trim() && teamBName.value.trim()
    && teamAPlayers.value.every(p => p.number.trim())
    && teamBPlayers.value.every(p => p.number.trim())
    && !hasDuplicateNumbers(teamAPlayers.value)
    && !hasDuplicateNumbers(teamBPlayers.value)
    && teamAPlayers.value.some(p => p.isCaptain)
    && teamBPlayers.value.some(p => p.isCaptain)
})

const hasTeamACaptain = computed(() => teamAPlayers.value.some(p => p.isCaptain))
const hasTeamBCaptain = computed(() => teamBPlayers.value.some(p => p.isCaptain))

/** 开始比赛 */
function startMatch() {
  if (!canStart.value) return

  if (hasDuplicateNumbers(teamAPlayers.value)) {
    uni.showToast({ title: '队A号码不能重复', icon: 'none' })
    return
  }
  if (hasDuplicateNumbers(teamBPlayers.value)) {
    uni.showToast({ title: '队B号码不能重复', icon: 'none' })
    return
  }

  if (!hasTeamACaptain.value) {
    uni.showToast({ title: '请设置队长', icon: 'none' })
    return
  }
  if (!hasTeamBCaptain.value) {
    uni.showToast({ title: '请设置队长', icon: 'none' })
    return
  }

  // 如果队伍名称为空，使用默认名称
  if (!teamAName.value.trim()) teamAName.value = '队A'
  if (!teamBName.value.trim()) teamBName.value = '队B'

  const teamAConfig: TeamConfig = {
    name: teamAName.value.trim(),
    players: [...teamAPlayers.value],
    startingPositions: teamAPlayers.value.map(p => p.id)
  }

  const teamBConfig: TeamConfig = {
    name: teamBName.value.trim(),
    players: [...teamBPlayers.value],
    startingPositions: teamBPlayers.value.map(p => p.id)
  }

  // 传递两个队的首发发球队员和挑边信息
  beachMatchStore.startMatch(
    teamAConfig,
    teamBConfig,
    initialServingTeam.value,
    teamAServerIndex.value,
    teamBServerIndex.value,
    tossWinner.value,
    tossWinnerChoice.value
  )

  // 同步模式下推送 START_MATCH 事件通知加入端
  if (syncStore.status === 'connected') {
    const matchConfig: MatchConfig = {
      teamAName: teamAConfig.name,
      teamAPlayers: teamAConfig.players,
      teamAStartingPositions: teamAConfig.startingPositions,
      teamBName: teamBConfig.name,
      teamBPlayers: teamBConfig.players,
      teamBStartingPositions: teamBConfig.startingPositions,
      initialServingTeam: initialServingTeam.value,
      teamABenchPlayers: [],
      teamBBenchPlayers: [],
      teamAInitialServer: teamAServerIndex.value,
      teamBInitialServer: teamBServerIndex.value,
      tossWinner: tossWinner.value,
      tossWinnerChoice: tossWinnerChoice.value
    }
    syncService.pushEvent('START_MATCH', { matchConfig })
  }

  uni.navigateTo({ url: '/pages-beach/scoring/index' })
}
</script>

<template>
  <view class="page">
    <!-- 队伍A -->
    <view class="card team-section">
      <view class="team-header team-a-header">
        <text class="team-label">队伍A</text>
      </view>
      <input class="team-name-input" v-model="teamAName" placeholder="队伍A名称" />

      <view class="player-list">
        <view v-for="(player, index) in teamAPlayers" :key="player.id" class="player-row">
          <text class="pos-label">{{ index + 1 }}号</text>
          <input class="player-number" v-model="player.number" placeholder="可不用输入姓名" />
          <view class="captain-check" :class="{ active: player.isCaptain }" @tap="setTeamACaptain(index)">
            <text class="captain-text">队长</text>
          </view>
        </view>
      </view>

      <!-- 首发发球队员选择 -->
      <view class="server-select">
        <text class="server-label">先发球：</text>
        <view class="server-options">
          <view
            class="server-option"
            :class="{ active: teamAServerIndex === 0 }"
            @tap="teamAServerIndex = 0"
          >
            <text>1号</text>
          </view>
          <view
            class="server-option"
            :class="{ active: teamAServerIndex === 1 }"
            @tap="teamAServerIndex = 1"
          >
            <text>2号</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 队伍B -->
    <view class="card team-section">
      <view class="team-header team-b-header">
        <text class="team-label">队伍B</text>
      </view>
      <input class="team-name-input" v-model="teamBName" placeholder="队伍B名称" />

      <view class="player-list">
        <view v-for="(player, index) in teamBPlayers" :key="player.id" class="player-row">
          <text class="pos-label">{{ index + 1 }}号</text>
          <input class="player-number" v-model="player.number" placeholder="可不用输入姓名" />
          <view class="captain-check" :class="{ active: player.isCaptain }" @tap="setTeamBCaptain(index)">
            <text class="captain-text">队长</text>
          </view>
        </view>
      </view>

      <!-- 首发发球队员选择 -->
      <view class="server-select">
        <text class="server-label">先发球：</text>
        <view class="server-options">
          <view
            class="server-option"
            :class="{ active: teamBServerIndex === 0 }"
            @tap="teamBServerIndex = 0"
          >
            <text>1号</text>
          </view>
          <view
            class="server-option"
            :class="{ active: teamBServerIndex === 1 }"
            @tap="teamBServerIndex = 1"
          >
            <text>2号</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 挑边 -->
    <view class="card toss-section">
      <text class="section-label">挑边</text>
      <view class="toss-row">
        <text class="toss-label">获胜队：</text>
        <view class="toss-options">
          <view
            class="toss-option team-a-option"
            :class="{ active: tossWinner === 'A' }"
            @tap="tossWinner = 'A'"
          >
            <text>{{ teamAName || '队A' }}</text>
          </view>
          <view
            class="toss-option team-b-option"
            :class="{ active: tossWinner === 'B' }"
            @tap="tossWinner = 'B'"
          >
            <text>{{ teamBName || '队B' }}</text>
          </view>
        </view>
      </view>
      <view class="toss-row">
        <text class="toss-label">选择：</text>
        <view class="toss-options">
          <view
            class="toss-option"
            :class="{ active: tossWinnerChoice === 'serve' }"
            @tap="tossWinnerChoice = 'serve'"
          >
            <text>发球</text>
          </view>
          <view
            class="toss-option"
            :class="{ active: tossWinnerChoice === 'receive' }"
            @tap="tossWinnerChoice = 'receive'"
          >
            <text>接发球</text>
          </view>
        </view>
      </view>
      <view class="toss-result">
        <text class="toss-result-text">先发球方：{{ initialServingTeam === 'A' ? (teamAName || '队A') : (teamBName || '队B') }}</text>
      </view>
    </view>

    <!-- 开始按钮 -->
    <view class="start-btn" :class="{ disabled: !canStart }" @tap="startMatch">
      <text class="start-text">开始比赛</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

$beach-color: #ff9800;
$beach-team-a: #ff9800;
$beach-team-b: #00bcd4;

// 响应式尺寸变量
$page-padding: clamp(12px, 3vw, 24rpx);
$input-padding: clamp(8px, 2vw, 16rpx);
$font-base: clamp(14px, 3.5vw, 28rpx);
$font-sm: clamp(12px, 3vw, 24rpx);
$font-xs: clamp(10px, 2.5vw, 20rpx);

.page {
  min-height: 100vh;
  padding: $page-padding;
  padding-bottom: clamp(80px, 15vh, 200rpx);
}

.team-section {
  margin-bottom: $page-padding;
}

.team-header {
  padding: clamp(6px, 1.5vw, 12rpx) clamp(10px, 2.5vw, 20rpx);
  border-radius: $border-radius-sm;
  margin-bottom: clamp(6px, 1.5vw, 12rpx);
}

.team-a-header { background-color: rgba($beach-team-a, 0.1); }
.team-b-header { background-color: rgba($beach-team-b, 0.1); }

.team-label {
  font-size: $font-base;
  font-weight: bold;
}

.team-a-header .team-label { color: $beach-team-a; }
.team-b-header .team-label { color: $beach-team-b; }

.team-name-input {
  width: 100%;
  padding: $input-padding;
  border: 2rpx solid $border-color;
  border-radius: $border-radius-sm;
  font-size: $font-base;
  margin-bottom: clamp(6px, 1.5vw, 12rpx);
}

.player-list {
  margin-bottom: clamp(4px, 1vw, 8rpx);
}

.player-row {
  display: flex;
  align-items: center;
  gap: clamp(6px, 1.5vw, 12rpx);
  margin-bottom: clamp(4px, 1vw, 8rpx);
}

.pos-label {
  width: clamp(50px, 12vw, 80rpx);
  font-size: $font-sm;
  color: $beach-color;
  font-weight: bold;
}

.player-number {
  flex: 1;
  padding: $input-padding;
  border: 2rpx solid $border-color;
  border-radius: $border-radius-sm;
  font-size: $font-sm;
}

.captain-check {
  padding: clamp(4px, 1vw, 8rpx) clamp(8px, 2vw, 16rpx);
  border: 2rpx solid $border-color;
  border-radius: $border-radius-sm;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: clamp(50px, 12vw, 80rpx);

  &.active {
    background-color: $beach-color;
    border-color: $beach-color;

    .captain-text {
      color: #fff;
    }
  }
}

.captain-text {
  font-size: $font-xs;
  color: $text-light;
  font-weight: bold;
}

.server-select {
  display: flex;
  align-items: center;
  gap: clamp(8px, 2vw, 16rpx);
  margin-top: clamp(6px, 1.5vw, 12rpx);
}

.server-label {
  font-size: $font-sm;
  color: $text-color;
  font-weight: bold;
}

.server-options {
  display: flex;
  gap: clamp(6px, 1.5vw, 12rpx);
}

.server-option {
  padding: $input-padding clamp(12px, 3vw, 24rpx);
  border: 2rpx solid $border-color;
  border-radius: $border-radius-sm;
  font-size: $font-sm;

  &.active {
    border-color: $beach-color;
    background-color: rgba($beach-color, 0.1);
    color: $beach-color;
  }
}

.section-label {
  font-size: $font-base;
  font-weight: bold;
  color: $text-color;
  margin-bottom: clamp(6px, 1.5vw, 12rpx);
  display: block;
}

.toss-section {
  margin-bottom: $page-padding;
}

.toss-row {
  display: flex;
  align-items: center;
  gap: clamp(8px, 2vw, 16rpx);
  margin-bottom: clamp(6px, 1.5vw, 12rpx);
}

.toss-label {
  font-size: $font-sm;
  color: $text-color;
  font-weight: bold;
  width: clamp(80px, 20vw, 120rpx);
}

.toss-options {
  display: flex;
  gap: clamp(8px, 2vw, 16rpx);
}

.toss-option {
  padding: $input-padding clamp(12px, 3vw, 24rpx);
  border: 2rpx solid $border-color;
  border-radius: $border-radius-sm;
  font-size: $font-sm;
  text-align: center;

  &.active {
    border-color: $beach-color;
    background-color: rgba($beach-color, 0.1);
    color: $beach-color;
  }

  &.active.team-a-option {
    border-color: $beach-team-a;
    background-color: rgba($beach-team-a, 0.1);
    color: $beach-team-a;
  }

  &.active.team-b-option {
    border-color: $beach-team-b;
    background-color: rgba($beach-team-b, 0.1);
    color: $beach-team-b;
  }
}

.toss-result {
  padding: $input-padding;
  background-color: rgba($beach-color, 0.05);
  border-radius: $border-radius-sm;
  text-align: center;
}

.toss-result-text {
  font-size: $font-sm;
  color: $beach-color;
  font-weight: bold;
}

.start-btn {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: clamp(14px, 3.5vw, 28rpx) clamp(20px, 5vw, 40rpx);
  padding-bottom: calc(#{$page-padding} + env(safe-area-inset-bottom));
  background-color: $beach-color;
  text-align: center;

  &.disabled {
    background-color: #ccc;
  }
}

.start-text {
  font-size: clamp(16px, 4vw, 32rpx);
  color: $text-white;
  font-weight: bold;
}
</style>