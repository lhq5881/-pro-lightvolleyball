"use strict";
const common_vendor = require("../common/vendor.js");
const useSyncStore = common_vendor.defineStore("sync", () => {
  const status = common_vendor.ref("idle");
  const roomCode = common_vendor.ref(null);
  const roomId = common_vendor.ref(null);
  const isHost = common_vendor.ref(false);
  const connectedDevices = common_vendor.ref(0);
  const lastSyncAt = common_vendor.ref(null);
  const errorMessage = common_vendor.ref(null);
  const pendingAction = common_vendor.ref(false);
  const matchType = common_vendor.ref("qipai");
  function setCreating() {
    status.value = "creating";
    errorMessage.value = null;
  }
  function setWaiting(code, rId) {
    status.value = "waiting";
    roomCode.value = code;
    roomId.value = rId;
    isHost.value = true;
    errorMessage.value = null;
  }
  function setJoining() {
    status.value = "joining";
    errorMessage.value = null;
  }
  function setConnected(code, rId, host) {
    status.value = "connected";
    roomCode.value = code;
    roomId.value = rId;
    isHost.value = host;
    connectedDevices.value = host ? 1 : 2;
    lastSyncAt.value = Date.now();
    errorMessage.value = null;
  }
  function setDisconnected() {
    status.value = "disconnected";
    errorMessage.value = null;
  }
  function setError(msg) {
    status.value = "error";
    errorMessage.value = msg;
  }
  function setMatchType(type) {
    matchType.value = type;
  }
  function reset() {
    status.value = "idle";
    roomCode.value = null;
    roomId.value = null;
    isHost.value = false;
    connectedDevices.value = 0;
    lastSyncAt.value = null;
    errorMessage.value = null;
    pendingAction.value = false;
    matchType.value = "qipai";
  }
  return {
    status,
    roomCode,
    roomId,
    isHost,
    connectedDevices,
    lastSyncAt,
    errorMessage,
    pendingAction,
    matchType,
    setCreating,
    setWaiting,
    setJoining,
    setConnected,
    setDisconnected,
    setError,
    setMatchType,
    reset
  };
});
exports.useSyncStore = useSyncStore;
