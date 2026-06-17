<script setup lang="ts">
import { ref, computed } from 'vue'
import { useIndoorMatchStore } from '@/stores/indoor-match'
import type { TeamSide } from '@/engine/indoor-scoring-engine'

const indoorMatchStore = useIndoorMatchStore()
const selectedTeam = ref<TeamSide>('A')

const teamAName = computed(() => indoorMatchStore.match?.teamA.name ?? '队A')
const teamBName = computed(() => indoorMatchStore.match?.teamB.name ?? '队B')
const currentRotation = computed(() => indoorMatchStore.getRotation(selectedTeam.value))
const nextRotation = computed(() => indoorMatchStore.previewRotation(selectedTeam.value))
const teamPlayers = computed(() => selectedTeam.value === 'A' ? (indoorMatchStore.match?.teamA.players ?? []) : (indoorMatchStore.match?.teamB.players ?? []))
const isServing = computed(() => indoorMatchStore.servingTeam === selectedTeam.value)

function getPlayerName(playerId: string): string {
  const player = indoorMatchStore.getPlayer(playerId)
  return player ? `${player.number}号 ${player.name}` : '?'
}

function getServerName(): string {
  const serverId = indoorMatchStore.getServer(selectedTeam.value)
  return getPlayerName(serverId)
}
</script>

