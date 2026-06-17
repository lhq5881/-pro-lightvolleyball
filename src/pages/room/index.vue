<template>
  <view class="room-page">
    <!-- 创建房间：选择排球类型 -->
    <view v-if="mode === 'create' && !selectedType" class="type-section">
      <text class="type-label">选择比赛类型</text>
      <view class="type-options">
        <view class="type-option qipai-option" @tap="selectType('qipai')">
          <text class="type-name">气排球</text>
          <text class="type-desc">5人制</text>
        </view>
        <view class="type-option indoor-option" @tap="selectType('indoor')">
          <text class="type-name">室内排球</text>
          <text class="type-desc">6人制</text>
        </view>
        <view class="type-option beach-option" @tap="selectType('beach')">
          <text class="type-name">沙滩排球</text>
          <text class="type-desc">2人制</text>
        </view>
      </view>
    </view>

    <!-- 创建房间模式 -->
    <view v-else-if="mode === 'create' && selectedType" class="mode-section">
      <view v-if="syncStore.status === 'creating'" class="loading">
        <text class="loading-text">正在创建房间...</text>
      </view>

      <view v-else-if="syncStore.status === 'waiting'" class="waiting">
        <text class="label">房间码</text>
        <view class="room-code-display">
          <text v-for="(char, i) in roomCodeChars" :key="i" class="code-char">{{ char }}</text>
        </view>
        <text class="hint">将房间码告诉对方，等待加入</text>
        <view class="waiting-indicator">
          <view class="dot dot1"></view>
          <view class="dot dot2"></view>
          <view class="dot dot3"></view>
        </view>
      </view>

      <view v-else-if="syncStore.status === 'connected'" class="connected">
        <text class="success-text">对方已加入！</text>
        <text class="hint">即将进入比赛设置...</text>
      </view>

      <view v-else-if="syncStore.status === 'error'" class="error">
        <text class="error-text">{{ syncStore.errorMessage }}</text>
        <button class="retry-btn" @tap="handleCreate">重试</button>
      </view>
    </view>

    <!-- 加入房间模式 -->
    <view v-if="mode === 'join'" class="mode-section">
      <!-- 输入房间码阶段 -->
      <view v-if="syncStore.status === 'idle' || syncStore.status === 'error'" class="join-form">
        <text class="label">输入房间码</text>
        <view class="code-input-row">
          <input
            v-for="i in 4"
            :key="i"
            class="code-input"
            type="number"
            maxlength="1"
            :value="inputCodes[i-1] || ''"
            @input="onCodeInput(i-1, $event)"
            :focus="focusIndex === i-1"
          />
        </view>
        <button class="join-btn" :disabled="!isCodeComplete" @tap="handleJoin">加入房间</button>
        <view v-if="syncStore.status === 'error'" class="error">
          <text class="error-text">{{ syncStore.errorMessage }}</text>
        </view>
      </view>

      <!-- 加入中 -->
      <view v-else-if="syncStore.status === 'joining'" class="loading">
        <text class="loading-text">正在加入房间...</text>
      </view>

      <!-- 已连接，等待创建者开始比赛 -->
      <view v-else-if="syncStore.status === 'connected'" class="connected">
        <text class="success-text">已连接成功！</text>
        <text class="hint">等待对方设置并开始比赛...</text>
        <view class="waiting-indicator">
          <view class="dot dot1"></view>
          <view class="dot dot2"></view>
          <view class="dot dot3"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onHide } from '@dcloudio/uni-app'
import { useSyncStore } from '@/stores/sync'
import { useMatchStore } from '@/stores/match'
import { useIndoorMatchStore } from '@/stores/indoor-match'
import { useBeachMatchStore } from '@/stores/beach-match'
import { syncService } from '@/services/sync-service'

type VolleyballType = 'qipai' | 'indoor' | 'beach'

const syncStore = useSyncStore()
const mode = ref<'create' | 'join'>('create')
const role = ref<'recorder' | 'referee1' | 'referee2'>('recorder')
const inputCodes = ref<string[]>(['', '', '', ''])
const focusIndex = ref(0)
const selectedType = ref<VolleyballType | null>(null)

