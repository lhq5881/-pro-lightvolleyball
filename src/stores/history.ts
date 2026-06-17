import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Match } from '@/models/match'
import { getStorage, setStorage } from '@/utils/storage'

const HISTORY_KEY = 'match_history'

export const useHistoryStore = defineStore('history', () => {
  const matches = ref<Match[]>([])

  /** 从本地存储加载 */
  function loadHistory() {
    matches.value = getStorage<Match[]>(HISTORY_KEY) ?? []
  }

  /** 保存比赛记录 */
  function addMatch(match: Match) {
    // 移除同ID的旧记录
    matches.value = matches.value.filter(m => m.id !== match.id)
    matches.value.unshift(match)
    setStorage(HISTORY_KEY, matches.value)
  }

  /** 删除比赛记录 */
  function deleteMatch(id: string) {
    matches.value = matches.value.filter(m => m.id !== id)
    setStorage(HISTORY_KEY, matches.value)
  }

  /** 清空所有比赛记录 */
  function clearAll() {
    matches.value = []
    setStorage(HISTORY_KEY, [])
  }

  /** 获取比赛详情 */
  function getMatchById(id: string): Match | undefined {
    return matches.value.find(m => m.id === id)
  }

  /** 获取最近N条记录 */
  function getRecentMatches(count: number = 5): Match[] {
    return matches.value.slice(0, count)
  }

  return {
    matches,
    loadHistory,
    addMatch,
    deleteMatch,
    clearAll,
    getMatchById,
    getRecentMatches
  }
})
