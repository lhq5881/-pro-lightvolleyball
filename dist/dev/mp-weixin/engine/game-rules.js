"use strict";
const POINTS_REGULAR = 21;
const POINTS_DECIDING = 15;
const DEFAULT_CAP_REGULAR = 25;
const DEFAULT_CAP_DECIDING = 17;
const MIN_LEAD = 2;
const SETS_TO_WIN = 2;
const TOTAL_SETS = 3;
const PLAYER_COUNT = 5;
function getTargetPoints(currentSet) {
  return currentSet === TOTAL_SETS ? POINTS_DECIDING : POINTS_REGULAR;
}
function isSetOver(scoreA, scoreB, currentSet, cap) {
  const target = getTargetPoints(currentSet);
  const capPoints = cap ?? (currentSet === TOTAL_SETS ? DEFAULT_CAP_DECIDING : DEFAULT_CAP_REGULAR);
  if (scoreA >= capPoints || scoreB >= capPoints)
    return true;
  if (scoreA >= target && scoreA - scoreB >= MIN_LEAD)
    return true;
  if (scoreB >= target && scoreB - scoreA >= MIN_LEAD)
    return true;
  return false;
}
function isMatchOver(setsWonA, setsWonB) {
  return setsWonA >= SETS_TO_WIN || setsWonB >= SETS_TO_WIN;
}
exports.DEFAULT_CAP_DECIDING = DEFAULT_CAP_DECIDING;
exports.DEFAULT_CAP_REGULAR = DEFAULT_CAP_REGULAR;
exports.PLAYER_COUNT = PLAYER_COUNT;
exports.isMatchOver = isMatchOver;
exports.isSetOver = isSetOver;
