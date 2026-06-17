<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useMembershipStore } from '@/stores/membership'
import { membershipService } from '@/services/membership-service'

const membershipStore = useMembershipStore()
const purchasing = ref(false)

onShow(() => {
  membershipStore.refreshMembership()
})

async function buyVip() {
  if (purchasing.value) return
  purchasing.value = true
  try {
    await membershipService.purchase('vip')
    await membershipStore.refreshMembership()
    uni.showToast({ title: '购买成功！', icon: 'success' })
  } catch (e: any) {
    if (e.message !== '支付已取消') {
      console.error('[Membership] purchase error:', e)
      uni.showModal({
        title: '购买失败',
        content: e.message || '请稍后重试',
        showCancel: false
      })
    }
  } finally {
    purchasing.value = false
  }
}
</script>

<template>
  <view class="page">
    <!-- 当前状态 -->
    <view class="status-card">
      <text class="status-label">当前身份</text>
      <view class="status-row">
        <text class="status-tier">{{ membershipStore.tierLabel }}</text>
      </view>
    </view>

    <!-- VIP 用户已满级 -->
    <view v-if="membershipStore.tier === 'vip'" class="vip-full-card">
      <text class="vip-full-text">您已是永久会员，可无限创建同步房间</text>
    </view>

    <!-- 产品卡片 -->
    <view v-else class="products">
      <!-- 永久会员 -->
      <view class="product-card vip-card" @tap="buyVip">
        <view class="recommend-tag">
          <text class="recommend-text">推荐</text>
        </view>
        <view class="product-header">
          <text class="product-name">永久会员</text>
          <text class="product-price">¥19.9</text>
        </view>
        <text class="product-desc">无限次创建同步房间，永久有效</text>
        <view class="product-btn vip-btn" :class="{ disabled: purchasing }">
          <text class="product-btn-text">{{ purchasing ? '购买中...' : '立即购买' }}</text>
        </view>
      </view>
    </view>

    <!-- 功能对比 -->
    <view class="compare-card">
      <text class="compare-title">功能对比</text>
      <view class="compare-header-row">
        <text class="compare-feature"></text>
        <text class="compare-col">免费</text>
        <text class="compare-col">永久会员</text>
      </view>
      <view class="compare-row">
        <text class="compare-feature">本地计分</text>
        <text class="compare-check yes">✓</text>
        <text class="compare-check yes">✓</text>
      </view>
      <view class="compare-row">
        <text class="compare-feature">加入房间</text>
        <text class="compare-check yes">✓</text>
        <text class="compare-check yes">✓</text>
      </view>
      <view class="compare-row">
        <text class="compare-feature">创建房间</text>
        <text class="compare-check yes">1次</text>
        <text class="compare-check yes">无限</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.page {
  min-height: 100vh;
  padding: $spacing-base;
  background-color: #f5f5f5;
}

.status-card {
  background: linear-gradient(135deg, #1a6b3c, #0d4f2b);
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-base;
}

.status-label {
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.7);
  display: block;
  margin-bottom: $spacing-xs;
}

.status-row {
  display: flex;
  align-items: center;
}

.status-tier {
  font-size: $font-size-xl;
  font-weight: bold;
  color: #ffd700;
}

.vip-full-card {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  text-align: center;
  margin-bottom: $spacing-base;
}

.vip-full-text {
  font-size: $font-size-md;
  color: #333;
  font-weight: bold;
}

.products {
  display: flex;
  flex-direction: column;
  gap: $spacing-base;
  margin-bottom: $spacing-base;
}

.product-card {
  position: relative;
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  border: 2rpx solid $border-color;
  overflow: hidden;
}

.vip-card {
  border-color: #ffd700;
  background: linear-gradient(to bottom, #fffdf5, $bg-white);
}

.recommend-tag {
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  padding: 4rpx 20rpx;
  border-radius: 0 0 0 16rpx;
}

.recommend-text {
  font-size: $font-size-xs;
  color: #333;
  font-weight: bold;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-sm;
}

.product-name {
  font-size: $font-size-lg;
  font-weight: bold;
  color: $text-color;
}

.product-price {
  font-size: $font-size-xl;
  font-weight: bold;
  color: #e74c3c;
}

.product-desc {
  font-size: $font-size-sm;
  color: $text-secondary;
  display: block;
  margin-bottom: $spacing-base;
}

.product-btn {
  background-color: $primary-color;
  border-radius: $border-radius;
  padding: $spacing-sm 0;
  text-align: center;
}

.vip-btn {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
}

.product-btn-text {
  font-size: $font-size-base;
  color: #fff;
  font-weight: bold;
}

.product-btn.disabled {
  opacity: 0.6;
}

.compare-card {
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
}

.compare-title {
  font-size: $font-size-md;
  font-weight: bold;
  color: $text-color;
  display: block;
  margin-bottom: $spacing-base;
}

.compare-header-row {
  display: flex;
  align-items: center;
  padding-bottom: $spacing-sm;
  border-bottom: 2rpx solid $border-color;
  margin-bottom: $spacing-sm;
}

.compare-feature {
  flex: 1;
  font-size: $font-size-sm;
  color: $text-secondary;
}

.compare-col {
  width: 120rpx;
  text-align: center;
  font-size: $font-size-xs;
  color: $text-light;
  font-weight: bold;
}

.compare-row {
  display: flex;
  align-items: center;
  padding: $spacing-sm 0;
  border-bottom: 1rpx solid $border-color;

  &:last-child {
    border-bottom: none;
  }
}

.compare-check {
  width: 120rpx;
  text-align: center;
  font-size: $font-size-sm;

  &.yes {
    color: $primary-color;
    font-weight: bold;
  }

  &.no {
    color: #e74c3c;
  }
}
</style>