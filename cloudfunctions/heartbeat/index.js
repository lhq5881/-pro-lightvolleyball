const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 输入验证函数
function validateInput(roomId, deviceId) {
  if (!roomId || typeof roomId !== 'string' || roomId.length > 64) return false
  if (!deviceId || typeof deviceId !== 'string' || deviceId.length > 64) return false
  return true
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { roomId, deviceId } = event

  // 输入验证
  if (!validateInput(roomId, deviceId)) {
    return { success: false, message: '参数错误' }
  }

  const now = Date.now()

  // 验证连接是否存在且属于此用户（通过 joinRoom 创建）
  const connRes = await db.collection('connections')
    .where({ roomId, deviceId })
    .get()

  // 如果连接不存在，拒绝操作
  if (connRes.data.length === 0) {
    return { success: false, message: '无效连接' }
  }

  // 更新连接心跳
  await db.collection('connections').doc(connRes.data[0]._id).update({
    data: { lastHeartbeat: now }
  })

  // 检查过期连接（90秒无心跳）
  const expireThreshold = now - 90000
  const expiredConns = await db.collection('connections')
    .where({
      roomId,
      lastHeartbeat: db.command.lt(expireThreshold)
    })
    .get()

  for (const conn of expiredConns.data) {
    // 从房间移除过期设备
    await db.collection('rooms').doc(roomId).update({
      data: {
        connectedDevices: db.command.pull(conn.deviceId),
        updatedAt: now
      }
    })
    // 删除过期连接记录
    await db.collection('connections').doc(conn._id).remove()
  }

  return { success: true }
}
