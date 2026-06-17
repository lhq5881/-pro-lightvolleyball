<script setup lang="ts">
import type { Player } from '@/models/match'

const props = defineProps<{
  positions: string[]       // 5个playerId，索引0=1号位
  players: Player[]         // 所有队员信息
  servingTeamSide: 'left' | 'right'  // 发球方显示在哪侧
  highlightServer?: boolean
  compact?: boolean
}>()

function getPlayerName(playerId: string): string {
  const player = props.players.find(p => p.id === playerId)
  return player ? (player.number ? `${player.number}号 ${player.name}` : player.name) : '?'
}

function getPlayerShortName(playerId: string): string {
  const player = props.players.find(p => p.id === playerId)
  return player ? (player.number || player.name.slice(0, 2)) : '?'
}
</script>

<template>
  <view class="court-diagram" :class="{ compact }">
    <!-- 球网 -->
    <view class="net">
      <text class="net-text">网</text>
    </view>

    <!-- 前排：4号位 3号位 2号位 -->
    <view class="row front-row">
      <view class="position pos-4" :class="{ server: highlightServer && false }">
        <text class="pos-number">4</text>
        <text class="player-name">{{ getPlayerShortName(positions[3]) }}</text>
      </view>
      <view class="position pos-3">
        <text class="pos-number">3</text>
        <text class="player-name">{{ getPlayerShortName(positions[2]) }}</text>
      </view>
      <view class="position pos-2">
        <text class="pos-number">2</text>
        <text class="player-name">{{ getPlayerShortName(positions[1]) }}</text>
      </view>
    </view>

    <!-- 后排：5号位 中间 1号位 -->
    <view class="row back-row">
      <view class="position pos-5">
        <text class="pos-number">5</text>
        <text class="player-name">{{ getPlayerShortName(positions[4]) }}</text>
      </view>
      <view class="position pos-center empty-pos" />
      <view class="position pos-1 server-pos">
        <text class="pos-number">1</text>
        <text class="player-name">{{ getPlayerShortName(positions[0]) }}</text>
        <view v-if="highlightServer" class="server-dot" />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.court-diagram {
  background-color: $bg-court;
  border: 4rpx solid #c4a35a;
  border-radius: $border-radius;
  padding: $spacing-sm;
  position: relative;

  &.compact {
    padding: $spacing-xs;

    .position {
      width: 80rpx;
      height: 80rpx;
    }

    .pos-number {
      font-size: 18rpx;
    }

    .player-name {
      font-size: 18rpx;
    }
  }
}

.net {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 4rpx;
  background-color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.net-text {
  font-size: 18rpx;
  color: $text-light;
  background-color: $bg-court;
  padding: 0 $spacing-xs;
}

.row {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: $spacing-sm 0;
}

.front-row {
  padding-top: $spacing-base;
}

.back-row {
  padding-bottom: $spacing-sm;
}

.position {
  width: 120rpx;
  height: 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.85);
  border-radius: $border-radius-sm;
  position: relative;
  border: 2rpx solid rgba(0, 0, 0, 0.1);
}

.empty-pos {
  background-color: transparent;
  border: none;
  width: 120rpx;
  height: 120rpx;
}

.pos-number {
  font-size: $font-size-xs;
  color: $text-light;
  position: absolute;
  top: 4rpx;
  left: 8rpx;
}

.player-name {
  font-size: $font-size-sm;
  color: $text-color;
  font-weight: bold;
  text-align: center;
  word-break: break-all;
}

.server-pos {
  border-color: $secondary-color;
  border-width: 4rpx;
  background-color: rgba($secondary-color, 0.08);
}

.server-dot {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background-color: $secondary-color;
}
</style>
