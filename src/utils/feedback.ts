let scoreAudio: any = null
let setEndAudio: any = null
let timeoutAudio: any = null
let timeoutEndAudio: any = null
let swapAudio: any = null
let matchEndAudio: any = null
let techTimeoutAudio: any = null

function initAudio() {
  // #ifdef MP-WEIXIN
  if (!scoreAudio) {
    scoreAudio = wx.createInnerAudioContext()
    scoreAudio.src = '/static/score-beep.wav'
  }
  if (!setEndAudio) {
    setEndAudio = wx.createInnerAudioContext()
    setEndAudio.src = '/static/set-end-beep.wav'
  }
  if (!timeoutAudio) {
    timeoutAudio = wx.createInnerAudioContext()
    timeoutAudio.src = '/static/audio/timeout.mp3'
  }
  if (!timeoutEndAudio) {
    timeoutEndAudio = wx.createInnerAudioContext()
    timeoutEndAudio.src = '/static/audio/timeout-end.mp3'
  }
  if (!swapAudio) {
    swapAudio = wx.createInnerAudioContext()
    swapAudio.src = '/static/audio/swap.mp3'
  }
  if (!matchEndAudio) {
    matchEndAudio = wx.createInnerAudioContext()
    matchEndAudio.src = '/static/audio/match-end.mp3'
  }
  if (!techTimeoutAudio) {
    techTimeoutAudio = wx.createInnerAudioContext()
    techTimeoutAudio.src = '/static/audio/tech-timeout.mp3'
  }
  // #endif
}

/** 得分反馈 */
export function feedbackScore(soundEnabled: boolean, vibrateEnabled: boolean) {
  if (vibrateEnabled) {
    uni.vibrateShort({ type: 'light' })
  }
  if (soundEnabled) {
    initAudio()
    scoreAudio?.stop()
    scoreAudio?.play()
  }
}

/** 局结束反馈 */
export function feedbackSetEnd(soundEnabled: boolean, vibrateEnabled: boolean) {
  if (vibrateEnabled) {
    uni.vibrateLong({})
  }
  if (soundEnabled) {
    initAudio()
    setEndAudio?.stop()
    setEndAudio?.play()
  }
}

/** 暂停反馈 */
export function feedbackTimeout(vibrateEnabled: boolean) {
  if (vibrateEnabled) {
    uni.vibrateShort({ type: 'medium' })
  }
}

/** 暂停开始语音提示 */
export function playTimeoutSound() {
  // #ifdef MP-WEIXIN
  initAudio()
  timeoutAudio?.stop()
  timeoutAudio?.play()
  // #endif
}

/** 暂停结束语音提示 */
export function playTimeoutEndSound() {
  // #ifdef MP-WEIXIN
  initAudio()
  timeoutEndAudio?.stop()
  timeoutEndAudio?.play()
  // #endif
}

/** 交换场地语音提示 */
export function playSwapCourtSound() {
  // #ifdef MP-WEIXIN
  initAudio()
  swapAudio?.stop()
  swapAudio?.play()
  // #endif
}

/** 比赛结束语音提示 */
export function playMatchEndSound() {
  // #ifdef MP-WEIXIN
  initAudio()
  matchEndAudio?.stop()
  matchEndAudio?.play()
  // #endif
}

/** 技术暂停语音提示 */
export function playTechTimeoutSound() {
  // #ifdef MP-WEIXIN
  initAudio()
  techTimeoutAudio?.stop()
  techTimeoutAudio?.play()
  // #endif
}

/** 换人反馈 */
export function feedbackSubstitution(vibrateEnabled: boolean) {
  if (vibrateEnabled) {
    uni.vibrateShort({ type: 'light' })
  }
}
