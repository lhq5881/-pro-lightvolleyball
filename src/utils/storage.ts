/** 本地存储封装 */

export function getStorage<T>(key: string): T | null {
  try {
    const value = uni.getStorageSync(key)
    return value ? value as T : null
  } catch {
    return null
  }
}

export function setStorage<T>(key: string, value: T): void {
  try {
    uni.setStorageSync(key, value)
  } catch (e) {
    console.error('Storage set failed:', e)
  }
}

export function removeStorage(key: string): void {
  try {
    uni.removeStorageSync(key)
  } catch (e) {
    console.error('Storage remove failed:', e)
  }
}
