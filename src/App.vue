<template>
  <div class="app">
    <h1>Subtitle/Text File Processor</h1>
    <input type="file" @change="handleFileUpload" accept=".srt,.txt, .sub" />
    
    <div v-if="wordFrequencies.length > 0" style="margin-top:20px;">
      <h2>Processed Word Frequencies: {{ wordFrequencies.length }}</h2>
      <ol class="item-list">
        <li v-for="(item, index) in wordFrequencies" :key="index">
          <b>{{ item.word }}</b> <span class="count">{{ item.count }}</span> <span class="cross"> X </span>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const wordFrequencies = ref([])

// Define known phrasal verbs (lowercase); add more as needed
const phrasalVerbs = [
  'look up',
  'turn off',
  'get along',
  'make up',
  'set up',
  'pick up',
  'find out',
  'run into',
  'back up',
  'be carried away',
  'be taken in',
  'blow up',
  'break down',
  'break in',
  'break off',
  'break out',
  'break through',
  'break up',
  'bring out',
  'bring up',
  'build up',
  'burst in',
  'burst out',
  'call in',
  'call off',
  'call on',
  'care for',
  'carry on',
  'catch on',
  'catch up with',
  'check on',
  'check out',
  'clear away',
  'clear up',
  'come across',
  'come along',
  'come down',
  'come down with',
  'come off',
  'come on',
  'come out',
  'come round',
  'come to',
  'come up',
  'come up against',
  'come up with',
  'count on',
  'cross out',
  'cut across',
  'cut down',
  'cut out',
  'deal with',
  'do away with',
  'do up',
  'do without',
  'draw up',
  'face up to',
  'fall for',
  'fall out',
  'fall through',
  'fit in (with)',
  'get across',
  'get at',
  'get away (from)',
  'get away with',
  'get down',
  'get down to',
  'get in',
  'get into',
  'get on with',
  'get out',
  'get out of',
  'get over',
  'get round to',
  'get through',
  'get together',
  'get up',
  'give away',
  'give in',
  'give up',
  'go ahead',
  'go by',
  'go down with',
  'go for',
  'go off',
  'go on',
  'go over',
  'go through',
  'hand over',
  'head for',
  'hold back',
  'hold on',
  'keep away',
  'keep back',
  'keep down',
  'keep off',
  'keep up with',
  'knock down',
  'knock out',
  'knock over',
  'leave out',
  'let down',
  'let off',
  'let out',
  'live for',
  'live on',
  'live up to',
  'live with',
  'lock in',
  'lock out',
  'look at',
  'look back',
  'look forward to',
  'look into',
  'look on',
  'look out',
  'look through',
  'look up to',
  'make for',
  'make into',
  'make out',
  'make up',
  'make up for',
  'miss out on',
  'mix up',
  'mix with',
  'pass around',
  'pass away',
  'pass out',
  'pay off',
  'pick on',
  'pick up',
  'point out',
  'pull down',
  'pull in',
  'pull out',
  'pull over',
  'pull up',
  'put aside',
  'put down',
  'put off',
  'put on',
  'put out',
  'put through',
  'put up',
  'put up with',
  'rub into',
  'rub on',
  'rub out',
  'run away',
  'run down',
  'run into',
  'run on',
  'run out (of)',
  'run over',
  'see off',
  'see through',
  'see to',
  'send off',
  'set back',
  'set off',
  'set out',
  'set up',
  'show off',
  'stand back',
  'stand by',
  'stand for',
  'stand out',
  'stand up',
  'stand up for',
  'stand up to',
  'stay away from',
  'stay on',
  'stay out',
  'stay over',
  'stay up',
  'stick out',
  'stick to',
  'stick together',
  'stick with',
  'stop over',
  'take after',
  'take away',
  'take down',
  'take in',
  'take off',
  'take on',
  'take out',
  'take over',
  'take to',
  'take up',
  'talk into',
  'talk over',
  'think over',
  'think through',
  'throw away',
  'throw out',
  'throw up',
  'try out',
  'turn back',
  'turn down',
  'turn out',
  'turn to',
  'turn over',
  'turn up',
  'watch out',
  'wear off',
  'wear out',
  'work at',
  'work on',
  'work out',
  'write up',
]

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
  // and convert to lowercase
  let cleanedText = text
    .replace(/[^a-zA-Z\s']/g, '')
    .toLowerCase()

  // Split into words by whitespace
  let words = cleanedText.split(/\s+/).filter(w => w.trim() !== '')

  // Reconstruct text from words so we can match multi-word expressions easily
  let reconstructedText = words.join(' ')

  // Handle phrasal verbs:
  // For each known phrasal verb, replace occurrences in the text with a single-token variant
  // (e.g., "look up" -> "lookup", or "look_up" for clarity)
  phrasalVerbs.forEach(pv => {
    // Create a single token version (e.g., 'look up' -> 'look_up')
    const singleToken = pv.replace(/\s+/g, '_')
    const regex = new RegExp(`\\b${pv}\\b`, 'g')
    reconstructedText = reconstructedText.replace(regex, singleToken)
  })

  // Now split again after phrasal replacements
  words = reconstructedText.split(/\s+/).filter(w => w.trim() !== '')

  // @todo: remove knownwords

  // Count frequencies
  const frequencyMap = {}
  for (const w of words) {
    frequencyMap[w] = (frequencyMap[w] || 0) + 1
  }

  // Convert frequency map to an array and sort by frequency (descending)
  const sortedFrequencies = Object.entries(frequencyMap)
    .map(([word, count]) => ({ word: word.replace(/_/g, ' '), count })) // Replace underscores back to spaces in phrasal verbs
    .sort((a, b) => b.count - a.count)

  wordFrequencies.value = sortedFrequencies
}
</script>

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
