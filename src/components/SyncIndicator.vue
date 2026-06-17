<template>
  <view class="sync-indicator" @tap="showDetail = !showDetail">
    <view class="status-dot" :class="statusClass"></view>
    <text class="status-text">{{ statusText }}</text>

    <view v-if="showDetail" class="detail-popup">
      <view class="detail-row">
        <text class="detail-label">房间码</text>
        <text class="detail-value">{{ syncStore.roomCode || '-' }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">已连接</text>
        <text class="detail-value">{{ syncStore.connectedDevices }}台设备</text>
      </view>
      <view v-if="syncStore.lastSyncAt" class="detail-row">
        <text class="detail-label">最近同步</text>
        <text class="detail-value">{{ formatTime(syncStore.lastSyncAt) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSyncStore } from '@/stores/sync'

const syncStore = useSyncStore()
const showDetail = ref(false)

const statusClass = computed(() => {
  switch (syncStore.status) {
    case 'connected': return 'connected'
    case 'disconnected': return 'disconnected'
    case 'waiting': return 'waiting'
    default: return 'idle'
  }
})

const statusText = computed(() => {
  switch (syncStore.status) {
    case 'connected': return syncStore.pendingAction ? '同步中' : '已同步'
    case 'disconnected': return '已断开'
    case 'waiting': return '等待中'
    case 'creating': return '创建中'
    case 'joining': return '加入中'
    default: return ''
  }
})

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}
</script>

<style lang="scss" scoped>
.sync-indicator {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  background: rgba(0, 0, 0, 0.3);
  position: relative;
}

.status-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;

  &.connected { background: #4ade80; }
  &.disconnected { background: #f87171; }
  &.waiting { background: #fbbf24; animation: blink 1s infinite; }
  &.idle { background: #9ca3af; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.status-text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.9);
}

.detail-popup {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8rpx;
  padding: 16rpx 20rpx;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 12rpx;
  min-width: 240rpx;
  z-index: 100;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6rpx 0;
}

.detail-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.6);
  margin-right: 20rpx;
}

.detail-value {
  font-size: 22rpx;
  color: #fff;
}
</style>
