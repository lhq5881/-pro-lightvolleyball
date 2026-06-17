const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { roomId, deviceId } = event

  // 输入验证
  if (!roomId || typeof roomId !== 'string') {
    return { success: false, message: '参数错误' }
  }

  // 获取房间信息
  const roomRes = await db.collection('rooms').doc(roomId).get()
  const room = roomRes.data

  if (!room) {
    return { success: false, message: '房间不存在' }
  }

  // 授权检查：创建者直接通过，其他用户需要验证连接归属
  const isCreator = room.creatorOpenid === OPENID

  if (!isCreator) {
    // 非创建者：验证连接是否属于当前用户
    const connRes = await db.collection('connections')
      .where({ roomId, deviceId, openid: OPENID })
      .limit(1)
      .get()

    if (connRes.data.length === 0) {
      return { success: false, message: '无权限操作此房间' }
    }
  }

  const now = Date.now()

  // 从房间移除设备
  await db.collection('rooms').doc(roomId).update({
    data: {
      connectedDevices: _.pull(deviceId),
      updatedAt: now
    }
  })

  // 删除连接记录
  const connRes = await db.collection('connections')
    .where({ roomId, deviceId })
    .get()

  for (const conn of connRes.data) {
    await db.collection('connections').doc(conn._id).remove()
  }

  // 检查房间是否还有设备
  const roomRes = await db.collection('rooms').doc(roomId).get()
  if (roomRes.data && roomRes.data.connectedDevices.length === 0) {
    await db.collection('rooms').doc(roomId).update({
      data: { status: 'abandoned', updatedAt: now }
    })
  }

  return { success: true }
}
