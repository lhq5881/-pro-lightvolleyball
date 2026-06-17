<script setup lang="ts">
import { ref, computed } from 'vue'
import { useIndoorMatchStore } from '@/stores/indoor-match'
import { useSettingsStore } from '@/stores/settings'
import { useSyncStore } from '@/stores/sync'
import { syncService } from '@/services/sync-service'
import { createPlayer } from '@/models/match'
import type { Player, TeamConfig } from '@/models/match'
import type { TeamSide } from '@/engine/indoor-scoring-engine'
import type { MatchConfig } from '@/services/sync-types'

const indoorMatchStore = useIndoorMatchStore()
const settingsStore = useSettingsStore()
const syncStore = useSyncStore()

// 室内排球6人制位置标签
const positionLabels = ['1号位', '2号位', '3号位', '4号位', '5号位', '6号位']

// 队伍A
const teamAName = ref(settingsStore.settings.defaultTeamAName)
const teamAPlayers = ref<Player[]>([
  createPlayer('', ''),
  createPlayer('', ''),
  createPlayer('', ''),
  createPlayer('', ''),
  createPlayer('', ''),
  createPlayer('', '')
])

// 队伍B
const teamBName = ref(settingsStore.settings.defaultTeamBName)
const teamBPlayers = ref<Player[]>([
  createPlayer('', ''),
  createPlayer('', ''),
  createPlayer('', ''),
  createPlayer('', ''),
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

// 先发球方
const initialServingTeam = ref<TeamSide>('A')

// 自由人号码（每队最多2名）
const teamALibero1 = ref('')
const teamALibero2 = ref('')
const teamBLibero1 = ref('')
const teamBLibero2 = ref('')

// 赛制选择：3局2胜或5局3胜
const totalSets = ref<3 | 5>(3)

/** 检查某队号码是否有重复 */
function hasDuplicateNumbers(players: Player[]): boolean {
  const numbers = players.map(p => p.number.trim()).filter(Boolean)
  return new Set(numbers).size !== numbers.length
}

/** 检查自由人号码是否与场上队员号码重复 */
function hasLiberoDuplicate(teamPlayers: Player[], libero1: string, libero2: string): boolean {
  const playerNumbers = teamPlayers.map(p => p.number.trim()).filter(Boolean)
  if (libero1.trim() && playerNumbers.includes(libero1.trim())) return true
  if (libero2.trim() && playerNumbers.includes(libero2.trim())) return true
  if (libero1.trim() && libero2.trim() && libero1.trim() === libero2.trim()) return true
  return false
}

const canStart = computed(() => {
  return teamAName.value.trim() && teamBName.value.trim()
    && teamAPlayers.value.every(p => p.number.trim())
    && teamBPlayers.value.every(p => p.number.trim())
    && !hasDuplicateNumbers(teamAPlayers.value)
    && !hasDuplicateNumbers(teamBPlayers.value)
    && !hasLiberoDuplicate(teamAPlayers.value, teamALibero1.value, teamALibero2.value)
    && !hasLiberoDuplicate(teamBPlayers.value, teamBLibero1.value, teamBLibero2.value)
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
  if (hasLiberoDuplicate(teamAPlayers.value, teamALibero1.value, teamALibero2.value)) {
    uni.showToast({ title: '自由人号码不能与队员号码重复', icon: 'none' })
    return
  }
  if (hasLiberoDuplicate(teamBPlayers.value, teamBLibero1.value, teamBLibero2.value)) {
    uni.showToast({ title: '自由人号码不能与队员号码重复', icon: 'none' })
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

  indoorMatchStore.startMatch(teamAConfig, teamBConfig, initialServingTeam.value, totalSets.value)

  // 保存自由人号码到store
  indoorMatchStore.setLiberoNumbers(teamALibero1.value.trim(), teamALibero2.value.trim(), teamBLibero1.value.trim(), teamBLibero2.value.trim())

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
      totalSets: totalSets.value
    }
    syncService.pushEvent('START_MATCH', { matchConfig })
  }

  uni.navigateTo({ url: '/pages-indoor/scoring/index' })
}
</script>

<template>
  <view class="page">
    <!-- 赛制选择 -->
    <view class="card sets-section">
      <text class="section-label">赛制</text>
      <view class="sets-options">
        <view
          class="sets-option"
          :class="{ active: totalSets === 3 }"
          @tap="totalSets = 3"
        >
          <text class="sets-option-text">三局两胜</text>
        </view>
        <view
          class="sets-option"
          :class="{ active: totalSets === 5 }"
          @tap="totalSets = 5"
        >
          <text class="sets-option-text">五局三胜</text>
        </view>
      </view>
    </view>

    <!-- 先发球方 -->
    <view class="card serve-section">
      <text class="section-label">先发球方</text>
      <view class="serve-options">
        <view
          class="serve-option team-a-option"
          :class="{ active: initialServingTeam === 'A' }"
          @tap="initialServingTeam = 'A'"
        >
          <text class="serve-option-text">{{ teamAName || '队A' }}</text>
        </view>
        <view
          class="serve-option team-b-option"
          :class="{ active: initialServingTeam === 'B' }"
          @tap="initialServingTeam = 'B'"
        >
          <text class="serve-option-text">{{ teamBName || '队B' }}</text>
        </view>
      </view>
    </view>

    <!-- 队伍A -->
    <view class="card team-section">
      <view class="team-header team-a-header">
        <text class="team-label">队伍A</text>
      </view>
      <input class="team-name-input" v-model="teamAName" placeholder="队伍A名称" />

      <view class="player-list">
        <view v-for="(player, index) in teamAPlayers" :key="player.id" class="player-row">
          <text class="pos-label">{{ positionLabels[index] }}</text>
          <input class="player-number" v-model="player.number" placeholder="号码或姓名" />
          <view class="captain-check" :class="{ active: player.isCaptain }" @tap="setTeamACaptain(index)">
            <text class="captain-text">队长</text>
          </view>
        </view>
      </view>

      <!-- 队伍A自由人设置 -->
      <view class="libero-section">
        <text class="libero-title">自由人</text>
        <view class="libero-row">
          <text class="libero-label">自由人1</text>
          <input class="libero-input" v-model="teamALibero1" placeholder="输入号码" />
        </view>
        <view class="libero-row">
          <text class="libero-label">自由人2</text>
          <input class="libero-input" v-model="teamALibero2" placeholder="输入号码（可选）" />
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
          <text class="pos-label">{{ positionLabels[index] }}</text>
          <input class="player-number" v-model="player.number" placeholder="号码或姓名" />
          <view class="captain-check" :class="{ active: player.isCaptain }" @tap="setTeamBCaptain(index)">
            <text class="captain-text">队长</text>
          </view>
        </view>
      </view>

      <!-- 队伍B自由人设置 -->
      <view class="libero-section">
        <text class="libero-title">自由人</text>
        <view class="libero-row">
          <text class="libero-label">自由人1</text>
          <input class="libero-input" v-model="teamBLibero1" placeholder="输入号码" />
        </view>
        <view class="libero-row">
          <text class="libero-label">自由人2</text>
          <input class="libero-input" v-model="teamBLibero2" placeholder="输入号码（可选）" />
        </view>
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

.team-a-header { background-color: rgba(#1565c0, 0.1); }
.team-b-header { background-color: rgba(#f44336, 0.1); }

.team-label {
  font-size: $font-base;
  font-weight: bold;
}

.team-a-header .team-label { color: #1565c0; }
.team-b-header .team-label { color: #f44336; }

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
  width: clamp(100px, 25vw, 160rpx);
  font-size: $font-sm;
  color: #1565c0;
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
    background-color: $primary-color;
    border-color: $primary-color;

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

.serve-section {
  margin-bottom: $page-padding;
}

.section-label {
  font-size: $font-base;
  font-weight: bold;
  color: $text-color;
  margin-bottom: clamp(6px, 1.5vw, 12rpx);
  display: block;
}

.sets-section {
  margin-bottom: $page-padding;
}

.sets-options {
  display: flex;
  gap: $page-padding;
}

.sets-option {
  flex: 1;
  padding: $input-padding clamp(12px, 3vw, 24rpx);
  border: 2rpx solid $border-color;
  border-radius: $border-radius;
  text-align: center;

  &.active {
    border-color: #1565c0;
    background-color: rgba(#1565c0, 0.1);
  }
}

.sets-option-text {
  font-size: $font-base;
}

.serve-options {
  display: flex;
  gap: $page-padding;
}

.serve-option {
  flex: 1;
  padding: $input-padding clamp(12px, 3vw, 24rpx);
  border: 2rpx solid $border-color;
  border-radius: $border-radius;
  text-align: center;

  &.active.team-a-option {
    border-color: #1565c0;
    background-color: rgba(#1565c0, 0.1);
  }

  &.active.team-b-option {
    border-color: #f44336;
    background-color: rgba(#f44336, 0.1);
  }
}

.serve-option-text {
  font-size: $font-base;
}

.start-btn {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: clamp(14px, 3.5vw, 28rpx) clamp(20px, 5vw, 40rpx);
  padding-bottom: calc(#{$page-padding} + env(safe-area-inset-bottom));
  background-color: #1565c0;
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

.libero-section {
  margin-top: clamp(8px, 2vw, 16rpx);
  padding-top: clamp(8px, 2vw, 16rpx);
  border-top: 1rpx solid $border-color;
}

.libero-title {
  font-size: $font-sm;
  color: $text-color;
  font-weight: bold;
  margin-bottom: clamp(6px, 1.5vw, 12rpx);
  display: block;
}

.libero-row {
  display: flex;
  align-items: center;
  gap: clamp(10px, 2.5vw, 20rpx);
  padding: clamp(4px, 1vw, 8rpx) 0;
}

.libero-label {
  width: clamp(60px, 15vw, 100rpx);
  font-size: $font-sm;
  color: $text-color;
  font-weight: bold;
}

.libero-input {
  flex: 1;
  padding: $input-padding;
  border: 2rpx solid $border-color;
  border-radius: $border-radius-sm;
  font-size: $font-sm;
}
</style>