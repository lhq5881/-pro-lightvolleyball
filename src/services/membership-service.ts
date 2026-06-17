class MembershipService {
  /** 登录获取会员状态 */
  async login(): Promise<{ membership: { tier: string; trialRemaining: number } }> {
    // #ifdef MP-WEIXIN
    const res = await wx.cloud.callFunction({
      name: 'login',
      timeout: 10000
    })
    return res.result as any
    // #endif

    // #ifndef MP-WEIXIN
    return { membership: { tier: 'free', trialRemaining: 0 } }
    // #endif
  }

  /** 查询会员状态 */
  async checkMembership(): Promise<{ tier: string; trialRemaining: number }> {
    // #ifdef MP-WEIXIN
    const res = await wx.cloud.callFunction({
      name: 'checkMembership',
      timeout: 10000
    })
    return res.result as any
    // #endif

    // #ifndef MP-WEIXIN
    return { tier: 'free', trialRemaining: 0 }
    // #endif
  }

  /** 购买永久会员 */
  async purchase(productType: 'vip'): Promise<void> {
    // #ifdef MP-WEIXIN
    let orderResult: any
    try {
      const orderRes = await wx.cloud.callFunction({
        name: 'createOrder',
        data: { productType },
        timeout: 60000
      })
      orderResult = orderRes.result as any
    } catch (callErr: any) {
      const msg = callErr.errMsg || callErr.message || '云函数调用失败'
      throw new Error(`云函数调用失败: ${msg}`)
    }

    if (!orderResult.success) {
      const msg = orderResult.message || '创建订单失败'
      throw new Error(msg)
    }

    // 2. 调起微信支付
    try {
      await wx.requestPayment({
        timeStamp: String(orderResult.timeStamp),
        nonceStr: orderResult.nonceStr,
        package: orderResult.package,
        signType: orderResult.signType || 'MD5',
        paySign: orderResult.paySign
      })
    } catch (e: any) {
      if (e.errMsg?.includes('cancel')) {
        throw new Error('支付已取消')
      }
      // 开发者工具模拟器不支持真实支付，给出明确提示
      throw new Error('支付调起失败，请在真机上测试支付功能')
    }

    // 3. 轮询确认会员状态更新
    const confirmed = await this.pollMembershipUpdate(5, 1500)
    if (!confirmed) {
      uni.showToast({ title: '支付成功，正在更新会员状态...', icon: 'none', duration: 2000 })
      await new Promise(r => setTimeout(r, 3000))
    }
    // #endif
  }

  /** 轮询确认会员状态 */
  private async pollMembershipUpdate(maxAttempts: number, interval: number): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, interval))
      const result = await this.checkMembership()
      if (result.tier !== 'free' || result.trialRemaining > 0) {
        return true
      }
    }
    return false
  }
}

export const membershipService = new MembershipService()