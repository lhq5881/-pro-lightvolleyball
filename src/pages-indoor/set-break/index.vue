<script setup lang="ts">
import { ref, computed } from 'vue'
import { useIndoorMatchStore } from '@/stores/indoor-match'

const indoorMatchStore = useIndoorMatchStore()

const teamAName = computed(() => indoorMatchStore.match?.teamA.name ?? '队A')
const teamBName = computed(() => indoorMatchStore.match?.teamB.name ?? '队B')

// This page is typically shown as a modal in scoring page
// Keeping it as a standalone for potential direct navigation

function goBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="page">
    <view class="card break-card">
      <text class="break-title">局间休息</text>
      <view class="score-row">
        <text class="team-name">{{ teamAName }}</text>
        <text class="score">{{ indoorMatchStore.scoreA }} : {{ indoorMatchStore.scoreB }}</text>
        <text class="team-name">{{ teamBName }}</text>
      </view>
      <text class="sets-info">局分 {{ indoorMatchStore.setsWonA }} : {{ indoorMatchStore.setsWonB }}</text>
    </view>

    <view class="back-btn" @tap="goBack">
      <text class="back-btn-text">返回</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

$indoor-color: #1565c0;

.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-lg;
  background-color: $bg-color;
}

.break-card {
  width: 100%;
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.break-title {
  font-size: $font-size-lg;
  font-weight: bold;
  color: $indoor-color;
  margin-bottom: $spacing-md;
}

.score-row {
  display: flex;
  align-items: center;
  gap: $spacing-base;
  margin-bottom: $spacing-sm;
}

.team-name {
  font-size: $font-size-base;
  color: $text-color;
}

.score {
  font-size: 48rpx;
  font-weight: bold;
  color: $text-color;
}

.sets-info {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.back-btn {
  width: 100%;
  margin-top: $spacing-lg;
  padding: $spacing-base $spacing-md;
  background-color: $indoor-color;
  border-radius: $border-radius;
  text-align: center;
}

.back-btn-text {
  font-size: $font-size-md;
  color: $text-white;
  font-weight: bold;
}
</style>