// 根据 matchType 获取正确的 match store
const matchStore = computed(() => {
  const matchType = syncStore.matchType
  switch (matchType) {
    case 'indoor':
      return useIndoorMatchStore()
    case 'beach':
      return useBeachMatchStore()
    default:
      return useMatchStore()
  }
})

const roomCodeChars = computed(() => {
  const code = syncStore.roomCode || ''
  return code.split('')
})

const isCodeComplete = computed(() => {
  return inputCodes.value.every(c => c.length === 1)
})

// 选择排球类型
function selectType(type: VolleyballType) {
  selectedType.value = type
  handleCreate()
}

// 合并为单个 onLoad，避免重复注册
onLoad(async (query) => {
  // 重置状态
  syncStore.reset()
  hasNavigated = false
  lastStatus = ''
  lastIsLive = false

  // 保存角色信息
  if (query?.role) {
    role.value = query.role as 'recorder' | 'referee1' | 'referee2'
  }

  if (query?.mode === 'join') {
    mode.value = 'join'
  } else {
    mode.value = 'create'
    // 不立即创建，等待选择类型
  }

  // 启动状态轮询
  startStatusPolling()
})

async function handleCreate() {
  if (!selectedType.value) return
  try {
    await syncService.createRoom(selectedType.value)
  } catch {
    // 错误已在 syncStore 中设置
  }
}

async function handleJoin() {
  const code = inputCodes.value.join('')
  try {
    // 传递角色信息给同步服务
    await syncService.joinRoom(code, role.value)
  } catch {
    // 错误已在 syncStore 中设置
  }
}

function onCodeInput(index: number, e: any) {
  const val = (e.detail?.value || '') as string
  inputCodes.value[index] = val.slice(-1)

  // 自动跳到下一个输入框
  if (val && index < 3) {
    focusIndex.value = index + 1
  }
}

// 状态轮询
let statusCheckTimer: ReturnType<typeof setInterval> | null = null
let lastStatus: string = ''
let lastIsLive: boolean = false
let hasNavigated = false // 防止重复跳转

function startStatusPolling() {
  if (statusCheckTimer) {
    clearInterval(statusCheckTimer)
    statusCheckTimer = null
  }

  statusCheckTimer = setInterval(() => {
    // 已跳转过，直接停止轮询
    if (hasNavigated) {
      if (statusCheckTimer) {
        clearInterval(statusCheckTimer)
        statusCheckTimer = null
      }
      return
    }

    const currentStatus = syncStore.status
    console.log('[Room] 状态轮询, status:', currentStatus, 'mode:', mode.value, 'hasNavigated:', hasNavigated)

    // 创建者：连接成功后跳转到比赛设置
    if (currentStatus === 'connected' && mode.value === 'create') {
      console.log('[Room] 创建者已连接，准备跳转到比赛设置')
      hasNavigated = true
      if (statusCheckTimer) {
        clearInterval(statusCheckTimer)
        statusCheckTimer = null
      }
      // 根据选择的类型跳转到不同的比赛设置页面
      const setupUrl = getSetupUrl()
      console.log('[Room] 跳转到:', setupUrl)
      uni.redirectTo({
        url: `${setupUrl}?sync=true&role=recorder`,
        success: () => {
          console.log('[Room] 跳转成功')
        },
        fail: (err: any) => {
          console.error('[Room] 跳转失败:', err)
          // redirectTo 失败时尝试 navigateTo
          uni.navigateTo({
            url: `${setupUrl}?sync=true&role=recorder`,
            success: () => console.log('[Room] navigateTo 成功'),
            fail: (err2: any) => console.error('[Room] navigateTo 失败:', err2)
          })
        }
      })
      return
    }

    // 加入者：检测比赛是否已开始
    const currentIsLive = matchStore.value.isLive
    console.log('[Room] 检测 isLive:', currentIsLive, 'matchType:', syncStore.matchType)
    if (currentIsLive && mode.value === 'join') {
      console.log('[Room] 加入者检测到比赛开始')
      hasNavigated = true
      if (statusCheckTimer) {
        clearInterval(statusCheckTimer)
        statusCheckTimer = null
      }
      // 根据角色跳转，第一裁判员显示相反界面
      const isFlipped = role.value === 'referee1' ? 'true' : 'false'
      const scoringUrl = getScoringUrl()
      console.log('[Room] 跳转到:', scoringUrl)
      uni.redirectTo({
        url: `${scoringUrl}?flipped=${isFlipped}`,
        fail: () => {
          uni.navigateTo({ url: `${scoringUrl}?flipped=${isFlipped}` })
        }
      })
      return
    }

    // 更新上次状态（用于调试）
    if (currentStatus !== lastStatus) {
      lastStatus = currentStatus
      console.log('[Room] 状态变化:', currentStatus)
    }
    lastIsLive = currentIsLive
  }, 300)
}

