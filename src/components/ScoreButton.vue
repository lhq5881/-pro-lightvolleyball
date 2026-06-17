<script setup lang="ts">
import type { TeamSide } from '@/engine/scoring-engine'

const props = defineProps<{
  side: TeamSide
  label: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  score: [side: TeamSide]
}>()

function handleTap() {
  if (props.disabled) return
  emit('score', props.side)
}
</script>

<template>
  <view
    class="score-btn"
    :class="['score-btn-' + side.toLowerCase(), { disabled }]"
    hover-class="score-btn-hover"
    @tap="handleTap"
  >
    <text class="score-btn-text">+1</text>
    <text class="score-btn-label">{{ label }}</text>
  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.score-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200rpx;
  border-radius: $border-radius;
  transition: opacity 0.15s;

  &-a {
    background-color: $team-a-color;
  }

  &-b {
    background-color: $team-b-color;
  }

  &-hover {
    opacity: 0.8;
  }

  &.disabled {
    opacity: 0.4;
  }
}

.score-btn-text {
  font-size: $font-size-xl;
  color: $text-white;
  font-weight: bold;
}

.score-btn-label {
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.8);
  margin-top: $spacing-xs;
}
</style>
