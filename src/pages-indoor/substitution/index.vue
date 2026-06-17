<script setup lang="ts">
import { ref, computed } from 'vue'
import { useIndoorMatchStore } from '@/stores/indoor-match'
import { useSettingsStore } from '@/stores/settings'
import { feedbackSubstitution } from '@/utils/feedback'
import type { TeamSide } from '@/engine/indoor-scoring-engine'
import type { Player } from '@/models/match'
import { createPlayer } from '@/models/match'

const indoorMatchStore = useIndoorMatchStore()
const settingsStore = useSettingsStore()

const selectedTeam = ref<TeamSide>('A')
const selectedPosIndex = ref(-1)  // 0-5 对应1-6号位
const subInNumber = ref('')

const teamAName = computed(() => indoorMatchStore.match?.teamA.name ?? '队A')
const teamBName = computed(() => indoorMatchStore.match?.teamB.name ?? '队B')

// 场上队员：带位置信息（6人）
const onCourtPlayers = computed(() => {
  const rotation = indoorMatchStore.getRotation(selectedTeam.value)
  return rotation.map((playerId, index) => ({
    position: index + 1,
    player: indoorMatchStore.getPlayer(playerId)
  }))
})

const canSubstitute = computed(() => {
  if (selectedPosIndex.value < 0 || !subInNumber.value.trim()) return false
  // 检查换上号码是否与场上其他队员号码重复
  const rotation = indoorMatchStore.getRotation(selectedTeam.value)
  const playerOutId = rotation[selectedPosIndex.value]
  const otherNumbers = rotation
    .filter((_, i) => i !== selectedPosIndex.value)
    .map(pid => indoorMatchStore.getPlayer(pid))
    .filter(Boolean)
    .map(p => p!.number)
  if (otherNumbers.includes(subInNumber.value.trim())) return false
  return true
})

// 室内排球位置标签
const positionLabels = ['1号位(发球)', '2号位(前排右)', '3号位(前排中)', '4号位(前排左)', '5号位(后排左)', '6号位(后排中)']

function selectPosition(index: number) {
  selectedPosIndex.value = index
}

function doSubstitute() {
  if (!canSubstitute.value) {
    // 检查具体原因给出提示
    if (selectedPosIndex.value < 0 || !subInNumber.value.trim()) return
    const rotation = indoorMatchStore.getRotation(selectedTeam.value)
    const otherNumbers = rotation
      .filter((_, i) => i !== selectedPosIndex.value)
      .map(pid => indoorMatchStore.getPlayer(pid))
      .filter(Boolean)
      .map(p => p!.number)
    if (otherNumbers.includes(subInNumber.value.trim())) {
      uni.showToast({ title: '号码与场上队员重复', icon: 'none' })
    }
    return
  }

  const rotation = indoorMatchStore.getRotation(selectedTeam.value)
  const playerOutId = rotation[selectedPosIndex.value]
  const playerOut = indoorMatchStore.getPlayer(playerOutId)

  // 优先从替补席查找同号球员（保持ID一致，以便队长标记恢复）
  const bench = indoorMatchStore.getBench(selectedTeam.value)
  const existingPlayer = bench.find(p => p.number === subInNumber.value.trim())
  const playerIn = existingPlayer ?? createPlayer('', subInNumber.value.trim())

  const result = indoorMatchStore.substitute(selectedTeam.value, playerOutId, playerIn.id, playerIn)
  if (result.success) {
    feedbackSubstitution(settingsStore.settings.vibrateEnabled)
    // 原始队长再次上场，自动恢复队长标记
    if (result.originalCaptainRestored) {
      uni.showToast({ title: '原队长已恢复', icon: 'success' })
    } else if (result.captainReplaced) {
      // 队长被换下，弹出选择新队长对话框
      showCaptainSelectDialog(selectedTeam.value)
    } else {
      uni.showToast({ title: '换人成功', icon: 'success' })
    }
    selectedPosIndex.value = -1
    subInNumber.value = ''
  } else {
    uni.showToast({ title: '换人次数已用完', icon: 'none' })
  }
}

/** 显示选择新队长对话框 */
function showCaptainSelectDialog(team: TeamSide) {
  const rotation = indoorMatchStore.getRotation(team)
  const teamName = team === 'A' ? teamAName.value : teamBName.value
  const players = rotation.map(pid => indoorMatchStore.getPlayer(pid)).filter(Boolean) as Player[]
  const items = players.map((p, i) => ({
    name: p.number || p.name || `队员${i + 1}`,
    id: p.id
  }))

  uni.showActionSheet({
    title: '请指定场上队长',
    itemList: items.map(item => item.name),
    success: (res: any) => {
      const selectedId = items[res.tapIndex].id
      // 清除原队长标记，设置新队长
      const teamPlayers = team === 'A' ? indoorMatchStore.match!.teamA.players : indoorMatchStore.match!.teamB.players
      teamPlayers.forEach(p => {
        p.isCaptain = (p.id === selectedId)
      })
      uni.showToast({ title: '新队长已设置', icon: 'success' })
    }
  })
}

