<template>
  <div class="app max-w-3xl mx-auto p-4 text-center">
    <h1 class="text-4xl font-bold mb-2">Vocabulary Analyzer</h1>
    <div class="mb-4 text-gray-300">File processor to analyze words displayed on documents so you can learn them.</div>
    <WordPlayer :words="knownWords" />
    <div class="import my-4 border border-dashed border-gray-600 p-4 bg-gray-800">
      Import Text: <br />
      <input type="file" @change="handleFileUpload" accept=".srt,.txt,.sub,.md" />
    </div>

    <div v-if="wordFrequencies.length > 0" class="mt-5">
      <h2 class="text-2xl font-semibold">Words:  {{ wordFrequencies.length }}</h2>
      <div class="text-sm text-gray-400 mb-2">Click them to mark them as known words</div>
      <ol class="item-list">
        <li v-for="item in wordFrequencies" :key="item.word" @click="addKnownWord(item.word)">
          <b>{{ item.word.toUpperCase() }}</b> <span class="count">{{ item.count }}</span>
        </li>
      </ol>
    </div>

    <div v-if="knownWords.length > 0" class="mt-5">
      <h2 class="text-2xl font-semibold">Known Words: {{ knownWords.length }}</h2>
      <div class="text-sm text-gray-400 mb-2">Click them to forget them</div>
      <ul class="item-list">
        <li v-for="word in knownWords" :key="word" @click="removeKnownWord(word)">
          {{ word.toUpperCase() }}
        </li>
      </ul>
    </div>
    <div>
      <h3 class="text-xl font-semibold mt-6">Manage Known Words</h3>
      <div class="import my-4 border border-dashed border-gray-600 p-4 bg-gray-800">
        Import Words: <br />
        <input type="file" @change="importKnownWords" accept=".json" />
      </div>
      <button @click="exportKnownWords" class="bg-green-600 hover:bg-green-700 px-4 py-1 rounded">Export Known Words</button>
      <button @click="clearKnownWords" class="alert bg-red-600 hover:bg-red-700 px-4 py-1 rounded">Forget them ALL!</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import WordPlayer from './components/WordPlayer.vue'
import phrasalVerbs from './data/phrasalVerbs.json'
import defaultKnownWords from './data/defaultKnownWords.json'

const wordFrequencies = ref([])
const knownWords = ref([])

onMounted(() => {
  loadKnownWords()
})

function loadKnownWords() {
  const stored = localStorage.getItem('knownWords')
  if (stored) {
    knownWords.value = JSON.parse(stored)
  } else {
    knownWords.value = [...defaultKnownWords]
    saveKnownWords()
  }
}

function saveKnownWords() {
  localStorage.setItem('knownWords', JSON.stringify(knownWords.value))
}

function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const rawText = e.target.result
    processText(rawText)
  }
  
  reader.onerror = (e) => {
    console.error('Error reading file:', e)
  }
  
  reader.readAsText(file)

  // Reset the input so selecting the same file again triggers change
  event.target.value = ''
}

function processText(text) {
  // Remove non-alphabetic characters (except spaces)
  // and convert to lowercase (matching is case-insensitive)
  let cleanedText = text
    .replace(/[^a-zA-Z\s']/g, ' ')
    .toUpperCase()

  // Handle phrasal verbs:
  phrasalVerbs.forEach(pv => {
    const singleToken = pv.replace(/\s+/g, '_')
    const regex = new RegExp(`\\b${pv}\\b`, 'g')
    cleanedText = cleanedText.replace(regex, singleToken)
  })

  // Split into words by whitespace
  let words = cleanedText.split(/\s+/).filter(w => w.trim() !== '')

  // Remove one letter words:
  words = words.filter(w => w.length > 1)

  // Count frequencies
  const frequencyMap = {}
  for (const w of words) {
    frequencyMap[w] = (frequencyMap[w] || 0) + 1
  }

  let sortedFrequencies = Object.entries(frequencyMap)
    .map(([word, count]) => ({ word: word.replace(/_/g, ' '), count }))
    .sort((a, b) => b.count - a.count)

  // Filter out known words
  sortedFrequencies = sortedFrequencies.filter(item => !knownWords.value.includes(item.word))

  wordFrequencies.value = sortedFrequencies
}

function addKnownWord(word) {
  if (!knownWords.value.includes(word)) {
    knownWords.value.push(word)
    saveKnownWords()
    // Remove from wordFrequencies
    wordFrequencies.value = wordFrequencies.value.filter(item => item.word !== word)
  }
}

function removeKnownWord(word) {
  if (knownWords.value.includes(word)) {
    knownWords.value.splice(knownWords.value.indexOf(word), 1)
    saveKnownWords()
  }
}

function clearKnownWords() {
  knownWords.value = []
  saveKnownWords()
}

function exportKnownWords() {
  const data = JSON.stringify(knownWords.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  const fileName = `knownWords-${year}${month}${day}-${hour}${minute}${seconds}.json`

  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

function importKnownWords(event) {
  const file = event.target.files ? event.target.files[0] : null
  if (!file) {
    return
  }
  const reader = new FileReader()
  reader.onload = (readerEvent) => {
    try {
      const textResult = readerEvent.target.result
      const importedWords = JSON.parse(textResult)
      console.log('Imported Words:', importedWords)

      if (Array.isArray(importedWords)) {
        const normalizedImportedWords = importedWords.map(word => word.toUpperCase())
        const set = new Set([...knownWords.value, ...normalizedImportedWords])
        knownWords.value = Array.from(set)
        saveKnownWords()

        // Update wordFrequencies after merging known words
        wordFrequencies.value = wordFrequencies.value.filter(
          item => !knownWords.value.includes(item.word.toUpperCase())
        )
      } else {
        console.error('Imported file does not contain an array of words.')
      }
    } catch (error) {
      console.error('Error parsing JSON:', error)
    }
  }

  reader.onerror = (e) => {
    console.error('Error reading file:', e)
  }

  // Start reading the file as text
  reader.readAsText(file)

  // Reset the input so selecting the same file again triggers change
  event.target.value = ''
}

</script>
