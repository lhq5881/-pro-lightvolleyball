<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMatchStore } from '@/stores/match'
import type { TeamSide } from '@/engine/scoring-engine'
import CourtDiagram from '@/components/CourtDiagram.vue'

const matchStore = useMatchStore()
const selectedTeam = ref<TeamSide>('A')

const teamAName = computed(() => matchStore.match?.teamA.name ?? '队A')
const teamBName = computed(() => matchStore.match?.teamB.name ?? '队B')
const currentRotation = computed(() => matchStore.getRotation(selectedTeam.value))
const nextRotation = computed(() => matchStore.previewRotation(selectedTeam.value))
const teamPlayers = computed(() => selectedTeam.value === 'A' ? (matchStore.match?.teamA.players ?? []) : (matchStore.match?.teamB.players ?? []))
const isServing = computed(() => matchStore.servingTeam === selectedTeam.value)

function getPlayerName(playerId: string): string {
  const player = matchStore.getPlayer(playerId)
  return player ? `${player.number}号 ${player.name}` : '?'
}

function getServerName(): string {
  const serverId = matchStore.getServer(selectedTeam.value)
  return getPlayerName(serverId)
}
</script>

<template>
  <view class="page" v-if="matchStore.isLive">
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
      <CourtDiagram
        :positions="currentRotation"
        :players="teamPlayers"
        :servingTeamSide="selectedTeam === 'A' ? 'left' : 'right'"
        :highlightServer="isServing"
      />
    </view>

    <!-- 发球队员 -->
    <view class="card server-info" v-if="isServing">
      <text class="server-label">当前发球：</text>
      <text class="server-name">{{ getServerName() }}（1号位）</text>
    </view>

    <!-- 下次轮转预览 -->
    <view class="section">
      <text class="section-title">下次轮转预览</text>
      <text class="preview-desc">获得发球权时，队员将顺时针轮转一个位置</text>
      <CourtDiagram
        :positions="nextRotation"
        :players="teamPlayers"
        :servingTeamSide="selectedTeam === 'A' ? 'left' : 'right'"
        :highlightServer="true"
      />
    </view>

    <!-- 位置说明 -->
    <view class="card position-guide">
      <text class="guide-title">位置编号说明</text>
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
      </view>
      <text class="guide-rotation">轮转方向：1→2→3→4→5→1（顺时针）</text>
    </view>
  </view>

  <view v-else class="page empty-page">
    <text class="empty-text">暂无进行中的比赛</text>
  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

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
    border-color: $team-a-color;
    background-color: rgba($team-a-color, 0.1);
  }

  &.active.team-b-tab {
    border-color: $team-b-color;
    background-color: rgba($team-b-color, 0.1);
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
  color: $secondary-color;
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
  color: $primary-color;
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