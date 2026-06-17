<template>
  <view class="set-break-page">
    <!-- 局间休息弹窗 -->
    <view v-if="matchStore.isSetComplete && !matchStore.isMatchComplete" class="overlay">
      <view class="dialog">
        <view class="title">第{{ matchStore.currentSetIndex + 1 }}局结束</view>
        <view class="score-summary">
          <text class="team-name">{{ matchStore.teamAName }}</text>
          <text class="score">{{ lastSetResult.scoreA }} : {{ lastSetResult.scoreB }}</text>
          <text class="team-name">{{ matchStore.teamBName }}</text>
        </view>
        <view class="total-score">
          当前局分 {{ matchStore.setResults.filter(s => s.winner === 'A').length }} : {{ matchStore.setResults.filter(s => s.winner === 'B').length }}
        </view>

        <!-- 站位调整 -->
        <view class="positions-section">
          <view class="pos-team">
            <text class="pos-label">{{ matchStore.teamAName }}站位</text>
            <view class="pos-grid">
              <view
                v-for="pos in 6" :key="'a' + pos"
                class="pos-slot"
                @tap="rotatePosition('A', pos - 1)"
              >
                <text class="pos-num">{{ pos }}</text>
                <text class="pos-name">{{ getPlayerName('A', pos - 1) }}</text>
              </view>
            </view>
          </view>
          <view class="pos-team">
            <text class="pos-label">{{ matchStore.teamBName }}站位</text>
            <view class="pos-grid">
              <view
                v-for="pos in 6" :key="'b' + pos"
                class="pos-slot"
                @tap="rotatePosition('B', pos - 1)"
              >
                <text class="pos-num">{{ pos }}</text>
                <text class="pos-name">{{ getPlayerName('B', pos - 1) }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 发球方选择 -->
        <view class="serving-section">
          <text class="serving-label">下一局发球方</text>
          <view class="serving-options">
            <view
              :class="['serving-btn', servingTeam === 'A' ? 'active' : '']"
              @tap="servingTeam = 'A'"
            >{{ matchStore.teamAName }}</view>
            <view
              :class="['serving-btn', servingTeam === 'B' ? 'active' : '']"
              @tap="servingTeam = 'B'"
            >{{ matchStore.teamBName }}</view>
          </view>
        </view>

        <view class="action-btn" @tap="handleNextSet">
          <text>开始下一局</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMatchStore } from '@/stores/match'
import { useSyncStore } from '@/stores/sync'
import { syncService } from '@/services/sync-service'
import type { MatchConfig } from '@/services/sync-types'

const matchStore = useMatchStore()
const syncStore = useSyncStore()
const servingTeam = ref<'A' | 'B'>('A')
const localNextSet = ref(false)

const lastSetResult = computed(() => {
  const results = matchStore.scoringEngine?.setResults ?? []
  return results.length > 0 ? results[results.length - 1] : { scoreA: 0, scoreB: 0, winner: 'A' as const }
})

function getPlayerName(team: 'A' | 'B', pos: number): string {
  const positions = team === 'A'
    ? matchStore.scoringEngine?.state.teamAStartingPositions
    : matchStore.scoringEngine?.state.teamBStartingPositions
  if (!positions) return ''
  const playerId = positions[pos]
  const players = team === 'A'
    ? matchStore.scoringEngine?.state.teamAPlayers
    : matchStore.scoringEngine?.state.teamBPlayers
  const player = players?.find(p => p.id === playerId)
  return player?.name ?? `位置${pos + 1}`
}

function rotatePosition(team: 'A' | 'B', pos: number) {
  // 简单轮转：将当前位置的球员与下一位置交换
  const positions = team === 'A'
    ? [...(matchStore.scoringEngine?.state.teamAStartingPositions ?? [])]
    : [...(matchStore.scoringEngine?.state.teamBStartingPositions ?? [])]
  if (positions.length <= 1) return
  const nextPos = (pos + 1) % positions.length
  const temp = positions[pos]
  positions[pos] = positions[nextPos]
  positions[nextPos] = temp
  matchStore.setNextSetPositions(team, positions)
}

function handleNextSet() {
  console.log('[SetBreak] handleNextSet called, isSetComplete:', matchStore.isSetComplete, 'isMatchComplete:', matchStore.isMatchComplete)
  localNextSet.value = true

  // 获取站位
  const newAPositions = matchStore.scoringEngine?.state.teamAStartingPositions ?? []
  const newBPositions = matchStore.scoringEngine?.state.teamBStartingPositions ?? []

  matchStore.setNextSetPositions('A', newAPositions)
  matchStore.setNextSetPositions('B', newBPositions)
  matchStore.courtSwapped = !matchStore.courtSwapped
  matchStore.nextSet(servingTeam.value)
  console.log('[SetBreak] after nextSet, isSetComplete:', matchStore.isSetComplete, 'setResults:', JSON.stringify(matchStore.scoringEngine?.setResults))
}
</script>

<style scoped>
.set-break-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: none;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.dialog {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx;
  width: 90%;
  max-width: 600rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30rpx;
}

.score-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  gap: 20rpx;
}

.team-name {
  font-size: 28rpx;
  color: #333;
}

.score {
  font-size: 48rpx;
  font-weight: bold;
  color: #e74c3c;
}

.total-score {
  text-align: center;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 30rpx;
}

.positions-section {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.pos-team {
  flex: 1;
}

.pos-label {
  font-size: 26rpx;
  color: #666;
  text-align: center;
  display: block;
  margin-bottom: 10rpx;
}

.pos-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.pos-slot {
  width: 48%;
  padding: 8rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  text-align: center;
}

.pos-num {
  font-size: 22rpx;
  color: #999;
  display: block;
}

.pos-name {
  font-size: 22rpx;
  color: #333;
  display: block;
}

.serving-section {
  margin-bottom: 30rpx;
}

.serving-label {
  font-size: 26rpx;
  color: #666;
  text-align: center;
  display: block;
  margin-bottom: 10rpx;
}

.serving-options {
  display: flex;
  gap: 20rpx;
  justify-content: center;
}

.serving-btn {
  padding: 16rpx 40rpx;
  border: 2rpx solid #ddd;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
}

.serving-btn.active {
  border-color: #07c160;
  color: #07c160;
  background: #f0fff0;
}

.action-btn {
  background: #07c160;
  color: #fff;
  text-align: center;
  padding: 24rpx;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: bold;
}
</style>
