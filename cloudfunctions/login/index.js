const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const DEFAULT_TRIAL_REMAINING = 100

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  const { data: memberships } = await db.collection('memberships')
    .where({ openid: OPENID })
    .limit(1)
    .get()

  let membership

  if (memberships.length === 0) {
    // 首次登录，赠送创建房间机会
    const defaultMembership = {
      openid: OPENID,
      tier: 'free',
      trialRemaining: DEFAULT_TRIAL_REMAINING,
      updatedAt: Date.now()
    }
    await db.collection('memberships').add({ data: defaultMembership })
    membership = defaultMembership
  } else {
    membership = memberships[0]
    // 如果用户是 free 且没有体验次数，补发默认次数
    if (membership.tier === 'free' && (membership.trialRemaining === undefined || membership.trialRemaining === 0)) {
      await db.collection('memberships').doc(membership._id).update({
        data: { trialRemaining: DEFAULT_TRIAL_REMAINING, updatedAt: Date.now() }
      })
      membership.trialRemaining = DEFAULT_TRIAL_REMAINING
    }
  }

  return {
    // 不返回 openid 到前端，前端不需要知道 openid
    membership: {
      tier: membership.tier,
      trialRemaining: membership.trialRemaining || 0
    }
  }
}
