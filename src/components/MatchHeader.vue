<script setup lang="ts">
import type { TeamSide } from '@/engine/scoring-engine'

defineProps<{
  teamAName: string
  teamBName: string
  currentSet: number
  setsWonA: number
  setsWonB: number
  setScores: { scoreA: number; scoreB: number; winner: TeamSide }[]
}>()
</script>

<template>
  <view class="match-header">
    <view class="team-info team-a-info">
      <text class="team-name team-a-name">{{ teamAName }}</text>
      <text class="sets-won">{{ setsWonA }}</text>
    </view>

    <view class="match-center">
      <text class="set-number">第{{ currentSet }}局</text>
      <view class="set-scores">
        <text
          v-for="(s, i) in setScores"
          :key="i"
          class="set-score-item"
          :class="{ 'winner-a': s.winner === 'A', 'winner-b': s.winner === 'B' }"
        >
          {{ s.scoreA }}:{{ s.scoreB }}
        </text>
      </view>
    </view>

    <view class="team-info team-b-info">
      <text class="team-name team-b-name">{{ teamBName }}</text>
      <text class="sets-won">{{ setsWonB }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.match-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-sm $spacing-base;
  background-color: $bg-white;
  border-bottom: 1rpx solid $border-color;
}

.team-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.team-name {
  font-size: $font-size-base;
  font-weight: bold;
  margin-bottom: $spacing-xs;
}

.team-a-name { color: $team-a-color; }
.team-b-name { color: $team-b-color; }

.sets-won {
  font-size: $font-size-xl;
  font-weight: bold;
  color: $text-color;
}

.match-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.set-number {
  font-size: $font-size-sm;
  color: $text-light;
  margin-bottom: $spacing-xs;
}

.set-scores {
  display: flex;
  gap: $spacing-xs;
}

.set-score-item {
  font-size: $font-size-xs;
  color: $text-light;
  padding: 2rpx 8rpx;
  border-radius: $border-radius-sm;
  background-color: $bg-color;
}

.winner-a { color: $team-a-color; background-color: rgba($team-a-color, 0.1); }
.winner-b { color: $team-b-color; background-color: rgba($team-b-color, 0.1); }
</style>
