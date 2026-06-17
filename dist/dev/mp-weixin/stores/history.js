"use strict";
const common_vendor = require("../common/vendor.js");
const utils_storage = require("../utils/storage.js");
const HISTORY_KEY = "match_history";
const useHistoryStore = common_vendor.defineStore("history", () => {
  const matches = common_vendor.ref([]);
  function loadHistory() {
    matches.value = utils_storage.getStorage(HISTORY_KEY) ?? [];
  }
  function addMatch(match) {
    matches.value = matches.value.filter((m) => m.id !== match.id);
    matches.value.unshift(match);
    utils_storage.setStorage(HISTORY_KEY, matches.value);
  }
  function deleteMatch(id) {
    matches.value = matches.value.filter((m) => m.id !== id);
    utils_storage.setStorage(HISTORY_KEY, matches.value);
  }
  function clearAll() {
    matches.value = [];
    utils_storage.setStorage(HISTORY_KEY, []);
  }
  function getMatchById(id) {
    return matches.value.find((m) => m.id === id);
  }
  function getRecentMatches(count = 5) {
    return matches.value.slice(0, count);
  }
  return {
    matches,
    loadHistory,
    addMatch,
    deleteMatch,
    clearAll,
    getMatchById,
    getRecentMatches
  };
});
exports.useHistoryStore = useHistoryStore;
