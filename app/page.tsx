"use client";

import { useState, useEffect, useRef } from 'react';
import WordPlayer from '../components/WordPlayer';
import phrasalVerbsRaw from '../data/phrasalVerbs.json';
import defaultKnownWordsRaw from '../data/defaultKnownWords.json';

// Type assertion for imported JSONs if necessary, but usually standard import works
const phrasalVerbs: string[] = phrasalVerbsRaw as string[];
const defaultKnownWords: string[] = defaultKnownWordsRaw as string[];

interface WordFrequency {
  word: string;
  count: number;
}

export default function Home() {
  const [wordFrequencies, setWordFrequencies] = useState<WordFrequency[]>([]);
  const [knownWords, setKnownWords] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadKnownWords();
  }, []);

  function loadKnownWords() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('knownWords');
      if (stored) {
        try {
          setKnownWords(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse knownWords", e);
          setKnownWords([]);
        }
      } else {
        setKnownWords([...defaultKnownWords]);
        // saveKnownWords() not strictly needed here as we can just set state, 
        // but to sync local storage immediately:
        localStorage.setItem('knownWords', JSON.stringify(defaultKnownWords));
      }
    }
  }

  function saveKnownWords(updatedWords: string[]) {
    localStorage.setItem('knownWords', JSON.stringify(updatedWords));
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawText = e.target?.result as string;
      if (rawText) processText(rawText);
    };

    reader.onerror = (e) => {
      console.error('Error reading file:', e);
    };

    reader.readAsText(file);

    // Reset input
    if (event.target) event.target.value = '';
  }

  function processText(text: string) {
    let cleanedText = text
      .replace(/[^a-zA-Z\s']/g, ' ')
      .toUpperCase();

    // Handle phrasal verbs
    phrasalVerbs.forEach(pv => {
      const singleToken = pv.replace(/\s+/g, '_');
      // Escape for regex if needed, but phrasal verbs usually plain text
      const regex = new RegExp(`\\b${pv}\\b`, 'g');
      cleanedText = cleanedText.replace(regex, singleToken);
    });

    let words = cleanedText.split(/\s+/).filter(w => w.trim() !== '');
    words = words.filter(w => w.length > 1);

    const frequencyMap: Record<string, number> = {};
    for (const w of words) {
      frequencyMap[w] = (frequencyMap[w] || 0) + 1;
    }

    let sortedFrequencies = Object.entries(frequencyMap)
      .map(([word, count]) => ({ word: word.replace(/_/g, ' '), count }))
      .sort((a, b) => b.count - a.count);

    // Filter out known words
    sortedFrequencies = sortedFrequencies.filter(item => !knownWords.includes(item.word));

    setWordFrequencies(sortedFrequencies);
  }

  function addKnownWord(word: string) {
    if (!knownWords.includes(word)) {
      const updated = [...knownWords, word];
      setKnownWords(updated);
      saveKnownWords(updated);
      setWordFrequencies(prev => prev.filter(item => item.word !== word));
    }
  }

  function removeKnownWord(word: string) {
    if (knownWords.includes(word)) {
      const updated = knownWords.filter(w => w !== word);
      setKnownWords(updated);
      saveKnownWords(updated);
    }
  }

  function clearKnownWords() {
    setKnownWords([]);
    saveKnownWords([]);
  }

  function exportKnownWords() {
    const data = JSON.stringify(knownWords, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const fileName = `knownWords-${year}${month}${day}-${hour}${minute}${seconds}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importKnownWords(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      try {
        const textResult = readerEvent.target?.result as string;
        const importedWords = JSON.parse(textResult);
        console.log('Imported Words:', importedWords);

        if (Array.isArray(importedWords)) {
          const normalizedImportedWords = importedWords.map((word: unknown) => String(word).toUpperCase());
          const set = new Set([...knownWords, ...normalizedImportedWords]);
          const updated = Array.from(set);
          setKnownWords(updated);
          saveKnownWords(updated);

          // Update frequencies
          setWordFrequencies(prev => prev.filter(
            item => !updated.includes(item.word.toUpperCase())
          ));
        } else {
          console.error('Imported file does not contain an array of words.');
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    };

    reader.onerror = (e) => {
      console.error('Error reading file:', e);
    };

    reader.readAsText(file);

    if (event.target) event.target.value = '';
  }

  return (
    <div className="app max-w-6xl mx-auto p-4 text-center min-h-screen text-gray-800">
      <h1 className="text-4xl font-bold mb-2">Vocabulary Analyzer</h1>
      <div className="mb-4 text-black">Online <strong>file processor</strong> to extract words from documents, so you can learn them.</div>

      <WordPlayer words={knownWords} />

      <div className="import flex my-4 border border-dashed border-gray-600 p-4 bg-gray-100 items-center justify-center">
        <div className="flex m-2 leading-none font-bold">Import Text:</div>
        <div className="flex m-2 leading-none">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".srt,.txt,.sub,.md"
          />
        </div>
      </div>

      {wordFrequencies.length > 0 && (
        <div className="mt-5">
          <h2 className="text-2xl font-semibold">Words: {wordFrequencies.length}</h2>
          <div className="text-sm text-gray-400 mb-2">Click them to mark them as known words</div>
          <ol className="flex items-start flex-wrap mt-4 justify-center">
            {wordFrequencies.map((item) => (
              <li
                key={item.word}
                onClick={() => addKnownWord(item.word)}
                className="mx-1 p-2 px-3 border-purple-800 mb-4 rounded font-medium hover:bg-transparent hover:border-purple-800 border bg-purple-400/25 text-purple-800 cursor-pointer transition-colors"
                role="button"
              >
                <b>{item.word.toUpperCase()}</b> <span className="count text-xs ml-1">{item.count}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {knownWords.length > 0 && (
        <div className="mt-5">
          <h2 className="text-2xl font-semibold">Known Words: {knownWords.length}</h2>
          <div className="text-sm text-gray-400 mb-2">Click on each one to remove them</div>
          <ul className="flex flex-wrap mt-4 justify-center">
            {knownWords.map((word) => (
              <li
                key={word}
                onClick={() => removeKnownWord(word)}
                className="mx-1 p-2 px-3 border-purple-800 mb-4 rounded font-medium hover:bg-transparent hover:border-purple-800 border bg-purple-400/25 text-purple-800 cursor-pointer transition-colors"
                role="button"
              >
                {word.toUpperCase()}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 border-t pt-4">
        <div className="flex import my-4 border border-dashed border-gray-600 p-4 bg-gray-100 items-center justify-center">
          <div className="flex m-2 leading-none font-bold">Import Words:</div>
          <div className="flex m-2 leading-none">
            <input
              type="file"
              ref={importInputRef}
              onChange={importKnownWords}
              accept=".json"
            />
          </div>
        </div>
        <button onClick={exportKnownWords} className="bg-green-600 hover:bg-green-700 px-4 py-1 rounded mr-2 text-white font-bold transition-colors">
          Export Known Words
        </button>
        <button onClick={clearKnownWords} className="alert bg-red-600 hover:bg-red-700 px-4 py-1 rounded text-white font-bold transition-colors">
          Forget them ALL!
        </button>
      </div>
    </div>
  );
}
