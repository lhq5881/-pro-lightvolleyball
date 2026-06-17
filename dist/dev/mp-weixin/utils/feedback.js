"use strict";
const common_vendor = require("../common/vendor.js");
let scoreAudio = null;
let setEndAudio = null;
let timeoutAudio = null;
let timeoutEndAudio = null;
let swapAudio = null;
let matchEndAudio = null;
let techTimeoutAudio = null;
function initAudio() {
  if (!scoreAudio) {
    scoreAudio = common_vendor.wx$1.createInnerAudioContext();
    scoreAudio.src = "/static/score-beep.wav";
  }
  if (!setEndAudio) {
    setEndAudio = common_vendor.wx$1.createInnerAudioContext();
    setEndAudio.src = "/static/set-end-beep.wav";
  }
  if (!timeoutAudio) {
    timeoutAudio = common_vendor.wx$1.createInnerAudioContext();
    timeoutAudio.src = "/static/audio/timeout.mp3";
  }
  if (!timeoutEndAudio) {
    timeoutEndAudio = common_vendor.wx$1.createInnerAudioContext();
    timeoutEndAudio.src = "/static/audio/timeout-end.mp3";
  }
  if (!swapAudio) {
    swapAudio = common_vendor.wx$1.createInnerAudioContext();
    swapAudio.src = "/static/audio/swap.mp3";
  }
  if (!matchEndAudio) {
    matchEndAudio = common_vendor.wx$1.createInnerAudioContext();
    matchEndAudio.src = "/static/audio/match-end.mp3";
  }
  if (!techTimeoutAudio) {
    techTimeoutAudio = common_vendor.wx$1.createInnerAudioContext();
    techTimeoutAudio.src = "/static/audio/tech-timeout.mp3";
  }
}
function feedbackScore(soundEnabled, vibrateEnabled) {
  if (vibrateEnabled) {
    common_vendor.index.vibrateShort({ type: "light" });
  }
  if (soundEnabled) {
    initAudio();
    scoreAudio == null ? void 0 : scoreAudio.stop();
    scoreAudio == null ? void 0 : scoreAudio.play();
  }
}
function feedbackSetEnd(soundEnabled, vibrateEnabled) {
  if (vibrateEnabled) {
    common_vendor.index.vibrateLong({});
  }
  if (soundEnabled) {
    initAudio();
    setEndAudio == null ? void 0 : setEndAudio.stop();
    setEndAudio == null ? void 0 : setEndAudio.play();
  }
}
function feedbackTimeout(vibrateEnabled) {
  if (vibrateEnabled) {
    common_vendor.index.vibrateShort({ type: "medium" });
  }
}
function playTimeoutSound() {
  initAudio();
  timeoutAudio == null ? void 0 : timeoutAudio.stop();
  timeoutAudio == null ? void 0 : timeoutAudio.play();
}
function playTimeoutEndSound() {
  initAudio();
  timeoutEndAudio == null ? void 0 : timeoutEndAudio.stop();
  timeoutEndAudio == null ? void 0 : timeoutEndAudio.play();
}
function playSwapCourtSound() {
  initAudio();
  swapAudio == null ? void 0 : swapAudio.stop();
  swapAudio == null ? void 0 : swapAudio.play();
}
function playMatchEndSound() {
  initAudio();
  matchEndAudio == null ? void 0 : matchEndAudio.stop();
  matchEndAudio == null ? void 0 : matchEndAudio.play();
}
function playTechTimeoutSound() {
  initAudio();
  techTimeoutAudio == null ? void 0 : techTimeoutAudio.stop();
  techTimeoutAudio == null ? void 0 : techTimeoutAudio.play();
}
function feedbackSubstitution(vibrateEnabled) {
  if (vibrateEnabled) {
    common_vendor.index.vibrateShort({ type: "light" });
  }
}
exports.feedbackScore = feedbackScore;
exports.feedbackSetEnd = feedbackSetEnd;
exports.feedbackSubstitution = feedbackSubstitution;
exports.feedbackTimeout = feedbackTimeout;
exports.playMatchEndSound = playMatchEndSound;
exports.playSwapCourtSound = playSwapCourtSound;
exports.playTechTimeoutSound = playTechTimeoutSound;
exports.playTimeoutEndSound = playTimeoutEndSound;
exports.playTimeoutSound = playTimeoutSound;
