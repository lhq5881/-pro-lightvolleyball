<template>
  <view class="page">
    <canvas
      v-if="data"
      type="2d"
      id="sheet"
      class="sheet-canvas"
      :style="{ width: '750rpx', height: canvasHeight + 'rpx' }"
    />
    <view v-if="!data" class="loading">
      <text class="loading-text">加载中...</text>
    </view>
    <view class="actions" v-if="data">
      <button class="action-btn save-btn" @tap="saveToAlbum" :disabled="saving">
        {{ saving ? '保存中...' : '保存到相册' }}
      </button>
      <button class="action-btn share-btn" open-type="share">分享给好友</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { useHistoryStore } from '@/stores/history'
import { useIndoorMatchStore } from '@/stores/indoor-match'
import { buildScoresheetData, calcScoresheetHeight, type ScoresheetData } from '@/utils/scoresheet-builder'
import { drawScoresheet } from '@/utils/scoresheet-drawer'
import type { Match } from '@/models/match'

const data = ref<ScoresheetData | null>(null)
const canvasHeight = ref(3020)
const saving = ref(false)
const tempFilePath = ref('')
const matchId = ref('')

onLoad(async (opts) => {
  let match: Match | null = null
  if (opts?.id) {
    matchId.value = opts.id
    const historyStore = useHistoryStore()
    historyStore.loadHistory()
    match = historyStore.getMatchById(opts.id) ?? null
  } else {
    match = useIndoorMatchStore().match
  }
  if (match) {
    data.value = buildScoresheetData(match)
    canvasHeight.value = calcScoresheetHeight(data.value)
    await nextTick()
    initAndDraw()
  } else {
    uni.showToast({ title: '未找到比赛数据', icon: 'none' })
  }
})

function initAndDraw() {
  const query = uni.createSelectorQuery()
  query.select('#sheet').fields({ node: true, size: true }).exec((res) => {
    if (!res[0]?.node) {
      console.error('Canvas node not found')
      return
    }
    const canvas = res[0].node
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const dpr = uni.getSystemInfoSync().pixelRatio
    canvas.width = 750 * dpr
    canvas.height = canvasHeight.value * dpr
    ctx.scale(dpr, dpr)

    if (data.value) {
      drawScoresheet(ctx, data.value)
      // 生成临时图片
      uni.canvasToTempFilePath({
        canvas: canvas,
        fileType: 'png',
        quality: 1,
        success: (res) => {
          tempFilePath.value = res.tempFilePath
        },
        fail: (err) => {
          console.error('canvasToTempFilePath failed:', err)
        }
      })
    }
  })
}

async function saveToAlbum() {
  if (!tempFilePath.value) {
    uni.showToast({ title: '记分表生成中，请稍候', icon: 'none' })
    return
  }
  saving.value = true
  try {
    // 请求相册权限
    const authSetting = await new Promise<UniApp.GetSettingSuccessCallbackResult>((resolve) => {
      uni.getSetting({ success: resolve })
    })
    if (!authSetting.authSetting['scope.writePhotosAlbum']) {
      await new Promise<void>((resolve, reject) => {
        uni.authorize({
          scope: 'scope.writePhotosAlbum',
          success: resolve,
          fail: reject
        })
      }).catch(() => {
        uni.showModal({
          title: '提示',
          content: '需要相册权限才能保存图片，请在设置中开启',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) uni.openSetting()
          }
        })
        saving.value = false
        return
      })
    }
    uni.saveImageToPhotosAlbum({
      filePath: tempFilePath.value,
      success: () => {
        uni.showToast({ title: '已保存到相册', icon: 'success' })
      },
      fail: () => {
        uni.showToast({ title: '保存失败', icon: 'none' })
      },
      complete: () => {
        saving.value = false
      }
    })
  } catch {
    saving.value = false
  }
}

onShareAppMessage(() => ({
  title: data.value
    ? `${data.value.winner === 'A' ? data.value.teamAName : data.value.teamBName} 获胜 ${data.value.setsWonA}:${data.value.setsWonB}`
    : '排球比赛记分表',
  path: `/pages/history-detail/index?id=${matchId.value}`,
  imageUrl: tempFilePath.value || undefined
}))
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.page {
  min-height: 100vh;
  background-color: #f0f0f0;
  padding-bottom: 120rpx;
}

.sheet-canvas {
  display: block;
  margin: 0 auto;
  background-color: #fff;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

.actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: rgba(255, 255, 255, 0.95);
  border-top: 1rpx solid #e0e0e0;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: bold;
  border: none;
}

.save-btn {
  background-color: #1a6b3c;
  color: #fff;
}

.share-btn {
  background-color: #f5f5f5;
  color: #333;
}
</style>
