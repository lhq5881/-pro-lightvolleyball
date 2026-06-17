import type { SyncEvent, SyncEventType, MatchStateSnapshot, RoomDocument } from './sync-types'
import { useSyncStore, type VolleyballType } from '@/stores/sync'
import { useMatchStore } from '@/stores/match'
import { useIndoorMatchStore } from '@/stores/indoor-match'
import { useBeachMatchStore } from '@/stores/beach-match'

const HEARTBEAT_INTERVAL = 30000
const RECONNECT_BASE_DELAY = 2000
const RECONNECT_MAX_DELAY = 30000

// 延迟获取数据库实例，确保云环境已初始化
function getDb() {
  // #ifdef MP-WEIXIN
  return wx.cloud.database()
  // #endif
  // #ifndef MP-WEIXIN
  return null
  // #endif
}

function getDbCommand() {
  // #ifdef MP-WEIXIN
  return wx.cloud.database().command
  // #endif
  // #ifndef MP-WEIXIN
  return null
  // #endif
}

// 延迟获取 match store 实例（避免循环依赖导致的初始化顺序问题）
function getMatchStore() {
  const syncStore = useSyncStore()
  const matchType = syncStore.matchType
  console.log('[Sync] getMatchStore, matchType:', matchType)
  switch (matchType) {
    case 'indoor':
      console.log('[Sync] 返回 IndoorMatchStore')
      return useIndoorMatchStore()
    case 'beach':
      return useBeachMatchStore()
    default:
      return useMatchStore()
  }
}

class SyncService {
  private deviceId: string = ''
  private roomId: string | null = null
  private roomCode: string | null = null
  private lastProcessedSeq: number = 0
  private eventListener: any = null
  private roomListener: any = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts: number = 0
  private isApplyingRemote: boolean = false

  constructor() {
    this.initDeviceId()
  }

