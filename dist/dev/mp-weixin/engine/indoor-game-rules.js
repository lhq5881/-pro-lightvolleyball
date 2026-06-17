"use strict";
const POINTS_REGULAR = 25;
const POINTS_DECIDING = 15;
const MIN_LEAD = 2;
const PLAYER_COUNT = 6;
const DECIDING_SET_SWAP_POINT = 8;
function getTargetPoints(currentSet, totalSets = 5) {
  const decidingSet = totalSets;
  return currentSet === decidingSet ? POINTS_DECIDING : POINTS_REGULAR;
}
function isSetOver(scoreA, scoreB, currentSet, totalSets = 5) {
  const target = getTargetPoints(currentSet, totalSets);
  if (scoreA >= target && scoreA - scoreB >= MIN_LEAD)
    return true;
  if (scoreB >= target && scoreB - scoreA >= MIN_LEAD)
    return true;
  return false;
}
function needsDecidingSetSwap(currentSet, totalPoints, alreadySwapped, totalSets = 5) {
  return currentSet === totalSets && totalPoints === DECIDING_SET_SWAP_POINT && !alreadySwapped;
}
exports.PLAYER_COUNT = PLAYER_COUNT;
exports.isSetOver = isSetOver;
exports.needsDecidingSetSwap = needsDecidingSetSwap;
