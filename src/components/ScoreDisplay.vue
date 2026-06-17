<script setup lang="ts">
import type { TeamSide } from '@/engine/scoring-engine'

defineProps<{
  scoreA: number
  scoreB: number
  teamAName: string
  teamBName: string
  servingTeam: TeamSide
  currentSet: number
  setsWonA: number
  setsWonB: number
}>()
</script>

<template>
  <view class="score-display">
    <!-- 局分 -->
    <view class="set-score">
      <text class="set-score-text">{{ setsWonA }}</text>
      <text class="set-score-divider">:</text>
      <text class="set-score-text">{{ setsWonB }}</text>
    </view>
    <text class="set-label">第{{ currentSet }}局</text>

    <!-- 当前比分 -->
    <view class="current-score">
      <view class="team-score team-a">
        <text class="team-name">{{ teamAName }}</text>
        <text class="score-number">{{ scoreA }}</text>
        <view v-if="servingTeam === 'A'" class="serve-indicator serve-a">
          <text class="serve-text">发球</text>
        </view>
      </view>

      <view class="score-divider">
        <text class="divider-text">:</text>
      </view>

      <view class="team-score team-b">
        <text class="team-name">{{ teamBName }}</text>
        <text class="score-number">{{ scoreB }}</text>
        <view v-if="servingTeam === 'B'" class="serve-indicator serve-b">
          <text class="serve-text">发球</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-md 0;
}

.set-score {
  display: flex;
  align-items: center;
  margin-bottom: $spacing-xs;
}

.set-score-text {
  font-size: $font-size-lg;
  font-weight: bold;
  color: $text-secondary;
  min-width: 60rpx;
  text-align: center;
}

.set-score-divider {
  font-size: $font-size-lg;
  color: $text-light;
  margin: 0 $spacing-xs;
}

.set-label {
  font-size: $font-size-sm;
  color: $text-light;
  margin-bottom: $spacing-sm;
}

.current-score {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.team-score {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.team-name {
  font-size: $font-size-base;
  color: $text-secondary;
  margin-bottom: $spacing-xs;
}

.score-number {
  font-size: $font-size-score;
  font-weight: bold;
  line-height: 1;
}

.team-a .score-number {
  color: $team-a-color;
}

.team-b .score-number {
  color: $team-b-color;
}

.score-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 $spacing-sm;
}

.divider-text {
  font-size: $font-size-xxl;
  color: $text-light;
  font-weight: bold;
}

.serve-indicator {
  position: absolute;
  top: -8rpx;
  right: 20%;
  padding: 2rpx 12rpx;
  border-radius: 16rpx;
}

.serve-a {
  background-color: rgba($team-a-color, 0.15);
}

.serve-b {
  background-color: rgba($team-b-color, 0.15);
}

.serve-text {
  font-size: $font-size-xs;
  font-weight: bold;
}

.serve-a .serve-text {
  color: $team-a-color;
}

.serve-b .serve-text {
  color: $team-b-color;
}
</style>
