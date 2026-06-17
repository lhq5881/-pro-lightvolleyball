<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { useHistoryStore } from '@/stores/history'
import { useSyncStore } from '@/stores/sync'
import type { Match } from '@/models/match'

const historyStore = useHistoryStore()
const syncStore = useSyncStore()
const recentMatches = ref<Match[]>([])

onShow(() => {
  historyStore.loadHistory()
  recentMatches.value = historyStore.getRecentMatches(5)
})

function goToSetup() {
  uni.navigateTo({ url: '/pages/match-setup/index' })
}

function goToIndoorSetup() {
  uni.navigateTo({ url: '/pages-indoor/match-setup/index' })
}

function goToBeachSetup() {
  uni.navigateTo({ url: '/pages-beach/match-setup/index' })
}

function goToHistory() {
  uni.switchTab({ url: '/pages/history/index' })
}

function goToCreateRoom() {
  uni.navigateTo({ url: '/pages/room/index?mode=create&role=recorder' })
}

function goToJoinReferee() {
  uni.navigateTo({ url: '/pages/room/index?mode=join&role=referee1' })
}

function goToJoinAssistant() {
  uni.navigateTo({ url: '/pages/room/index?mode=join&role=referee2' })
}

function shareApp() {
  const shareText = '【排球裁判助手】一款专业的排球裁判计分工具，支持气排球和室内排球，双设备实时同步，让执裁更轻松！'

  // #ifdef MP-WEIXIN
  uni.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage']
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

function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getMatchResult(match: Match): string {
  const winner = match.winner === 'A' ? match.teamA.name : match.teamB.name
  return `${winner} 胜`
}
</script>

<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="hero">
      <text class="hero-title">排球裁判助手</text>
      <text class="hero-subtitle">关注"排球教与学"视频号，学习更多排球知识</text>
    </view>

    <!-- 气排球入口 -->
    <view class="section-block">
      <text class="section-label">气排球执裁</text>
      <view class="card action-card" @tap="goToSetup">
        <view class="action-icon">
          <text class="icon-text">+</text>
        </view>
        <view class="action-content">
          <text class="action-title">开始新比赛（单机使用）</text>
        </view>
      </view>
    </view>

    <!-- 室内排球入口 -->
    <view class="section-block">
      <text class="section-label">室内排球执裁</text>
      <view class="card action-card indoor-card" @tap="goToIndoorSetup">
        <view class="action-icon">
          <text class="icon-text">+</text>
        </view>
        <view class="action-content">
          <text class="action-title">开始新比赛（单机使用）</text>
        </view>
      </view>
    </view>

    <!-- 沙滩排球入口 -->
    <view class="section-block">
      <text class="section-label">沙滩排球执裁</text>
      <view class="card action-card beach-card" @tap="goToBeachSetup">
        <view class="action-icon">
          <text class="icon-text">+</text>
        </view>
        <view class="action-content">
          <text class="action-title">开始新比赛（单机使用）</text>
        </view>
      </view>
    </view>

    <!-- 多设备同步 -->
    <view class="section-block">
      <text class="section-label">多设备同步</text>
      <view class="sync-section">
        <!-- 创建房间 - 独占一行 -->
        <view class="card sync-card create-card" @tap="goToCreateRoom">
          <view class="action-icon">
            <text class="icon-text">⬆</text>
          </view>
          <view class="action-content">
            <text class="action-title">创建房间</text>
            <text class="action-desc">记录员</text>
          </view>
        </view>
      </view>

      <!-- 加入房间 - 两个按钮同一行 -->
      <view class="sync-section">
        <view class="card sync-card join-card" @tap="goToJoinReferee">
          <view class="action-icon">
            <text class="icon-text">⬇</text>
          </view>
          <view class="action-content">
            <text class="action-title">加入房间</text>
            <text class="action-desc">第一裁判员</text>
          </view>
        </view>
        <view class="card sync-card join-card2" @tap="goToJoinAssistant">
          <view class="action-icon">
            <text class="icon-text">⬇</text>
          </view>
          <view class="action-content">
            <text class="action-title">加入房间</text>
            <text class="action-desc">第二裁判员</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 分享按钮 -->
    <view class="card share-card" @tap="shareApp">
      <view class="action-icon share-icon">
        <text class="icon-text">↗</text>
      </view>
      <view class="action-content">
        <text class="action-title">分享给朋友</text>
        <text class="action-desc">推荐给需要的朋友</text>
      </view>
    </view>

    <!-- 最近比赛 -->
    <view v-if="recentMatches.length > 0" class="section">
      <view class="section-header">
        <text class="section-title">最近比赛</text>
        <text class="section-more" @tap="goToHistory">查看全部</text>
      </view>

      <view
        v-for="match in recentMatches"
        :key="match.id"
        class="card match-card"
        @tap="goToHistory"
      >
        <view class="match-teams">
          <text class="match-team" :class="{ winner: match.winner === 'A' }">{{ match.teamA.name }}</text>
          <text class="match-vs">vs</text>
          <text class="match-team" :class="{ winner: match.winner === 'B' }">{{ match.teamB.name }}</text>
        </view>
        <view class="match-info">
          <text class="match-result">{{ getMatchResult(match) }}</text>
          <text class="match-score">{{ match.setsWonA }}:{{ match.setsWonB }}</text>
          <text class="match-time">{{ formatTime(match.startTime) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.page {
  min-height: 100vh;
  padding: $spacing-base;
  box-sizing: border-box;
  overflow-x: hidden;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-xl 0;
}

.hero-title {
  font-size: $font-size-xl;
  font-weight: bold;
  color: $primary-color;
}

.hero-subtitle {
  font-size: $font-size-sm;
  color: $primary-color;
  margin-top: $spacing-sm;
  text-align: center;
  line-height: 1.6;
}

.section-block {
  margin-top: $spacing-md;
}

.section-label {
  font-size: $font-size-md;
  font-weight: bold;
  color: $text-color;
  margin-bottom: $spacing-sm;
  display: block;
}

.action-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: $spacing-md;
  background-color: $primary-color;
}

.indoor-card {
  background-color: #1565c0;
}

.beach-card {
  background-color: #ff9800;
}

.action-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: $spacing-base;
}

.icon-text {
  font-size: $font-size-lg;
  color: $text-white;
  font-weight: bold;
}

.action-content {
  flex: 1;
}

.action-title {
  font-size: $font-size-md;
  color: $text-white;
  font-weight: bold;
  display: block;
}

.action-desc {
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.7);
  margin-top: $spacing-xs;
  display: block;
}

