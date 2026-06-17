const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const PRODUCT_CONFIG = {
  vip: { amount: 1990, body: '气排球裁判助手-永久会员' }
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { productType } = event

  if (!PRODUCT_CONFIG[productType]) {
    return { success: false, message: '无效的商品类型' }
  }

  // VIP 用户无需再购买
  const { data: memberships } = await db.collection('memberships')
    .where({ openid: OPENID })
    .limit(1)
    .get()

  if (memberships.length > 0 && memberships[0].tier === 'vip') {
    return { success: false, message: '您已是永久会员，无需购买' }
  }

  const config = PRODUCT_CONFIG[productType]
  const orderNo = `ORD_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  try {
    // 调用微信云支付统一下单
    const payResult = await cloud.cloudPay.unifiedOrder({
      body: config.body,
      outTradeNo: orderNo,
      totalFee: config.amount,
      spbillCreateIp: '127.0.0.1',
      envId: cloud.DYNAMIC_CURRENT_ENV,
      nonceStr: Math.random().toString(36).slice(2, 15),
      tradeType: 'JSAPI',
      functionName: 'payCallback'
    })

    // 不记录支付敏感数据到日志
    // console.log 已移除，防止 prepayId/paySign 泄露

    // 写入订单记录
    await db.collection('orders').add({
      data: {
        openid: OPENID,
        orderNo,
        productType,
        amount: config.amount,
        status: 'pending',
        prepayId: payResult.prepayId || '',
        paidAt: null,
        createdAt: Date.now()
      }
    })

    // unifiedOrder 已返回支付参数，直接透传给前端
    return {
      success: true,
      orderNo,
      prepayId: payResult.prepayId,
      timeStamp: payResult.timeStamp,
      nonceStr: payResult.nonceStr,
      package: payResult.package,
      signType: payResult.signType || 'MD5',
      paySign: payResult.paySign
    }
  } catch (err) {
    console.error('createOrder error:', err)
    // 返回通用错误信息，不泄露内部细节
    return {
      success: false,
      message: '创建订单失败，请稍后重试'
    }
  }
}