/** 根据类型获取比赛设置页面路径 */
function getSetupUrl(): string {
  switch (selectedType.value) {
    case 'indoor':
      return '/pages-indoor/match-setup/index'
    case 'beach':
      return '/pages-beach/match-setup/index'
    default:
      return '/pages/match-setup/index'
  }
}

/** 根据类型获取计分页面路径 */
function getScoringUrl(): string {
  // 加入者需要从房间信息获取比赛类型
  const matchType = syncStore.matchType || 'qipai'
  switch (matchType) {
    case 'indoor':
      return '/pages-indoor/scoring/index'
    case 'beach':
      return '/pages-beach/scoring/index'
    default:
      return '/pages/scoring/index'
  }
}

onHide(() => {
  if (statusCheckTimer) {
    clearInterval(statusCheckTimer)
    statusCheckTimer = null
  }
})
</script>

<style lang="scss" scoped>
.room-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40rpx;
  background: linear-gradient(135deg, #1a6b3c 0%, #0d4f2b 100%);
}

.type-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.type-label {
  font-size: 36rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 40rpx;
  font-weight: bold;
}

.type-options {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  width: 100%;
  max-width: 500rpx;
}

.type-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.15);
  border: 2rpx solid rgba(255, 255, 255, 0.3);
}

.type-option:active {
  background: rgba(255, 255, 255, 0.25);
}

.qipai-option {
  background: rgba(26, 107, 60, 0.6);
  border-color: rgba(26, 107, 60, 0.8);
}

.indoor-option {
  background: rgba(21, 101, 192, 0.6);
  border-color: rgba(21, 101, 192, 0.8);
}

.beach-option {
  background: rgba(255, 152, 0, 0.6);
  border-color: rgba(255, 152, 0, 0.8);
}

.type-name {
  font-size: 32rpx;
  color: #fff;
  font-weight: bold;
}

.type-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 8rpx;
}

.mode-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.label {
  font-size: 36rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 30rpx;
}

.hint {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 20rpx;
}

.loading-text, .success-text {
  font-size: 36rpx;
  color: #fff;
}

.success-text {
  color: #4ade80;
}

.room-code-display {
  display: flex;
  gap: 20rpx;
  margin: 20rpx 0;
}

.code-char {
  width: 100rpx;
  height: 120rpx;
  line-height: 120rpx;
  text-align: center;
  font-size: 72rpx;
  font-weight: bold;
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
}

.waiting-indicator {
  display: flex;
  gap: 16rpx;
  margin-top: 40rpx;
}

.dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  animation: pulse 1.4s infinite ease-in-out;
}

.dot1 { animation-delay: 0s; }
.dot2 { animation-delay: 0.2s; }
.dot3 { animation-delay: 0.4s; }

@keyframes pulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1.2); }
}

.code-input-row {
  display: flex;
  gap: 20rpx;
  margin: 20rpx 0 40rpx;
}

.code-input {
  width: 100rpx;
  height: 120rpx;
  text-align: center;
  font-size: 60rpx;
  font-weight: bold;
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
}

.join-btn {
  width: 400rpx;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  font-size: 32rpx;
  color: #1a6b3c;
  background: #fff;
  border-radius: 40rpx;
  border: none;

  &[disabled] {
    opacity: 0.5;
  }
}

.retry-btn {
  margin-top: 30rpx;
  width: 300rpx;
  height: 72rpx;
  line-height: 72rpx;
  text-align: center;
  font-size: 28rpx;
  color: #1a6b3c;
  background: #fff;
  border-radius: 36rpx;
  border: none;
}

.error {
  margin-top: 20rpx;
}

.error-text {
  font-size: 28rpx;
  color: #f87171;
}

.connected {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>