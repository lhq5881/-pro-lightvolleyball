const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 事件类型白名单
const ALLOWED_EVENT_TYPES = ['START_MATCH', 'STATE_UPDATE', 'SCORE', 'TIMEOUT', 'SUBSTITUTION', 'SWAP_COURT', 'END_SET', 'END_MATCH']

// Payload大小限制
const MAX_PAYLOAD_SIZE = 50000 // 50KB

// 输入验证函数
function validateEventInput(roomId, type, payload, deviceId) {
  if (!roomId || typeof roomId !== 'string' || roomId.length > 64) return false
  if (!ALLOWED_EVENT_TYPES.includes(type)) return false
  if (!deviceId || typeof deviceId !== 'string' || deviceId.length > 64) return false

  // Payload 大小验证
  if (payload) {
    try {
      const size = JSON.stringify(payload).length
      if (size > MAX_PAYLOAD_SIZE) return false
    } catch {
      return false
    }
  }

  return true
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { roomId, type, payload, deviceId } = event

  // 输入验证
  if (!validateEventInput(roomId, type, payload, deviceId)) {
    return { success: false, message: '参数错误' }
  }

  // 获取房间
  const roomRes = await db.collection('rooms').doc(roomId).get()
  const room = roomRes.data

  if (!room || room.status === 'completed' || room.status === 'abandoned') {
    return { success: false, message: '房间已关闭' }
  }

  // 授权检查：验证设备是否属于房间
  if (!room.connectedDevices || !room.connectedDevices.includes(deviceId)) {
    return { success: false, message: '设备未连接' }
  }

  // 原子递增序列号并写入事件
  const now = Date.now()
  const newSeq = room.lastEventSeq + 1

  await db.collection('events').add({
    data: {
      roomId,
      seq: newSeq,
      type,
      payload,
      deviceId,
      timestamp: now
    }
  })

  // 更新房间：递增序列号
  const updateData = {
    lastEventSeq: newSeq,
    updatedAt: now
  }

  // START_MATCH 事件：保存 matchConfig 并激活房间
  if (type === 'START_MATCH' && payload.matchConfig) {
    updateData.matchConfig = _.set(payload.matchConfig)
    updateData.status = 'active'
  }

  // STATE_UPDATE 事件：始终保存完整快照
  if (type === 'STATE_UPDATE' && payload.snapshot) {
    updateData.stateSnapshot = _.set(payload.snapshot)
    updateData.snapshotSeq = newSeq
  }

  await db.collection('rooms').doc(roomId).update({
    data: updateData
  })

  return { success: true, seq: newSeq }
}
