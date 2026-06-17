import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type MembershipTier = 'free' | 'vip'

export const useMembershipStore = defineStore('membership', () => {
  // openid 不再存储在前端，仅保留会员状态
  const tier = ref<MembershipTier>('free')
  const trialRemaining = ref(100)
  const loaded = ref(false)
  const loading = ref(false)

  const canCreateRoom = computed(() => {
    return tier.value === 'vip' || (tier.value === 'free' && trialRemaining.value > 0)
  })

  const tierLabel = computed(() => {
    if (tier.value === 'vip') return '永久会员'
    if (trialRemaining.value > 0) return `免费体验 (剩${trialRemaining.value}次)`
    return '免费用户'
  })

  function loadCache() {
    try {
      const cache = uni.getStorageSync('membership_cache')
      if (cache) {
        tier.value = cache.tier || 'free'
        trialRemaining.value = cache.trialRemaining ?? 100
      }
    } catch {}
  }

  function saveCache() {
    try {
      // 不存储 openid，只存储会员状态
      uni.setStorageSync('membership_cache', {
        tier: tier.value,
        trialRemaining: trialRemaining.value
      })
    } catch {}
  }

  async function login() {
    if (loaded.value) {
      // 已加载过，直接刷新
      await refreshMembership()
      return
    }
    loading.value = true
    loadCache()

    try {
      // #ifdef MP-WEIXIN
      const res = await wx.cloud.callFunction({
        name: 'login',
        timeout: 10000
      })
      const result = res.result as any
      tier.value = result.membership.tier as MembershipTier
      trialRemaining.value = result.membership.trialRemaining
      loaded.value = true
      saveCache()
      // #endif

      // #ifndef MP-WEIXIN
      loaded.value = true
      // #endif
    } catch (e) {
      console.error('[Membership] login failed')
    } finally {
      loading.value = false
    }
  }

  async function refreshMembership() {
    try {
      // #ifdef MP-WEIXIN
      const res = await wx.cloud.callFunction({
        name: 'checkMembership',
        timeout: 10000
      })
      const result = res.result as any
      tier.value = result.tier as MembershipTier
      trialRemaining.value = result.trialRemaining
      saveCache()
      // #endif
    } catch (e) {
      console.error('[Membership] refresh failed')
    }
  }

  function reset() {
    tier.value = 'free'
    trialRemaining.value = 100
    loaded.value = false
    try {
      uni.removeStorageSync('membership_cache')
    } catch {}
  }

  // 初始化时从缓存加载
  loadCache()

  return {
    tier,
    trialRemaining,
    loaded,
    loading,
    canCreateRoom,
    tierLabel,
    login,
    refreshMembership,
    reset
  }
})