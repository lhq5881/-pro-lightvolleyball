<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { useHistoryStore } from '@/stores/history'
import type { Match } from '@/models/match'

const historyStore = useHistoryStore()

onShow(() => {
  historyStore.loadHistory()
})

function goToDetail(id: string) {
  uni.navigateTo({ url: `/pages/history-detail/index?id=${id}` })
}

function deleteMatch(id: string) {
  uni.showModal({
    title: '删除',
    content: '确定删除这条比赛记录？',
    success: (res) => {
      if (res.confirm) {
        historyStore.deleteMatch(id)
      }
    }
  })
}

function shareMatch(match: Match) {
  const setScoresText = match.setScores.map(s => `${s.scoreA}:${s.scoreB}`).join('、')
  const winnerName = match.winner === 'A' ? match.teamA.name : match.teamB.name
  const shareText = `【排球裁判助手】\n${match.teamA.name} vs ${match.teamB.name}\n局分 ${match.setsWonA}:${match.setsWonB}\n各局比分：${setScoresText}\n${winnerName} 获胜`

  // #ifdef MP-WEIXIN
  uni.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage']
  })
  // 触发分享
  uni.share({
    provider: 'weixin',
    scene: 'WXSceneSession',
    type: 0,
    summary: shareText,
    success: () => {
      console.log('分享成功')
    },
    fail: (err) => {
      console.log('分享失败', err)
      // 如果分享API不可用，复制到剪贴板
      uni.setClipboardData({
        data: shareText,
        success: () => {
          uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
        }
      })
    }
  })
  // #endif

  // #ifndef MP-WEIXIN
  uni.setClipboardData({
    data: shareText,
    success: () => {
      uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
    }
  })
  // #endif
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getWinnerName(match: Match): string {
  return match.winner === 'A' ? match.teamA.name : match.teamB.name
}
</script>

<template>
  <view class="page">
    <view v-if="historyStore.matches.length === 0" class="empty-state">
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无比赛记录</text>
    </view>

    <view v-else class="match-list">
      <view
        v-for="match in historyStore.matches"
        :key="match.id"
        class="card match-card"
        @tap="goToDetail(match.id)"
      >
        <view class="match-header">
          <text class="match-date">{{ formatDate(match.startTime) }}</text>
          <view class="header-actions">
            <view class="share-btn" @tap.stop="shareMatch(match)">
              <text class="share-text">分享</text>
            </view>
            <view class="delete-btn" @tap.stop="deleteMatch(match.id)">
              <text class="delete-text">删除</text>
            </view>
          </view>
        </view>

        <view class="match-body">
          <view class="match-team-col team-a-col">
            <text class="match-team-name" :class="{ winner: match.winner === 'A' }">{{ match.teamA.name }}</text>
          </view>
          <view class="match-score-col">
            <text class="match-sets-score">{{ match.setsWonA }} : {{ match.setsWonB }}</text>
            <view class="match-set-scores">
              <text
                v-for="(s, i) in match.setScores"
                :key="i"
                class="set-score-badge"
                :class="{ 'a-win': s.winner === 'A', 'b-win': s.winner === 'B' }"
              >
                {{ s.scoreA }}:{{ s.scoreB }}
              </text>
            </view>
          </view>
          <view class="match-team-col team-b-col">
            <text class="match-team-name" :class="{ winner: match.winner === 'B' }">{{ match.teamB.name }}</text>
          </view>
        </view>

        <text class="match-winner">{{ getWinnerName(match) }} 获胜</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.page {
  min-height: 100vh;
  padding: $spacing-base;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: $spacing-base;
}

.empty-text {
  font-size: $font-size-base;
  color: $text-light;
}

.match-card {
  margin-bottom: $spacing-base;
  padding: $spacing-base;
}

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-sm;
}

.match-date {
  font-size: $font-size-xs;
  color: $text-light;
}

.header-actions {
  display: flex;
  gap: $spacing-sm;
}

.share-btn {
  padding: $spacing-xs $spacing-sm;
}

.share-text {
  font-size: $font-size-xs;
  color: $primary-color;
}

.delete-btn {
  padding: $spacing-xs $spacing-sm;
}

.delete-text {
  font-size: $font-size-xs;
  color: $accent-color;
}

.match-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.match-team-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.match-team-name {
  font-size: $font-size-base;
  font-weight: bold;
  color: $text-secondary;

  &.winner {
    color: $primary-color;
  }
}

.match-score-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 $spacing-base;
}

.match-sets-score {
  font-size: $font-size-lg;
  font-weight: bold;
  color: $text-color;
}

.match-set-scores {
  display: flex;
  gap: $spacing-xs;
  margin-top: $spacing-xs;
}

.set-score-badge {
  font-size: $font-size-xs;
  padding: 2rpx 8rpx;
  border-radius: $border-radius-sm;
  background-color: $bg-color;
  color: $text-light;

  &.a-win { color: $team-a-color; background-color: rgba($team-a-color, 0.1); }
  &.b-win { color: $team-b-color; background-color: rgba($team-b-color, 0.1); }
}

.match-winner {
  font-size: $font-size-sm;
  color: $primary-color;
  font-weight: bold;
  text-align: center;
  margin-top: $spacing-sm;
  display: block;
}
</style>