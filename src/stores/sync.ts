import { defineStore } from 'pinia'
import { ref } from 'vue'

export type SyncStatus = 'idle' | 'creating' | 'joining' | 'waiting' | 'connected' | 'disconnected' | 'error'
export type VolleyballType = 'qipai' | 'indoor' | 'beach'

export const useSyncStore = defineStore('sync', () => {
  const status = ref<SyncStatus>('idle')
  const roomCode = ref<string | null>(null)
  const roomId = ref<string | null>(null)
  const isHost = ref(false)
  const connectedDevices = ref(0)
  const lastSyncAt = ref<number | null>(null)
  const errorMessage = ref<string | null>(null)
  const pendingAction = ref(false)
  const matchType = ref<VolleyballType>('qipai')

  function setCreating() {
    status.value = 'creating'
    errorMessage.value = null
  }

  function setWaiting(code: string, rId: string) {
    status.value = 'waiting'
    roomCode.value = code
    roomId.value = rId
    isHost.value = true
    errorMessage.value = null
  }

  function setJoining() {
    status.value = 'joining'
    errorMessage.value = null
  }

  function setConnected(code: string, rId: string, host: boolean) {
    status.value = 'connected'
    roomCode.value = code
    roomId.value = rId
    isHost.value = host
    connectedDevices.value = host ? 1 : 2
    lastSyncAt.value = Date.now()
    errorMessage.value = null
  }

  function setDisconnected() {
    status.value = 'disconnected'
    errorMessage.value = null
  }

  function setError(msg: string) {
    status.value = 'error'
    errorMessage.value = msg
  }

  function setMatchType(type: VolleyballType) {
    matchType.value = type
  }

  function reset() {
    status.value = 'idle'
    roomCode.value = null
    roomId.value = null
    isHost.value = false
    connectedDevices.value = 0
    lastSyncAt.value = null
    errorMessage.value = null
    pendingAction.value = false
    matchType.value = 'qipai'
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
  }
})
