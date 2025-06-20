<template>
  <div class="word-player border border-dashed border-gray-50 mt-4 mb-8 p-4">
    <div class="display justify-center text-2xl mb-2">
      <div class="timer font-bold mr-2">{{ displayTime }}</div>
      <div class="word uppercase p-4 text-3x1 font-extrabold text-8xl">{{ currentWord }}</div>
    </div>
    <div class="controls items-center justify-center gap-2">
      <template v-if="!isPlaying">
        <input
          type="number"
          v-model.number="hours"
          min="0"
          class="w-12 text-center border rounded bg-transparent"
        />
        :
        <input
          type="number"
          v-model.number="minutes"
          min="0"
          max="59"
          class="w-12 text-center border rounded bg-transparent"
        />
        :
        <input
          type="number"
          v-model.number="seconds"
          min="0"
          max="59"
          class="w-12 text-center border rounded bg-transparent"
        />
      </template>
      <button
        @click="isPlaying ? stop() : start()"
        class="ml-2 px-4 py-1 rounded bg-blue-600 hover:bg-blue-700"
      >
        {{ isPlaying ? 'Stop' : 'Play' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  words: {
    type: Array,
    default: () => []
  }
})

const hours = ref(0)
const minutes = ref(1)
const seconds = ref(0)

const totalSeconds = ref(0)
let timer = null
let elapsed = 0

const currentWord = ref('')
let shuffled = []
let index = 0

const isPlaying = ref(false)

const displayTime = computed(() => {
  const h = isPlaying.value
    ? Math.floor(totalSeconds.value / 3600)
    : hours.value
  const m = isPlaying.value
    ? Math.floor((totalSeconds.value % 3600) / 60)
    : minutes.value
  const s = isPlaying.value
    ? totalSeconds.value % 60
    : seconds.value
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
})

function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function start() {
  const initial = hours.value * 3600 + minutes.value * 60 + seconds.value
  if (initial <= 0) return
  totalSeconds.value = initial
  isPlaying.value = true
  shuffled = shuffle(props.words)
  index = 0
  elapsed = 0
  currentWord.value = shuffled[index] || ''

  timer = setInterval(() => {
    if (totalSeconds.value > 0) {
      totalSeconds.value--
      elapsed++
      if (elapsed % 5 === 0 && shuffled.length > 0) {
        index++
        if (index >= shuffled.length) {
          shuffled = shuffle(props.words)
          index = 0
        }
        currentWord.value = shuffled[index]
      }
    } else {
      stop()
    }
  }, 1000)
}

function stop() {
  clearInterval(timer)
  timer = null
  isPlaying.value = false
  hours.value = Math.floor(totalSeconds.value / 3600)
  minutes.value = Math.floor((totalSeconds.value % 3600) / 60)
  seconds.value = totalSeconds.value % 60
}
</script>

