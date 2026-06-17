<script setup lang="ts">
import { computed } from 'vue'
import { useBeachMatchStore } from '@/stores/beach-match'

const beachMatchStore = useBeachMatchStore()

const teamAName = computed(() => beachMatchStore.match?.teamA.name ?? '队A')
const teamBName = computed(() => beachMatchStore.match?.teamB.name ?? '队B')
const setResults = computed(() => beachMatchStore.match?.setScores ?? [])
const winnerName = computed(() => {
  if (!beachMatchStore.match?.winner) return ''
  return beachMatchStore.match.winner === 'A' ? teamAName.value : teamBName.value
})

function handleBack() {
  beachMatchStore.resetMatch()
  uni.reLaunch({ url: '/pages/index/index' })
}
</script>

<template>
  <view class="page">
    <view class="result-card">
      <text class="result-title">比赛结束</text>
      <text class="result-winner">{{ winnerName }} 获胜！</text>
      <text class="result-sets-score">{{ beachMatchStore.setsWonA }} : {{ beachMatchStore.setsWonB }}</text>

      <view class="teams-row">
        <view class="team-col team-a-col">
          <text class="team-name team-a-name">{{ teamAName }}</text>
        </view>
        <view class="vs-col">
          <text class="vs-text">VS</text>
        </view>
        <view class="team-col team-b-col">
          <text class="team-name team-b-name">{{ teamBName }}</text>
        </view>
      </view>

      <view class="set-list">
        <view
          v-for="(s, i) in setResults"
          :key="i"
          class="set-row"
          :class="{ 'a-win': s.winner === 'A', 'b-win': s.winner === 'B' }"
        >
          <text class="set-label">第{{ i + 1 }}局</text>
          <text class="set-score">{{ s.scoreA }} : {{ s.scoreB }}</text>
          <text class="set-winner">{{ s.winner === 'A' ? teamAName : teamBName }}胜</text>
        </view>
      </view>
    </view>

    <view class="back-btn" @tap="handleBack">
      <text class="back-btn-text">返回首页</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

$beach-color: #ff9800;
$beach-team-a: #ff9800;
$beach-team-b: #00bcd4;

.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-lg;
  background-color: $bg-color;
}

.result-card {
  width: 100%;
  background-color: $bg-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.result-title { font-size: $font-size-lg; font-weight: bold; color: $text-color; margin-bottom: $spacing-sm; }
.result-winner { font-size: $font-size-xl; font-weight: bold; color: $beach-color; margin-bottom: $spacing-sm; }
.result-sets-score { font-size: 80rpx; font-weight: bold; color: $text-color; margin-bottom: $spacing-lg; }

.teams-row { display: flex; align-items: center; width: 100%; margin-bottom: $spacing-lg; }
.team-col { flex: 1; display: flex; justify-content: center; }
.team-name { font-size: $font-size-lg; font-weight: bold; }
.team-a-name { color: $beach-team-a; }
.team-b-name { color: $beach-team-b; }
.vs-col { width: 80rpx; display: flex; justify-content: center; }
.vs-text { font-size: $font-size-base; color: $text-light; font-weight: bold; }

.set-list { width: 100%; }

.set-row {
  display: flex;
  align-items: center;
  padding: $spacing-sm $spacing-base;
  border-radius: $border-radius-sm;
  margin-bottom: $spacing-xs;
  background-color: $bg-color;
  &.a-win { background-color: rgba($beach-team-a, 0.1); }
  &.b-win { background-color: rgba($beach-team-b, 0.1); }
}

.set-label { width: 120rpx; font-size: $font-size-sm; color: $text-secondary; font-weight: bold; }
.set-score { flex: 1; font-size: $font-size-base; color: $text-color; font-weight: bold; text-align: center; }
.set-winner { width: 120rpx; font-size: $font-size-sm; text-align: right; }
.a-win .set-winner { color: $beach-team-a; font-weight: bold; }
.b-win .set-winner { color: $beach-team-b; font-weight: bold; }

.back-btn {
  width: 100%;
  margin-top: $spacing-lg;
  padding: $spacing-base $spacing-md;
  background-color: $beach-color;
  border-radius: $border-radius;
  text-align: center;
}

.back-btn-text { font-size: $font-size-md; color: $text-white; font-weight: bold; }
</style>