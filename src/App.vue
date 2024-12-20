<template>
  <div class="app">
    <h1>Subtitle/Text File Processor with Known Words</h1>
    <input type="file" @change="handleFileUpload" accept=".srt,.txt,.sub" />

    <div v-if="wordFrequencies.length > 0" style="margin-top:20px;">
      <h2>Words:  {{ wordFrequencies.length }}</h2>
      <div>Click them to mark them as known words</div>
      <ol class="item-list">
        <li v-for="(item, index) in wordFrequencies" :key="index" @click="addKnownWord(item.word)">
          {{ item.word }} - {{ item.count }}
        </li>
      </ol>
    </div>

    <div v-if="knownWords.length > 0" style="margin-top:20px;">
      <h2>Known Words</h2>
      <ul class="item-list">
        <li v-for="(word, index) in knownWords" :key="index" @click="removeKnownWord(word)">
          {{ word }}
        </li>
      </ul>
    </div>

    <div>
      <h3>Manage Known Words</h3>
      <div>Click them to forget them</div>
      <button @click="exportKnownWords">Export Known Words</button>
      <input type="file" @change="importKnownWords" accept=".json" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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
}

function processText(text) {
  // Remove non-alphabetic characters (except spaces)
  // and convert to lowercase (matching is case-insensitive)
  let cleanedText = text
    .replace(/[^a-zA-Z\s']/g, ' ')
    .toLowerCase()

  // Split into words by whitespace
  let words = cleanedText.split(/\s+/).filter(w => w.trim() !== '')

  // Reconstruct text from words
  let reconstructedText = words.join(' ')

  // Handle phrasal verbs:
  phrasalVerbs.forEach(pv => {
    const singleToken = pv.replace(/\s+/g, '_')
    const regex = new RegExp(`\\b${pv}\\b`, 'g')
    reconstructedText = reconstructedText.replace(regex, singleToken)
  })

  // Split again after phrasal replacements
  words = reconstructedText.split(/\s+/).filter(w => w.trim() !== '')

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

function exportKnownWords() {
  const data = JSON.stringify(knownWords.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = 'knownWords.json'
  a.click()
  URL.revokeObjectURL(url)
}

function importKnownWords(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const importedWords = JSON.parse(e.target.result)
      if (Array.isArray(importedWords)) {
        // Merge unique words
        const set = new Set([...knownWords.value, ...importedWords])
        knownWords.value = Array.from(set)
        saveKnownWords()
        // After updating known words, re-filter the existing wordFrequencies
        wordFrequencies.value = wordFrequencies.value.filter(item => !knownWords.value.includes(item.word))
      } else {
        console.error('Imported file does not contain an array of words.')
      }
    } catch (error) {
      console.error('Invalid JSON:', error)
    }
  }

  reader.onerror = (e) => {
    console.error('Error reading file:', e)
  }

  reader.readAsText(file)
}
</script>

<style>
.app {
  font-family: Arial, sans-serif;
  padding: 20px;
}
li {
  cursor: pointer;
}
li:hover {
  background: #f0f0f0;
  color:#444;
}
</style>


<style>
  .app {
    font-family: Arial, sans-serif;
    padding: 20px;
  }
  .item-list {
    list-style-type: none;
    padding: 0;
  }
  .item-list li {
    border: 1px solid #444;
    padding: 1em 2em;
    margin-bottom: 5px;
    text-align: left;
  }
  .item-list li .cross {
    float: right;
    font-weight: bold;
    background: gray;
    width: 40px;
    line-height: 40px;
    text-align: center;
    border-radius: 50%;
    margin-top: -0.5em;
    cursor: pointer;
  }
</style>
