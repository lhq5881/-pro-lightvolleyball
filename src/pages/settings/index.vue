<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useSettingsStore } from '@/stores/settings'
import { useHistoryStore } from '@/stores/history'

const settingsStore = useSettingsStore()
const historyStore = useHistoryStore()
const showConfirm = ref(false)

onShow(() => {
  settingsStore.loadSettings()
})

function updateSetting(key: string, value: any) {
  settingsStore.updateSettings({ [key]: value })
}

function handleClearAll() {
  showConfirm.value = true
}

function confirmClear() {
  historyStore.clearAll()
  showConfirm.value = false
}

function cancelClear() {
  showConfirm.value = false
}
</script>

<template>
  <view class="page">
    <!-- 比赛设置 -->
    <view class="card section">
      <text class="section-title">默认队伍名称</text>
      <view class="setting-row">
        <text class="setting-label">队伍A</text>
        <input
          class="setting-input"
          :value="settingsStore.settings.defaultTeamAName"
          @input="updateSetting('defaultTeamAName', ($event as any).detail.value)"
          placeholder="队伍A名称"
        />
      </view>
      <view class="setting-row">
        <text class="setting-label">队伍B</text>
        <input
          class="setting-input"
          :value="settingsStore.settings.defaultTeamBName"
          @input="updateSetting('defaultTeamBName', ($event as any).detail.value)"
          placeholder="队伍B名称"
        />
      </view>
    </view>

    <!-- 反馈设置 -->
    <view class="card section">
      <text class="section-title">反馈</text>
      <view class="setting-row">
        <text class="setting-label">声音</text>
        <switch
          :checked="settingsStore.settings.soundEnabled"
          @change="updateSetting('soundEnabled', ($event as any).detail.value)"
          color="#1a6b3c"
        />
      </view>
      <view class="setting-row">
        <text class="setting-label">震动</text>
        <switch
          :checked="settingsStore.settings.vibrateEnabled"
          @change="updateSetting('vibrateEnabled', ($event as any).detail.value)"
          color="#1a6b3c"
        />
      </view>
    </view>

    <!-- 数据管理 -->
    <view class="card section">
      <text class="section-title">数据管理</text>
      <view class="danger-row" @tap="handleClearAll">
        <text class="danger-text">删除所有比赛记录</text>
      </view>
    </view>

    <!-- 确认弹窗 -->
    <view v-if="showConfirm" class="modal-mask" @tap="cancelClear">
      <view class="modal-box" @tap.stop>
        <text class="modal-title">确认删除</text>
        <text class="modal-msg">将删除所有比赛记录，此操作不可恢复</text>
        <view class="modal-actions">
          <view class="modal-btn cancel-btn" @tap="cancelClear">
            <text class="modal-btn-text">取消</text>
          </view>
          <view class="modal-btn confirm-btn" @tap="confirmClear">
            <text class="modal-btn-text confirm-text">删除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 关于 -->
    <view class="card section">
      <text class="section-title">关于</text>
      <view class="about-row">
        <text class="about-label">排球裁判助手</text>
        <text class="about-version">v1.1.0</text>
      </view>
      <text class="about-desc">本程序由VOLLEY TEACH开发，主要用于裁判员临场执裁。在使用过程中，如果有任何的问题或建议，请在"排球教与学"视频号任意视频下面进行评论。祝大家球技大涨</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.page {
  min-height: 100vh;
  padding: $spacing-base;
}

.section {
  margin-bottom: $spacing-base;
}

.section-title {
  font-size: $font-size-md;
  font-weight: bold;
  color: $text-color;
  margin-bottom: $spacing-sm;
  display: block;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-sm 0;
  border-bottom: 1rpx solid $border-color;

  &:last-child { border-bottom: none; }
}

.setting-label {
  font-size: $font-size-base;
  color: $text-color;
}

.setting-input {
  flex: 1;
  text-align: right;
  padding: $spacing-xs;
  font-size: $font-size-base;
  color: $text-secondary;
}

.danger-row {
  padding: $spacing-base 0;
  text-align: center;
}

.danger-text {
  font-size: $font-size-base;
  color: #e74c3c;
  font-weight: bold;
}

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-box {
  width: 80%;
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
}

.modal-title {
  font-size: $font-size-lg;
  font-weight: bold;
  color: $text-color;
  text-align: center;
  display: block;
  margin-bottom: $spacing-sm;
}

.modal-msg {
  font-size: $font-size-base;
  color: $text-secondary;
  text-align: center;
  display: block;
  margin-bottom: $spacing-lg;
}

.modal-actions {
  display: flex;
  gap: $spacing-base;
}

.modal-btn {
  flex: 1;
  padding: $spacing-sm 0;
  border-radius: $border-radius;
  text-align: center;
}

.cancel-btn {
  background-color: $bg-color;
}

.confirm-btn {
  background-color: #e74c3c;
}

.modal-btn-text {
  font-size: $font-size-base;
  color: $text-color;
}

.confirm-text {
  color: #fff;
}

.about-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-sm;
}

.about-label {
  font-size: $font-size-base;
  font-weight: bold;
  color: $text-color;
}

.about-version {
  font-size: $font-size-sm;
  color: $text-light;
}

.about-desc {
  font-size: $font-size-sm;
  color: $text-light;
  line-height: 1.8;
  display: block;
}

</style>