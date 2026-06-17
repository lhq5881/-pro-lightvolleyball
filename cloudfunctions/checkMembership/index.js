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

  if (memberships.length === 0) {
    return { tier: 'free', trialRemaining: DEFAULT_TRIAL_REMAINING }
  }

  const membership = memberships[0]

  // free 用户没有体验次数时补发
  if (membership.tier === 'free' && (membership.trialRemaining === undefined || membership.trialRemaining === 0)) {
    await db.collection('memberships').doc(membership._id).update({
      data: { trialRemaining: DEFAULT_TRIAL_REMAINING, updatedAt: Date.now() }
    })
    return { tier: 'free', trialRemaining: DEFAULT_TRIAL_REMAINING }
  }

  return {
    tier: membership.tier,
    trialRemaining: membership.trialRemaining || 0
  }
}