  private initDeviceId() {
    try {
      let id = uni.getStorageSync('sync_device_id')
      if (!id) {
        id = `d_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        uni.setStorageSync('sync_device_id', id)
      }
      this.deviceId = id
    } catch {
      this.deviceId = `d_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    }
  }

  get syncEnabled(): boolean {
    const syncStore = useSyncStore()
    return syncStore.status === 'connected' || syncStore.status === 'waiting'
  }

  /** 创建房间 */
  async createRoom(matchType: VolleyballType = 'qipai'): Promise<string> {
    const syncStore = useSyncStore()
    syncStore.setCreating()
    syncStore.setMatchType(matchType)

    try {
      // #ifdef MP-WEIXIN
      console.log('[Sync] 创建房间, deviceId:', this.deviceId, 'matchType:', matchType)
      const res = await wx.cloud.callFunction({
        name: 'createRoom',
        data: { deviceId: this.deviceId, matchType },
        timeout: 10000
      })
      const result = res.result as any
      console.log('[Sync] 创建房间结果:', result)

      // 检查云函数返回的 success 字段
      if (!result.success) {
        const errMsg = result.message || '创建房间失败'
        const err: any = new Error(errMsg)
        err.code = result.code
        throw err
      }

      this.roomId = result.roomId
      this.roomCode = result.roomCode
      this.lastProcessedSeq = 0

      syncStore.setWaiting(result.roomCode, result.roomId)
      this.startRoomListener()
      return result.roomCode
      // #endif

      // #ifndef MP-WEIXIN
      throw new Error('云开发仅支持微信小程序')
      // #endif
    } catch (e: any) {
      console.error('[Sync] 创建房间失败:', e)
      syncStore.setError(e.message || '创建房间失败')
      throw e
    }
  }

  /** 加入房间 */
  async joinRoom(code: string, role?: 'recorder' | 'referee1' | 'referee2'): Promise<void> {
    const syncStore = useSyncStore()
    syncStore.setJoining()

    try {
      // #ifdef MP-WEIXIN
      console.log('[Sync] 加入房间, code:', code, 'deviceId:', this.deviceId, 'role:', role)
      const res = await wx.cloud.callFunction({
        name: 'joinRoom',
        data: { roomCode: code, deviceId: this.deviceId, role: role || 'referee2' },
        timeout: 10000
      })
      const result = res.result as any
      console.log('[Sync] 加入房间结果:', result)

      if (!result.success) {
        syncStore.setError(result.message || '加入房间失败')
        return
      }

      this.roomId = result.roomId
      this.roomCode = code
      this.lastProcessedSeq = result.snapshotSeq || 0

      // 获取比赛类型
      if (result.matchType) {
        const syncStore = useSyncStore()
        syncStore.setMatchType(result.matchType as VolleyballType)
      }

      // 从快照恢复状态
      if (result.stateSnapshot) {
        const matchStore = getMatchStore()
        matchStore.loadSnapshot(result.stateSnapshot)
        console.log('[Sync] 从快照恢复状态完成')
      }

      syncStore.setConnected(code, result.roomId, false)
      this.startEventStream()
      this.startHeartbeat()
      console.log('[Sync] 加入房间成功，事件流已启动')
      // #endif
    } catch (e: any) {
      console.error('[Sync] 加入房间失败:', e)
      syncStore.setError(e.message || '加入房间失败')
      throw e
    }
  }

  /** 推送事件 */
  async pushEvent(type: SyncEventType, payload: Record<string, any>): Promise<void> {
    if (!this.roomId || this.isApplyingRemote) return

    const syncStore = useSyncStore()
    syncStore.pendingAction = true

    try {
      // #ifdef MP-WEIXIN
      console.log('[Sync] 推送事件:', type, 'roomId:', this.roomId)
      await wx.cloud.callFunction({
        name: 'pushEvent',
        data: {
          roomId: this.roomId,
          type,
          payload,
          deviceId: this.deviceId
        },
        timeout: 10000
      })
      syncStore.lastSyncAt = Date.now()
      console.log('[Sync] 推送事件成功:', type)
      // #endif
    } catch (e: any) {
      console.error('[Sync] 推送事件失败:', e)
    } finally {
      syncStore.pendingAction = false
    }
  }

  /** 启动事件流监听 */
  startEventStream(): void {
    if (!this.roomId) return
    this.stopEventStream()

    // #ifdef MP-WEIXIN
    const db = getDb()!
    const _ = getDbCommand()!
    console.log('[Sync] 启动事件流监听, roomId:', this.roomId, 'lastSeq:', this.lastProcessedSeq)
    const eventsCollection = db.collection('events')
    this.eventListener = eventsCollection
      .where({
        roomId: this.roomId,
        seq: _.gt(this.lastProcessedSeq)
      })
      .watch({
        onChange: (snapshot: any) => {
          console.log('[Sync] 事件流 onChange, docs数量:', snapshot.docs?.length, 'type:', snapshot.type)
          this.handleEventSnapshot(snapshot)
        },
        onError: (err: any) => {
          console.error('[Sync] 事件流错误:', err)
          this.handleDisconnect()
        }
      })
    console.log('[Sync] 事件流监听已创建')
    // #endif
  }

  /** 停止事件流监听 */
  stopEventStream(): void {
    if (this.eventListener) {
      this.eventListener.close()
      this.eventListener = null
    }
  }

  /** 处理事件快照 */
  private handleEventSnapshot(snapshot: any): void {
    if (!snapshot.docs || snapshot.docs.length === 0) return

    const syncStore = useSyncStore()
    const matchStore = getMatchStore()

    // 过滤：只处理 seq > lastProcessedSeq 且不是自己发出的事件
    const currentSeq = this.lastProcessedSeq
    const events = snapshot.docs
      .filter((e: SyncEvent) => e.seq > currentSeq && e.deviceId !== this.deviceId)
      .sort((a: SyncEvent, b: SyncEvent) => a.seq - b.seq)

    // 更新 lastProcessedSeq（包括自己的事件）
    const allNewEvents = snapshot.docs
      .filter((e: SyncEvent) => e.seq > currentSeq)
      .sort((a: SyncEvent, b: SyncEvent) => a.seq - b.seq)
    if (allNewEvents.length > 0) {
      this.lastProcessedSeq = allNewEvents[allNewEvents.length - 1].seq
    }

    if (events.length === 0) return

    console.log('[Sync] 收到远程事件:', events.length, '条')

    this.isApplyingRemote = true
    try {
      // 只取最新的一条 STATE_UPDATE 事件加载（跳过中间状态）
      const stateUpdates = events.filter(e => e.type === 'STATE_UPDATE')
      const startMatches = events.filter(e => e.type === 'START_MATCH')

      // START_MATCH 先处理（如果有的话）
      for (const event of startMatches) {
        console.log('[Sync] 应用 START_MATCH, seq:', event.seq, 'matchStore:', matchStore.$id)
        try {
          matchStore.applyRemoteEvent(event)
        } catch (err) {
          console.error('[Sync] applyRemoteEvent START_MATCH error:', err)
        }
      }

      // STATE_UPDATE 处理：检测是否有弹窗事件，如果有则按顺序加载
      if (stateUpdates.length > 0) {
        // 检查是否有弹窗相关的事件（pendingCourtSwap、pendingTechTimeout、lastTimeout）
        // 需要检查所有事件，因为弹窗事件可能在中间状态
        let popupEventInfo = ''
        const hasPopupEvent = stateUpdates.some(e => {
          const snapshot = e.payload.snapshot
          if (!snapshot) return false
          // 检查是否有需要显示弹窗的状态
          if (snapshot.pendingCourtSwap) {
            popupEventInfo = `pendingCourtSwap at seq ${e.seq}`
            return true
          }
          if (snapshot.pendingTechTimeout) {
            popupEventInfo = `pendingTechTimeout at seq ${e.seq}`
            return true
          }
          if (snapshot.lastTimeout) {
            popupEventInfo = `lastTimeout at seq ${e.seq}`
            return true
          }
          return false
        })

        if (hasPopupEvent) {
          // 有弹窗事件时，按顺序加载所有事件，确保弹窗状态正确
          console.log('[Sync] 检测到弹窗事件:', popupEventInfo, '按顺序加载', stateUpdates.length, '个状态')
          for (const event of stateUpdates) {
            console.log('[Sync] 加载快照, seq:', event.seq, 'pendingCourtSwap:', !!event.payload.snapshot?.pendingCourtSwap, 'pendingTechTimeout:', !!event.payload.snapshot?.pendingTechTimeout, 'lastTimeout:', !!event.payload.snapshot?.lastTimeout)
            try {
              matchStore.applyRemoteEvent(event)
            } catch (err) {
              console.error('[Sync] applyRemoteEvent STATE_UPDATE error:', err)
            }
          }
        } else {
          // 无弹窗事件时，只加载最新的一条（跳过中间状态）
          const latest = stateUpdates[stateUpdates.length - 1]
          console.log('[Sync] 加载最新快照, seq:', latest.seq, 'matchStore:', matchStore.$id)
          try {
            matchStore.applyRemoteEvent(latest)
          } catch (err) {
            console.error('[Sync] applyRemoteEvent STATE_UPDATE error:', err)
          }
        }
      }
    } finally {
      this.isApplyingRemote = false
    }

    syncStore.lastSyncAt = Date.now()
  }

  /** 监听房间状态变化（等待对手加入） */
  private startRoomListener(): void {
    if (!this.roomId) return
    this.stopRoomListener()

    // #ifdef MP-WEIXIN
    const db = getDb()!
    const _ = getDbCommand()!
    console.log('[Sync] 启动房间监听, roomId:', this.roomId)
    const roomsCollection = db.collection('rooms')
    // 使用 where 查询监听（doc.watch 不支持）
    this.roomListener = roomsCollection
      .where({ _id: this.roomId })
      .watch({
        onChange: (snapshot: any) => {
          console.log('[Sync] 房间监听 onChange, docs数量:', snapshot.docs?.length)
          if (snapshot.docs && snapshot.docs.length > 0) {
            const room = snapshot.docs[0] as RoomDocument
            const syncStore = useSyncStore()
            syncStore.connectedDevices = room.connectedDevices.length
            console.log('[Sync] 房间状态:', room.status, '连接设备:', room.connectedDevices.length)

            // 对方已加入（connectedDevices >= 2）
            if (room.connectedDevices.length >= 2 && syncStore.status === 'waiting') {
              console.log('[Sync] 对方已加入，切换为 connected')
              syncStore.setConnected(room.roomCode, room._id, true)
              this.startEventStream()
              this.startHeartbeat()
            }
          }
        },
        onError: (err: any) => {
          console.error('[Sync] 房间监听错误:', err)
        }
      })
    console.log('[Sync] 房间监听已创建')
    // #endif
  }

  private stopRoomListener(): void {
    if (this.roomListener) {
      this.roomListener.close()
      this.roomListener = null
    }
  }

  /** 启动心跳 */
  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat()
    }, HEARTBEAT_INTERVAL)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private async sendHeartbeat(): Promise<void> {
    if (!this.roomId) return
    try {
      // #ifdef MP-WEIXIN
      await wx.cloud.callFunction({
        name: 'heartbeat',
        data: { roomId: this.roomId, deviceId: this.deviceId },
        timeout: 10000
      })
      // #endif
    } catch (e) {
      console.error('[Sync] 心跳发送失败:', e)
    }
  }

  /** 处理断线 */
  private handleDisconnect(): void {
    const syncStore = useSyncStore()
    if (syncStore.status === 'connected') {
      syncStore.setDisconnected()
    }
    this.stopEventStream()
    this.attemptReconnect()
  }

  /** 尝试重连 */
  private attemptReconnect(): void {
    if (this.reconnectTimer) return

    const delay = Math.min(
      RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts),
      RECONNECT_MAX_DELAY
    )

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null
      this.reconnectAttempts++

      try {
        // #ifdef MP-WEIXIN
        const res = await wx.cloud.callFunction({
          name: 'joinRoom',
          data: { roomCode: this.roomCode, deviceId: this.deviceId, reconnect: true },
          timeout: 10000
        })
        const result = res.result as any

        if (result.success) {
          // 从快照恢复
          if (result.stateSnapshot) {
            const matchStore = getMatchStore()
            matchStore.loadSnapshot(result.stateSnapshot)
          }
          this.lastProcessedSeq = result.snapshotSeq || this.lastProcessedSeq

          const syncStore = useSyncStore()
          syncStore.setConnected(this.roomCode!, this.roomId!, syncStore.isHost)
          this.startEventStream()
          this.startHeartbeat()
          this.reconnectAttempts = 0
        }
        // #endif
      } catch {
        // 重连失败，继续尝试
        this.attemptReconnect()
      }
    }, delay)
  }

  /** 断开连接 */
  async disconnect(): Promise<void> {
    this.stopEventStream()
    this.stopRoomListener()
    this.stopHeartbeat()

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.roomId) {
      try {
        // #ifdef MP-WEIXIN
        await wx.cloud.callFunction({
          name: 'closeRoom',
          data: { roomId: this.roomId, deviceId: this.deviceId },
          timeout: 10000
        })
        // #endif
      } catch {
        // 忽略断开时的错误
      }
    }

    this.roomId = null
    this.roomCode = null
    this.lastProcessedSeq = 0
    this.reconnectAttempts = 0

    const syncStore = useSyncStore()
    syncStore.reset()
  }

  /** 应用进入后台 - 不停止事件流，比赛需要持续监听 */
  onHide(): void {
    // 只停止心跳（节省资源），事件流保持运行
    this.stopHeartbeat()
  }

  /** 应用回到前台 */
  onShow(): void {
    const syncStore = useSyncStore()
    if (syncStore.status === 'disconnected') {
      this.attemptReconnect()
    } else if (syncStore.status === 'connected') {
      // 恢复心跳
      this.startHeartbeat()
    }
  }
}

export const syncService = new SyncService()
