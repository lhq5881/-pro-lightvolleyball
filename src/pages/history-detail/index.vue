<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useHistoryStore } from '@/stores/history'
import type { Match, SetScore, SetPlayerInfo } from '@/models/match'

const historyStore = useHistoryStore()
const matchId = ref('')
const match = ref<Match | null>(null)

onLoad((options) => {
  historyStore.loadHistory()
  if (options?.id) {
    matchId.value = options.id
    match.value = historyStore.getMatchById(options.id) ?? null
  }
})

const teamAName = computed(() => match.value?.teamA.name ?? '队A')
const teamBName = computed(() => match.value?.teamB.name ?? '队B')

function formatDate(timestamp: number): string {
  const d = new Date(timestamp)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getDuration(): string {
  if (!match.value?.endTime) return '进行中'
  const diff = match.value.endTime - match.value.startTime
  const minutes = Math.floor(diff / 60000)
  return `${minutes}分钟`
}

function getPlayerDisplay(player: { number: string; name: string }): string {
  return player.number ? `${player.number} ${player.name}` : player.name
}

/** 生成每局的逐球比分变化序列 */
function getPointProgress(set: SetScore): string[] {
  if (!set.pointLog || set.pointLog.length === 0) return []
  const progress: string[] = []
  let a = 0, b = 0
  for (const team of set.pointLog) {
    if (team === 'A') a++
    else b++
    progress.push(`${a}:${b}`)
  }
  return progress
}
</script>

<template>
  <view class="page" v-if="match">
    <!-- 比赛信息 -->
    <view class="card info-card">
      <text class="info-date">{{ formatDate(match.startTime) }}</text>
      <text class="info-duration">时长：{{ getDuration() }}</text>
    </view>

    <!-- 比分总览 -->
    <view class="card score-card">
      <view class="score-row">
        <view class="score-team">
          <text class="score-team-name team-a-name">{{ teamAName }}</text>
        </view>
        <view class="score-center">
          <text class="score-total">{{ match.setsWonA }} : {{ match.setsWonB }}</text>
        </view>
        <view class="score-team">
          <text class="score-team-name team-b-name">{{ teamBName }}</text>
        </view>
      </view>
    </view>

    <!-- 各局比分 -->
    <view class="card sets-card">
      <text class="sets-title">各局比分</text>
      <view
        v-for="(set, index) in match.setScores"
        :key="index"
        class="set-row"
      >
        <text class="set-label">第{{ index + 1 }}局</text>
        <text class="set-score-a" :class="{ 'set-winner': set.winner === 'A' }">{{ set.scoreA }}</text>
        <text class="set-divider">:</text>
        <text class="set-score-b" :class="{ 'set-winner': set.winner === 'B' }">{{ set.scoreB }}</text>
        <text class="set-winner-label">{{ set.winner === 'A' ? teamAName : teamBName }}胜</text>
      </view>
    </view>

    <!-- 逐球得分详情 -->
    <view
      v-for="(set, index) in match.setScores"
      :key="'detail-' + index"
      class="card point-detail-card"
    >
      <view class="point-detail-header">
        <text class="point-detail-title">第{{ index + 1 }}局 得分过程</text>
        <text class="point-detail-result">{{ set.scoreA }}:{{ set.scoreB }}</text>
      </view>
      <view class="point-flow">
        <view
          v-for="(score, pi) in getPointProgress(set)"
          :key="pi"
          class="point-step"
          :class="{ 'point-a': set.pointLog[pi] === 'A', 'point-b': set.pointLog[pi] === 'B' }"
        >
          <text class="point-score">{{ score }}</text>
        </view>
      </view>
    </view>

    <!-- 各局人员统计 -->
    <view
      v-for="(set, index) in match.setScores"
      :key="'players-' + index"
      class="card players-card"
    >
      <text class="players-set-title">第{{ index + 1 }}局 人员统计</text>
      <view class="players-section">
        <text class="players-team-name team-a-name">{{ teamAName }}</text>
        <view class="player-group" v-if="set.teamAPlayers?.startingPlayers?.length">
          <text class="player-group-label">首发</text>
          <view class="players-list">
            <text v-for="player in set.teamAPlayers.startingPlayers" :key="player.id" class="player-item">
              {{ getPlayerDisplay(player) }}
            </text>
          </view>
        </view>
        <view class="player-group" v-if="set.teamAPlayers?.subPlayers?.length">
          <text class="player-group-label sub-label">替补</text>
          <view class="players-list">
            <text v-for="player in set.teamAPlayers.subPlayers" :key="player.id" class="player-item">
              {{ getPlayerDisplay(player) }}
            </text>
          </view>
        </view>
      </view>
      <view class="players-divider" />
      <view class="players-section">
        <text class="players-team-name team-b-name">{{ teamBName }}</text>
        <view class="player-group" v-if="set.teamBPlayers?.startingPlayers?.length">
          <text class="player-group-label">首发</text>
          <view class="players-list">
            <text v-for="player in set.teamBPlayers.startingPlayers" :key="player.id" class="player-item">
              {{ getPlayerDisplay(player) }}
            </text>
          </view>
        </view>
        <view class="player-group" v-if="set.teamBPlayers?.subPlayers?.length">
          <text class="player-group-label sub-label">替补</text>
          <view class="players-list">
            <text v-for="player in set.teamBPlayers.subPlayers" :key="player.id" class="player-item">
              {{ getPlayerDisplay(player) }}
            </text>
          </view>
        </view>
      </view>
    </view>
  </view>

  <view v-else class="page empty-page">
    <text class="empty-text">未找到比赛记录</text>
  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.page {
  min-height: 100vh;
  padding: $spacing-base;
}

.info-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-date {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.info-duration {
  font-size: $font-size-sm;
  color: $text-light;
}

.score-card {
  padding: $spacing-md;
}

.score-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.score-team {
  flex: 1;
  display: flex;
  justify-content: center;
}

.score-team-name {
  font-size: $font-size-md;
  font-weight: bold;
}

.team-a-name { color: $team-a-color; }
.team-b-name { color: $team-b-color; }

.score-center {
  padding: 0 $spacing-md;
}

.score-total {
  font-size: $font-size-xl;
  font-weight: bold;
  color: $text-color;
}

.sets-card {
  padding: $spacing-base;
}

.sets-title {
  font-size: $font-size-base;
  font-weight: bold;
  color: $text-color;
  margin-bottom: $spacing-sm;
  display: block;
}

.set-row {
  display: flex;
  align-items: center;
  padding: $spacing-sm 0;
  border-bottom: 1rpx solid $border-color;

  &:last-child { border-bottom: none; }
}

.set-label {
  width: 100rpx;
  font-size: $font-size-sm;
  color: $text-secondary;
}

.set-score-a, .set-score-b {
  font-size: $font-size-md;
  font-weight: bold;
  color: $text-secondary;
  min-width: 60rpx;
  text-align: center;

  &.set-winner { color: $primary-color; }
}

.set-divider {
  font-size: $font-size-base;
  color: $text-light;
  margin: 0 $spacing-xs;
}

.set-winner-label {
  flex: 1;
  text-align: right;
  font-size: $font-size-sm;
  color: $text-light;
}

.players-card {
  padding: $spacing-base;
}

.players-set-title {
  font-size: $font-size-base;
  font-weight: bold;
  color: $text-color;
  margin-bottom: $spacing-sm;
  display: block;
}

.players-section {
  padding: $spacing-sm 0;
}

.players-team-name {
  font-size: $font-size-base;
  font-weight: bold;
  margin-bottom: $spacing-xs;
  display: block;
}

.player-group {
  margin-bottom: $spacing-xs;
}

.player-group-label {
  font-size: $font-size-xs;
  color: $primary-color;
  font-weight: bold;
  margin-bottom: $spacing-xs;
  display: block;
}

.sub-label {
  color: $text-light;
}

.players-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.player-item {
  font-size: $font-size-sm;
  color: $text-secondary;
  padding: $spacing-xs $spacing-sm;
  background-color: $bg-color;
  border-radius: $border-radius-sm;
}

.players-divider {
  height: 1rpx;
  background-color: $border-color;
  margin: $spacing-sm 0;
}

.empty-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-text {
  font-size: $font-size-base;
  color: $text-light;
}

// 逐球得分详情
.point-detail-card {
  margin-bottom: $spacing-base;
}

.point-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-sm;
}

.point-detail-title {
  font-size: $font-size-base;
  font-weight: bold;
  color: $text-color;
}

.point-detail-result {
  font-size: $font-size-sm;
  color: $text-light;
}

.point-flow {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.point-step {
  min-width: 64rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6rpx;
  padding: 0 8rpx;
}

.point-step.point-a {
  background-color: rgba(26, 107, 60, 0.12);
}

.point-step.point-b {
  background-color: rgba(231, 76, 60, 0.12);
}

.point-score {
  font-size: $font-size-sm;
  font-weight: bold;
}

.point-a .point-score {
  color: #1a6b3c;
}

.point-b .point-score {
  color: #e74c3c;
}
</style>