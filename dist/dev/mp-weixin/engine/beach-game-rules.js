"use strict";
const POINTS_REGULAR = 21;
const POINTS_DECIDING = 15;
const MIN_LEAD = 2;
const SETS_TO_WIN = 2;
const TOTAL_SETS = 3;
const REGULAR_SWAP_INTERVAL = 7;
const DECIDING_SWAP_INTERVAL = 5;
const TIMEOUTS_PER_SET = 1;
function getTargetPoints(currentSet) {
  return currentSet === TOTAL_SETS ? POINTS_DECIDING : POINTS_REGULAR;
}
function isSetOver(scoreA, scoreB, currentSet) {
  const target = getTargetPoints(currentSet);
  if (scoreA >= target && scoreA - scoreB >= MIN_LEAD)
    return true;
  if (scoreB >= target && scoreB - scoreA >= MIN_LEAD)
    return true;
  return false;
}
function isMatchOver(setsWonA, setsWonB) {
  return setsWonA >= SETS_TO_WIN || setsWonB >= SETS_TO_WIN;
}
function getSwapInterval(currentSet) {
  return currentSet === TOTAL_SETS ? DECIDING_SWAP_INTERVAL : REGULAR_SWAP_INTERVAL;
}
exports.TIMEOUTS_PER_SET = TIMEOUTS_PER_SET;
exports.getSwapInterval = getSwapInterval;
exports.isMatchOver = isMatchOver;
exports.isSetOver = isSetOver;
