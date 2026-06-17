const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 输入验证和清理函数
function sanitizeString(str, maxLength = 50) {
  if (!str || typeof str !== 'string') return ''
  // 移除潜在的HTML标签和特殊字符
  return str.replace(/<[^>]*>/g, '').replace(/[^\w一-龥\s-]/g, '').slice(0, maxLength)
}

// 速率限制检查（每用户每分钟最多5次）
const RATE_LIMIT_WINDOW = 60000 // 1分钟
const RATE_LIMIT_MAX = 5

async function checkRateLimit(openid) {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW

  // 查询用户在窗口内的创建次数
  const { total } = await db.collection('rooms')
    .where({
      creatorOpenid: openid,
      createdAt: _.gte(windowStart)
    })
    .count()

  return total < RATE_LIMIT_MAX
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { deviceId, matchType } = event

  // 输入验证
  if (!deviceId || typeof deviceId !== 'string' || deviceId.length > 64) {
    return { success: false, message: '参数错误' }
  }

  // 验证并清理 matchType
  const validMatchTypes = ['qipai', 'indoor', 'beach']
  const sanitizedMatchType = validMatchTypes.includes(matchType) ? matchType : 'qipai'

  // 速率限制检查
  const allowed = await checkRateLimit(OPENID)
  if (!allowed) {
    return { success: false, message: '操作过于频繁，请稍后再试' }
  }

  // 推广阶段：无需会员检查，所有用户均可创建房间

  // === 创建房间 ===
  // 生成6位字母数字房间码（更安全，避免暴力破解）
  function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 移除易混淆字符 0,O,I,1
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
  }

  let roomCode = ''
  let attempts = 0
  while (attempts < 10) {
    roomCode = generateRoomCode()
    const existing = await db.collection('rooms')
      .where({ roomCode, status: _.in(['waiting', 'active']) })
      .count()
    if (existing.total === 0) break
    attempts++
  }

  if (attempts >= 10) {
    return { success: false, message: '房间码生成失败，请重试' }
  }

  const now = Date.now()
  let result
  try {
    result = await db.collection('rooms').add({
      data: {
        roomCode,
        status: 'waiting',
        createdAt: now,
        updatedAt: now,
        lastEventSeq: 0,
        creatorDeviceId: deviceId,
        creatorOpenid: OPENID,
        connectedDevices: [deviceId],
        snapshotSeq: 0,
        matchType: sanitizedMatchType
      }
    })

    // 创建连接记录
    await db.collection('connections').add({
      data: {
        roomId: result._id,
        deviceId,
        lastHeartbeat: now,
        connectedAt: now
      }
    })
  } catch (err) {
    console.error('createRoom: room creation failed:', err)
    return { success: false, message: '创建房间失败，请重试' }
  }

  return {
    success: true,
    roomId: result._id,
    roomCode
  }
}
