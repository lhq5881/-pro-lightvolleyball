const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 输入验证函数
function validateDeviceId(deviceId) {
  return deviceId && typeof deviceId === 'string' && deviceId.length <= 64
}

function validateRoomCode(roomCode) {
  // 支持6位字母数字（新格式）或4位数字（兼容旧格式）
  if (!roomCode || typeof roomCode !== 'string') return false
  return /^[A-HJ-NP-Z2-9]{6}$/.test(roomCode) || /^\d{4}$/.test(roomCode)
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { roomCode, deviceId, reconnect } = event

  // 输入验证
  if (!validateRoomCode(roomCode)) {
    return { success: false, message: '房间码格式错误' }
  }
  if (!validateDeviceId(deviceId)) {
    return { success: false, message: '参数错误' }
  }

  // 查找房间
  const roomRes = await db.collection('rooms')
    .where({ roomCode, status: _.in(['waiting', 'active']) })
    .get()

  if (roomRes.data.length === 0) {
    return { success: false, message: '房间不存在或已关闭' }
  }

  const room = roomRes.data[0]

  if (!reconnect) {
    // 新加入（非重连）
    if (room.connectedDevices && room.connectedDevices.length >= 2) {
      return { success: false, message: '房间已满' }
    }

    if (room.connectedDevices && room.connectedDevices.includes(deviceId)) {
      return { success: false, message: '已在房间中' }
    }

    // 添加设备到房间，状态改为 active
    const now = Date.now()
    await db.collection('rooms').doc(room._id).update({
      data: {
        connectedDevices: _.push(deviceId),
        updatedAt: now,
        status: 'active'
      }
    })

    // 创建连接记录（绑定 openid 用于安全验证）
    await db.collection('connections').add({
      data: {
        roomId: room._id,
        deviceId,
        openid: OPENID, // 绑定用户身份
        lastHeartbeat: now,
        connectedAt: now
      }
    })
  } else {
    // 重连：更新心跳
    const now = Date.now()
    const connRes = await db.collection('connections')
      .where({ roomId: room._id, deviceId })
      .get()

    if (connRes.data.length > 0) {
      await db.collection('connections').doc(connRes.data[0]._id).update({
        data: { lastHeartbeat: now }
      })
    }
  }

  return {
    success: true,
    roomId: room._id,
    stateSnapshot: room.stateSnapshot || null,
    snapshotSeq: room.snapshotSeq || 0,
    matchConfig: room.matchConfig || null,
    matchType: room.matchType || 'qipai'
  }
}
