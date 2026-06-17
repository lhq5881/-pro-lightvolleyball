"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const common_vendor = require("../common/vendor.js");
const stores_sync = require("../stores/sync.js");
const stores_match = require("../stores/match.js");
const stores_indoorMatch = require("../stores/indoor-match.js");
const stores_beachMatch = require("../stores/beach-match.js");
const HEARTBEAT_INTERVAL = 3e4;
const RECONNECT_BASE_DELAY = 2e3;
const RECONNECT_MAX_DELAY = 3e4;
function getDb() {
  return common_vendor.wx$1.cloud.database();
}
function getDbCommand() {
  return common_vendor.wx$1.cloud.database().command;
}
function getMatchStore() {
  const syncStore = stores_sync.useSyncStore();
  const matchType = syncStore.matchType;
  console.log("[Sync] getMatchStore, matchType:", matchType);
  switch (matchType) {
    case "indoor":
      console.log("[Sync] 返回 IndoorMatchStore");
      return stores_indoorMatch.useIndoorMatchStore();
    case "beach":
      return stores_beachMatch.useBeachMatchStore();
    default:
      return stores_match.useMatchStore();
  }
}
class SyncService {
  constructor() {
    __publicField(this, "deviceId", "");
    __publicField(this, "roomId", null);
    __publicField(this, "roomCode", null);
    __publicField(this, "lastProcessedSeq", 0);
    __publicField(this, "eventListener", null);
    __publicField(this, "roomListener", null);
    __publicField(this, "heartbeatTimer", null);
    __publicField(this, "reconnectTimer", null);
    __publicField(this, "reconnectAttempts", 0);
    __publicField(this, "isApplyingRemote", false);
    this.initDeviceId();
  }
  initDeviceId() {
    try {
      let id = common_vendor.index.getStorageSync("sync_device_id");
      if (!id) {
        id = `d_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        common_vendor.index.setStorageSync("sync_device_id", id);
      }
      this.deviceId = id;
    } catch {
      this.deviceId = `d_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
  }
  get syncEnabled() {
    const syncStore = stores_sync.useSyncStore();
    return syncStore.status === "connected" || syncStore.status === "waiting";
  }
  /** 创建房间 */
  async createRoom(matchType = "qipai") {
    const syncStore = stores_sync.useSyncStore();
    syncStore.setCreating();
    syncStore.setMatchType(matchType);
    try {
      console.log("[Sync] 创建房间, deviceId:", this.deviceId, "matchType:", matchType);
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "createRoom",
        data: { deviceId: this.deviceId, matchType },
        timeout: 1e4
      });
      const result = res.result;
      console.log("[Sync] 创建房间结果:", result);
      if (!result.success) {
        const errMsg = result.message || "创建房间失败";
        const err = new Error(errMsg);
        err.code = result.code;
        throw err;
      }
      this.roomId = result.roomId;
      this.roomCode = result.roomCode;
      this.lastProcessedSeq = 0;
      syncStore.setWaiting(result.roomCode, result.roomId);
      this.startRoomListener();
      return result.roomCode;
    } catch (e) {
      console.error("[Sync] 创建房间失败:", e);
      syncStore.setError(e.message || "创建房间失败");
      throw e;
    }
  }
  /** 加入房间 */
  async joinRoom(code, role) {
    const syncStore = stores_sync.useSyncStore();
    syncStore.setJoining();
    try {
      console.log("[Sync] 加入房间, code:", code, "deviceId:", this.deviceId, "role:", role);
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "joinRoom",
        data: { roomCode: code, deviceId: this.deviceId, role: role || "referee2" },
        timeout: 1e4
      });
      const result = res.result;
      console.log("[Sync] 加入房间结果:", result);
      if (!result.success) {
        syncStore.setError(result.message || "加入房间失败");
        return;
      }
      this.roomId = result.roomId;
      this.roomCode = code;
      this.lastProcessedSeq = result.snapshotSeq || 0;
      if (result.matchType) {
        const syncStore2 = stores_sync.useSyncStore();
        syncStore2.setMatchType(result.matchType);
      }
      if (result.stateSnapshot) {
        const matchStore = getMatchStore();
        matchStore.loadSnapshot(result.stateSnapshot);
        console.log("[Sync] 从快照恢复状态完成");
      }
      syncStore.setConnected(code, result.roomId, false);
      this.startEventStream();
      this.startHeartbeat();
      console.log("[Sync] 加入房间成功，事件流已启动");
    } catch (e) {
      console.error("[Sync] 加入房间失败:", e);
      syncStore.setError(e.message || "加入房间失败");
      throw e;
    }
  }
  /** 推送事件 */
  async pushEvent(type, payload) {
    if (!this.roomId || this.isApplyingRemote)
      return;
    const syncStore = stores_sync.useSyncStore();
    syncStore.pendingAction = true;
    try {
      console.log("[Sync] 推送事件:", type, "roomId:", this.roomId);
      await common_vendor.wx$1.cloud.callFunction({
        name: "pushEvent",
        data: {
          roomId: this.roomId,
          type,
          payload,
          deviceId: this.deviceId
        },
        timeout: 1e4
      });
      syncStore.lastSyncAt = Date.now();
      console.log("[Sync] 推送事件成功:", type);
    } catch (e) {
      console.error("[Sync] 推送事件失败:", e);
    } finally {
      syncStore.pendingAction = false;
    }
  }
  /** 启动事件流监听 */
  startEventStream() {
    if (!this.roomId)
      return;
    this.stopEventStream();
    const db = getDb();
    const _ = getDbCommand();
    console.log("[Sync] 启动事件流监听, roomId:", this.roomId, "lastSeq:", this.lastProcessedSeq);
    const eventsCollection = db.collection("events");
    this.eventListener = eventsCollection.where({
      roomId: this.roomId,
      seq: _.gt(this.lastProcessedSeq)
    }).watch({
      onChange: (snapshot) => {
        var _a;
        console.log("[Sync] 事件流 onChange, docs数量:", (_a = snapshot.docs) == null ? void 0 : _a.length, "type:", snapshot.type);
        this.handleEventSnapshot(snapshot);
      },
      onError: (err) => {
        console.error("[Sync] 事件流错误:", err);
        this.handleDisconnect();
      }
    });
    console.log("[Sync] 事件流监听已创建");
  }
  /** 停止事件流监听 */
  stopEventStream() {
    if (this.eventListener) {
      this.eventListener.close();
      this.eventListener = null;
    }
  }
  /** 处理事件快照 */
  handleEventSnapshot(snapshot) {
    var _a, _b, _c;
    if (!snapshot.docs || snapshot.docs.length === 0)
      return;
    const syncStore = stores_sync.useSyncStore();
    const matchStore = getMatchStore();
    const currentSeq = this.lastProcessedSeq;
    const events = snapshot.docs.filter((e) => e.seq > currentSeq && e.deviceId !== this.deviceId).sort((a, b) => a.seq - b.seq);
    const allNewEvents = snapshot.docs.filter((e) => e.seq > currentSeq).sort((a, b) => a.seq - b.seq);
    if (allNewEvents.length > 0) {
      this.lastProcessedSeq = allNewEvents[allNewEvents.length - 1].seq;
    }
    if (events.length === 0)
      return;
    console.log("[Sync] 收到远程事件:", events.length, "条");
    this.isApplyingRemote = true;
    try {
      const stateUpdates = events.filter((e) => e.type === "STATE_UPDATE");
      const startMatches = events.filter((e) => e.type === "START_MATCH");
      for (const event of startMatches) {
        console.log("[Sync] 应用 START_MATCH, seq:", event.seq, "matchStore:", matchStore.$id);
        try {
          matchStore.applyRemoteEvent(event);
        } catch (err) {
          console.error("[Sync] applyRemoteEvent START_MATCH error:", err);
        }
      }
      if (stateUpdates.length > 0) {
        let popupEventInfo = "";
        const hasPopupEvent = stateUpdates.some((e) => {
          const snapshot2 = e.payload.snapshot;
          if (!snapshot2)
            return false;
          if (snapshot2.pendingCourtSwap) {
            popupEventInfo = `pendingCourtSwap at seq ${e.seq}`;
            return true;
          }
          if (snapshot2.pendingTechTimeout) {
            popupEventInfo = `pendingTechTimeout at seq ${e.seq}`;
            return true;
          }
          if (snapshot2.lastTimeout) {
            popupEventInfo = `lastTimeout at seq ${e.seq}`;
            return true;
          }
          return false;
        });
        if (hasPopupEvent) {
          console.log("[Sync] 检测到弹窗事件:", popupEventInfo, "按顺序加载", stateUpdates.length, "个状态");
          for (const event of stateUpdates) {
            console.log("[Sync] 加载快照, seq:", event.seq, "pendingCourtSwap:", !!((_a = event.payload.snapshot) == null ? void 0 : _a.pendingCourtSwap), "pendingTechTimeout:", !!((_b = event.payload.snapshot) == null ? void 0 : _b.pendingTechTimeout), "lastTimeout:", !!((_c = event.payload.snapshot) == null ? void 0 : _c.lastTimeout));
            try {
              matchStore.applyRemoteEvent(event);
            } catch (err) {
              console.error("[Sync] applyRemoteEvent STATE_UPDATE error:", err);
            }
          }
        } else {
          const latest = stateUpdates[stateUpdates.length - 1];
          console.log("[Sync] 加载最新快照, seq:", latest.seq, "matchStore:", matchStore.$id);
          try {
            matchStore.applyRemoteEvent(latest);
          } catch (err) {
            console.error("[Sync] applyRemoteEvent STATE_UPDATE error:", err);
          }
        }
      }
    } finally {
      this.isApplyingRemote = false;
    }
    syncStore.lastSyncAt = Date.now();
  }
  /** 监听房间状态变化（等待对手加入） */
  startRoomListener() {
    if (!this.roomId)
      return;
    this.stopRoomListener();
    const db = getDb();
    getDbCommand();
    console.log("[Sync] 启动房间监听, roomId:", this.roomId);
    const roomsCollection = db.collection("rooms");
    this.roomListener = roomsCollection.where({ _id: this.roomId }).watch({
      onChange: (snapshot) => {
        var _a;
        console.log("[Sync] 房间监听 onChange, docs数量:", (_a = snapshot.docs) == null ? void 0 : _a.length);
        if (snapshot.docs && snapshot.docs.length > 0) {
          const room = snapshot.docs[0];
          const syncStore = stores_sync.useSyncStore();
          syncStore.connectedDevices = room.connectedDevices.length;
          console.log("[Sync] 房间状态:", room.status, "连接设备:", room.connectedDevices.length);
          if (room.connectedDevices.length >= 2 && syncStore.status === "waiting") {
            console.log("[Sync] 对方已加入，切换为 connected");
            syncStore.setConnected(room.roomCode, room._id, true);
            this.startEventStream();
            this.startHeartbeat();
          }
        }
      },
      onError: (err) => {
        console.error("[Sync] 房间监听错误:", err);
      }
    });
    console.log("[Sync] 房间监听已创建");
  }
  stopRoomListener() {
    if (this.roomListener) {
      this.roomListener.close();
      this.roomListener = null;
    }
  }
  /** 启动心跳 */
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, HEARTBEAT_INTERVAL);
  }
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  async sendHeartbeat() {
    if (!this.roomId)
      return;
    try {
      await common_vendor.wx$1.cloud.callFunction({
        name: "heartbeat",
        data: { roomId: this.roomId, deviceId: this.deviceId },
        timeout: 1e4
      });
    } catch (e) {
      console.error("[Sync] 心跳发送失败:", e);
    }
  }
  /** 处理断线 */
  handleDisconnect() {
    const syncStore = stores_sync.useSyncStore();
    if (syncStore.status === "connected") {
      syncStore.setDisconnected();
    }
    this.stopEventStream();
    this.attemptReconnect();
  }
  /** 尝试重连 */
  attemptReconnect() {
    if (this.reconnectTimer)
      return;
    const delay = Math.min(
      RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts),
      RECONNECT_MAX_DELAY
    );
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      try {
        const res = await common_vendor.wx$1.cloud.callFunction({
          name: "joinRoom",
          data: { roomCode: this.roomCode, deviceId: this.deviceId, reconnect: true },
          timeout: 1e4
        });
        const result = res.result;
        if (result.success) {
          if (result.stateSnapshot) {
            const matchStore = getMatchStore();
            matchStore.loadSnapshot(result.stateSnapshot);
          }
          this.lastProcessedSeq = result.snapshotSeq || this.lastProcessedSeq;
          const syncStore = stores_sync.useSyncStore();
          syncStore.setConnected(this.roomCode, this.roomId, syncStore.isHost);
          this.startEventStream();
          this.startHeartbeat();
          this.reconnectAttempts = 0;
        }
      } catch {
        this.attemptReconnect();
      }
    }, delay);
  }
  /** 断开连接 */
  async disconnect() {
    this.stopEventStream();
    this.stopRoomListener();
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.roomId) {
      try {
        await common_vendor.wx$1.cloud.callFunction({
          name: "closeRoom",
          data: { roomId: this.roomId, deviceId: this.deviceId },
          timeout: 1e4
        });
      } catch {
      }
    }
    this.roomId = null;
    this.roomCode = null;
    this.lastProcessedSeq = 0;
    this.reconnectAttempts = 0;
    const syncStore = stores_sync.useSyncStore();
    syncStore.reset();
  }
  /** 应用进入后台 - 不停止事件流，比赛需要持续监听 */
  onHide() {
    this.stopHeartbeat();
  }
  /** 应用回到前台 */
  onShow() {
    const syncStore = stores_sync.useSyncStore();
    if (syncStore.status === "disconnected") {
      this.attemptReconnect();
    } else if (syncStore.status === "connected") {
      this.startHeartbeat();
    }
  }
}
const syncService = new SyncService();
exports.syncService = syncService;