function playerDisplay(player: Player | undefined): string {
  if (!player) return '?'
  return player.number ? `${player.number}号` : player.name || '?'
}

function goBackToMatch() {
  uni.navigateBack()
}
</script>

<template>
  <view class="page" v-if="indoorMatchStore.isLive">
    <!-- 队伍选择 -->
    <view class="team-selector">
      <view
        class="team-tab"
        :class="{ active: selectedTeam === 'A', 'team-a-tab': true }"
        @tap="selectedTeam = 'A'; selectedPosIndex = -1; subInNumber = ''"
      >
        <text class="tab-text">{{ teamAName }}</text>
      </view>
      <view
        class="team-tab"
        :class="{ active: selectedTeam === 'B', 'team-b-tab': true }"
        @tap="selectedTeam = 'B'; selectedPosIndex = -1; subInNumber = ''"
      >
        <text class="tab-text">{{ teamBName }}</text>
      </view>
    </view>

    <!-- 场上队员（选择换下） -->
    <view class="card section">
      <text class="section-title">场上队员（换下）</text>
      <view class="player-grid">
        <view
          v-for="item in onCourtPlayers"
          :key="item.position"
          class="player-item"
          :class="{ selected: selectedPosIndex === item.position - 1 }"
          @tap="selectPosition(item.position - 1)"
        >
          <text class="pos-tag">{{ positionLabels[item.position - 1] }}</text>
          <text class="player-text">{{ playerDisplay(item.player) }}</text>
        </view>
      </view>
    </view>

    <!-- 替补队员号码输入 -->
    <view class="card section">
      <text class="section-title">换上队员号码</text>
      <input class="sub-number-input" v-model="subInNumber" placeholder="输入号码" />
    </view>
  </view>

  <!-- 底部固定按钮 -->
  <view v-if="indoorMatchStore.isLive" class="fixed-bottom">
    <view class="sub-btn" :class="{ disabled: !canSubstitute }" @tap="doSubstitute">
      <text class="sub-btn-text">确认换人</text>
    </view>
    <view class="back-btn" @tap="goBackToMatch">
      <text class="back-btn-text">返回比赛</text>
    </view>
  </view>

  <view v-else class="page empty-page">
    <text class="empty-text">暂无进行中的比赛</text>
  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

$indoor-color: #1565c0;
$indoor-team-a: #1565c0;
$indoor-team-b: #f44336;

.page {
  min-height: 100vh;
  padding: $spacing-base;
  padding-bottom: 280rpx;
}

.team-selector {
  display: flex;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
}

.team-tab {
  flex: 1;
  padding: $spacing-sm;
  border: 2rpx solid $border-color;
  border-radius: $border-radius;
  text-align: center;

  &.active.team-a-tab {
    border-color: $indoor-team-a;
    background-color: rgba($indoor-team-a, 0.1);
  }

  &.active.team-b-tab {
    border-color: $indoor-team-b;
    background-color: rgba($indoor-team-b, 0.1);
  }
}

.tab-text {
  font-size: $font-size-base;
  font-weight: bold;
}

.section {
  margin-bottom: $spacing-base;
}

.section-title {
  font-size: $font-size-base;
  font-weight: bold;
  color: $text-color;
  margin-bottom: $spacing-sm;
  display: block;
}

.player-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.player-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-sm $spacing-base;
  border: 2rpx solid $border-color;
  border-radius: $border-radius-sm;
  background-color: $bg-white;
  gap: 4rpx;
  width: calc(50% - $spacing-sm / 2);

  &.selected {
    border-color: $indoor-color;
    background-color: rgba($indoor-color, 0.1);
  }
}

.pos-tag {
  font-size: $font-size-xs;
  color: $indoor-color;
  font-weight: bold;
}

.player-text {
  font-size: $font-size-base;
  color: $text-color;
}

.sub-number-input {
  width: 100%;
  padding: $spacing-sm;
  border: 2rpx solid $border-color;
  border-radius: $border-radius-sm;
  font-size: $font-size-base;
}

.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: $spacing-sm $spacing-base;
  padding-bottom: calc(#{$spacing-sm} + env(safe-area-inset-bottom));
  background-color: $bg-white;
  border-top: 1rpx solid $border-color;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.sub-btn {
  width: 100%;
  padding: $spacing-sm 0;
  background-color: $indoor-color;
  border-radius: $border-radius;
  text-align: center;

  &.disabled {
    background-color: #ccc;
  }
}

.sub-btn-text {
  font-size: $font-size-md;
  color: $text-white;
  font-weight: bold;
}

.back-btn {
  width: 100%;
  padding: $spacing-sm 0;
  border: 2rpx solid $indoor-color;
  border-radius: $border-radius;
  text-align: center;
}

.back-btn-text {
  font-size: $font-size-md;
  color: $indoor-color;
  font-weight: bold;
}

.empty-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-text {
  font-size: $font-size-base;
  color: $text-light;
}
</style>