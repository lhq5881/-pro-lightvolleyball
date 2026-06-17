const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 管理员 openid 列表，替换为你自己的 openid
const ADMIN_OPENIDS = [
  // 在这里填入你的 openid，可在云开发控制台 → 用户管理中查看
]

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  // 权限校验：仅管理员可调用
  if (!ADMIN_OPENIDS.includes(OPENID)) {
    return { success: false, message: '无权限' }
  }

  const { targetOpenid, tier, trialRemaining } = event

  if (!targetOpenid || !['free', 'vip'].includes(tier)) {
    return { success: false, message: '参数错误：需要 targetOpenid 和 tier(free/vip)' }
  }

  try {
    const { data: memberships } = await db.collection('memberships')
      .where({ openid: targetOpenid })
      .limit(1)
      .get()

    const updateData = {
      tier,
      updatedAt: Date.now()
    }

    if (tier === 'vip') {
      updateData.trialRemaining = 0
    } else {
      updateData.trialRemaining = typeof trialRemaining === 'number' ? trialRemaining : 10
    }

    if (memberships.length === 0) {
      // 创建会员文档
      await db.collection('memberships').add({
        data: {
          openid: targetOpenid,
          ...updateData
        }
      })
    } else {
      // 更新会员文档
      await db.collection('memberships').doc(memberships[0]._id).update({
        data: updateData
      })
    }

    return { success: true, message: `已设置 ${targetOpenid} 为 ${tier}` }
  } catch (err) {
    console.error('adminSetMembership error:', err)
    return { success: false, message: '操作失败' }
  }
}
