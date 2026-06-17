"use strict";
const common_vendor = require("../common/vendor.js");
function getStorage(key) {
  try {
    const value = common_vendor.index.getStorageSync(key);
    return value ? value : null;
  } catch {
    return null;
  }
}
function setStorage(key, value) {
  try {
    common_vendor.index.setStorageSync(key, value);
  } catch (e) {
    console.error("Storage set failed:", e);
  }
}
exports.getStorage = getStorage;
exports.setStorage = setStorage;
