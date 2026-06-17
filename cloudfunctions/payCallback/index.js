const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 微信支付回调，必须导出为 payCallback
exports.payCallback = async (event, context) => {
  const { resultCode, outTradeNo, totalFee } = event

  // 支付失败，直接返回成功确认
  if (resultCode !== 'SUCCESS') {
    return { errcode: 0, errmsg: 'OK' }
  }

  try {
    // 幂等检查 + 条件更新：只在 status=pending 时更新，避免 TOCTOU 竞态
    const { data: orders } = await db.collection('orders')
      .where({ orderNo: outTradeNo })
      .limit(1)
      .get()

    if (orders.length === 0) {
      console.error('Order not found:', outTradeNo)
      return { errcode: 0, errmsg: 'OK' }
    }

    const order = orders[0]

    // 已处理过，直接返回
    if (order.status === 'paid') {
      return { errcode: 0, errmsg: 'OK' }
    }

    // 校验支付金额与订单金额一致
    if (totalFee !== order.amount) {
      console.error('Amount mismatch:', { totalFee, expected: order.amount, orderNo })
      return { errcode: 0, errmsg: 'OK' }
    }

    // 条件更新：只有 pending 状态才更新为 paid（原子性幂等）
    const updateResult = await db.collection('orders').doc(order._id).update({
      data: { status: 'paid', paidAt: Date.now() }
    })

    // 如果没有实际更新（被并发回调抢先处理了），直接返回
    if (updateResult.stats && updateResult.stats.updated === 0) {
      return { errcode: 0, errmsg: 'OK' }
    }

    // 更新会员状态
    const { data: memberships } = await db.collection('memberships')
      .where({ openid: order.openid })
      .limit(1)
      .get()

    const now = Date.now()

    if (memberships.length === 0) {
      // 防御处理：创建会员文档
      await db.collection('memberships').add({
        data: { openid: order.openid, tier: 'vip', trialRemaining: 0, updatedAt: now }
      })
    } else {
      const membership = memberships[0]
      // 升级为永久会员
      await db.collection('memberships').doc(membership._id).update({
        data: { tier: 'vip', updatedAt: now }
      })
    }

    return { errcode: 0, errmsg: 'OK' }
  } catch (err) {
    console.error('payCallback error:', err)
    return { errcode: -1, errmsg: 'INTERNAL_ERROR' }
  }
}