.action-role {
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.9);
  display: block;
}

.section {
  margin-top: $spacing-md;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-sm;
}

.section-title {
  font-size: $font-size-md;
  font-weight: bold;
  color: $text-color;
}

.section-more {
  font-size: $font-size-sm;
  color: $primary-color;
}

.match-card {
  padding: $spacing-base;
}

.match-teams {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: $spacing-sm;
}

.match-team {
  font-size: $font-size-base;
  font-weight: bold;
  color: $text-secondary;

  &.winner {
    color: $primary-color;
  }
}

.match-vs {
  font-size: $font-size-sm;
  color: $text-light;
  margin: 0 $spacing-base;
}

.match-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-base;
}

.match-result {
  font-size: $font-size-sm;
  color: $primary-color;
  font-weight: bold;
}

.match-score {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.match-time {
  font-size: $font-size-xs;
  color: $text-light;
}

.sync-section {
  display: flex;
  gap: $spacing-sm;
  width: 100%;
  box-sizing: border-box;
}

.sync-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: $spacing-md;
  background-color: #2d8a5e;
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
}

.create-card {
  flex: none;
  width: 100%;
}

.join-card {
  background-color: #1565c0;
}

.join-card2 {
  background-color: #0d47a1;
}

.share-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: $spacing-md;
  background-color: #1976d2;
  margin-top: $spacing-md;
}

.share-icon {
  background-color: rgba(255, 255, 255, 0.3);
}

</style>