<template>
  <view class="page" v-if="indoorMatchStore.isLive">
    <!-- 队伍选择 -->
    <view class="team-selector">
      <view
        class="team-tab"
        :class="{ active: selectedTeam === 'A', 'team-a-tab': true }"
        @tap="selectedTeam = 'A'"
      >
        <text class="tab-text">{{ teamAName }}</text>
      </view>
      <view
        class="team-tab"
        :class="{ active: selectedTeam === 'B', 'team-b-tab': true }"
        @tap="selectedTeam = 'B'"
      >
        <text class="tab-text">{{ teamBName }}</text>
      </view>
    </view>

    <!-- 当前站位 -->
    <view class="section">
      <text class="section-title">当前站位</text>
      <view class="court-grid">
        <view class="court-row">
          <view class="court-col">
            <view class="position-box" v-for="i in [3, 2]" :key="'front-'+i">
              <text class="pos-num">{{ i }}号位</text>
              <text class="pos-player">{{ getPlayerName(currentRotation[i-1]) }}</text>
            </view>
          </view>
          <view class="court-col">
            <view class="position-box" :class="{ serving: isServing && currentRotation[0] }">
              <text class="pos-num">1号位(发球)</text>
              <text class="pos-player">{{ getPlayerName(currentRotation[0]) }}</text>
            </view>
          </view>
        </view>
        <view class="court-row">
          <view class="court-col">
            <view class="position-box" v-for="i in [4, 5]" :key="'back-'+i">
              <text class="pos-num">{{ i }}号位</text>
              <text class="pos-player">{{ getPlayerName(currentRotation[i-1]) }}</text>
            </view>
          </view>
          <view class="court-col">
            <view class="position-box">
              <text class="pos-num">6号位</text>
              <text class="pos-player">{{ getPlayerName(currentRotation[5]) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 发球队员 -->
    <view class="card server-info" v-if="isServing">
      <text class="server-label">当前发球：</text>
      <text class="server-name">{{ getServerName() }}（1号位）</text>
    </view>

    <!-- 下次轮转预览 -->
    <view class="section">
      <text class="section-title">下次轮转预览</text>
      <text class="preview-desc">接发球方得分时，队员将顺时针轮转一个位置</text>
      <view class="court-grid">
        <view class="court-row">
          <view class="court-col">
            <view class="position-box preview" v-for="i in [3, 2]" :key="'next-front-'+i">
              <text class="pos-num">{{ i }}号位</text>
              <text class="pos-player">{{ getPlayerName(nextRotation[i-1]) }}</text>
            </view>
          </view>
          <view class="court-col">
            <view class="position-box preview serving">
              <text class="pos-num">1号位(发球)</text>
              <text class="pos-player">{{ getPlayerName(nextRotation[0]) }}</text>
            </view>
          </view>
        </view>
        <view class="court-row">
          <view class="court-col">
            <view class="position-box preview" v-for="i in [4, 5]" :key="'next-back-'+i">
              <text class="pos-num">{{ i }}号位</text>
              <text class="pos-player">{{ getPlayerName(nextRotation[i-1]) }}</text>
            </view>
          </view>
          <view class="court-col">
            <view class="position-box preview">
              <text class="pos-num">6号位</text>
              <text class="pos-player">{{ getPlayerName(nextRotation[5]) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 位置说明 -->
    <view class="card position-guide">
      <text class="guide-title">室内排球位置编号</text>
      <view class="guide-row">
        <text class="guide-item">1号位 - 后排右（发球位）</text>
        <text class="guide-item">2号位 - 前排右</text>
      </view>
      <view class="guide-row">
        <text class="guide-item">3号位 - 前排中</text>
        <text class="guide-item">4号位 - 前排左</text>
      </view>
      <view class="guide-row">
        <text class="guide-item">5号位 - 后排左</text>
        <text class="guide-item">6号位 - 后排中</text>
      </view>
      <text class="guide-rotation">轮转方向：2→1→6→5→4→3→2（顺时针）</text>
    </view>
  </view>

  <view v-else class="page empty-page">
    <text class="empty-text">暂无进行中的比赛</text>
  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

$indoor-color: #1565c0;
$indoor-team-a: #1565c0;
$indoor-team-b: #f44336;

.page {
  min-height: 100vh;
  padding: $spacing-base;
}

.team-selector {
  display: flex;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
}

.team-tab {
  flex: 1;
  padding: $spacing-sm;
  border: 2rpx solid $border-color;
  border-radius: $border-radius;
  text-align: center;

  &.active.team-a-tab {
    border-color: $indoor-team-a;
    background-color: rgba($indoor-team-a, 0.1);
  }

  &.active.team-b-tab {
    border-color: $indoor-team-b;
    background-color: rgba($indoor-team-b, 0.1);
  }
}

.tab-text {
  font-size: $font-size-base;
  font-weight: bold;
}

.section {
  margin-bottom: $spacing-md;
}

.section-title {
  font-size: $font-size-md;
  font-weight: bold;
  color: $text-color;
  margin-bottom: $spacing-sm;
  display: block;
}

.preview-desc {
  font-size: $font-size-sm;
  color: $text-light;
  margin-bottom: $spacing-sm;
  display: block;
}

.court-grid {
  border: 2rpx solid #c4a35a;
  border-radius: $border-radius-sm;
  padding: $spacing-sm;
  background-color: #f5f5f5;
}

.court-row {
  display: flex;
  gap: $spacing-xs;
  margin-bottom: $spacing-xs;
}

.court-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.position-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-sm;
  background-color: $bg-white;
  border: 2rpx solid $border-color;
  border-radius: $border-radius-sm;

  &.serving {
    border-color: #39ff14;
    border-width: 3rpx;
    background-color: rgba(57, 255, 20, 0.15);
  }

  &.preview {
    border-style: dashed;
    opacity: 0.8;
  }
}

.pos-num {
  font-size: $font-size-xs;
  color: $indoor-color;
  font-weight: bold;
}

.pos-player {
  font-size: $font-size-sm;
  color: $text-color;
}

.server-info {
  display: flex;
  align-items: center;
  padding: $spacing-sm $spacing-base;
  margin-bottom: $spacing-md;
}

.server-label {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.server-name {
  font-size: $font-size-base;
  color: $indoor-color;
  font-weight: bold;
}

.position-guide {
  padding: $spacing-base;
}

.guide-title {
  font-size: $font-size-base;
  font-weight: bold;
  color: $text-color;
  margin-bottom: $spacing-sm;
  display: block;
}

.guide-row {
  display: flex;
  gap: $spacing-base;
  margin-bottom: $spacing-xs;
}

.guide-item {
  font-size: $font-size-sm;
  color: $text-secondary;
  flex: 1;
}

.guide-rotation {
  font-size: $font-size-sm;
  color: $indoor-color;
  font-weight: bold;
  margin-top: $spacing-sm;
  display: block;
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
</style>