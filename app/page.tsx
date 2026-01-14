"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Speaker from "@/components/Speaker";

interface WordFrequency {
  word: string;
  count: number;
}

export default function Home() {
  const [fileContent, setFileContent] = useState<string>("");
  const [knownWords, setKnownWords] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Load known words from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("knownWords");
    if (stored) {
      setKnownWords(JSON.parse(stored));
    } else {
      // Load default if available
      fetch('data/defaultKnownWords.json')
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data)) {
            setKnownWords(data)
            localStorage.setItem("knownWords", JSON.stringify(data));
          }
        })
        .catch(err => console.log("No default words found", err));
    }
  }, []);

  // Save known words whenever they change
  useEffect(() => {
    localStorage.setItem("knownWords", JSON.stringify(knownWords));
  }, [knownWords]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    reader.readAsText(file);
  };

  const wordFrequencies = useMemo(() => {
    if (!fileContent) return [];

    const words = fileContent.toLowerCase().match(/\b[a-z']+\b/g) || [];
    const frequencyMap: Record<string, number> = {};

    words.forEach((word) => {
      if (!knownWords.includes(word) && word.length > 2) { // Filter short words
        frequencyMap[word] = (frequencyMap[word] || 0) + 1;
      }
    });

    return Object.entries(frequencyMap)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 100); // Top 100
  }, [fileContent, knownWords]);

  const addKnownWord = (word: string) => {
    setKnownWords((prev) => [...prev, word]);
  };

  const removeKnownWord = (word: string) => {
    setKnownWords((prev) => prev.filter((w) => w !== word));
  };

  const clearKnownWords = () => {
    if (confirm("Are you sure you want to forget all known words?")) {
      setKnownWords([]);
    }
  };

  const exportKnownWords = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(knownWords));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "known_words.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importKnownWords = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        if (Array.isArray(content)) {
          // Merge with existing
          setKnownWords(prev => Array.from(new Set([...prev, ...content])));
        }
      } catch (err) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  }

  const markAllAsKnown = () => {
    const newWords = wordFrequencies.map(w => w.word);
    setKnownWords(prev => Array.from(new Set([...prev, ...newWords])));
  };

  const clearFile = () => {
    setFileContent("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="app max-w-5xl mx-auto p-6 md:p-12 text-center min-h-screen text-gray-800 dark:text-gray-100 font-sans selection:bg-purple-200 dark:selection:bg-purple-900">
      <header className="mb-12">
        <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 drop-shadow-sm">
          Vocabulary Builder
        </h1>
        <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 font-light max-w-2xl mx-auto leading-relaxed">
          Your personal <strong className="font-semibold text-primary-600 dark:text-primary-400">linguistic companion</strong>. Extract, track, and master words from your documents.
        </p>
      </header>

      {/* Trainer Section */}
      <section className="mb-16">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px bg-gray-200 dark:bg-slate-800 flex-1 max-w-[100px]"></div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Trainer</h2>
          <div className="h-px bg-gray-200 dark:bg-slate-800 flex-1 max-w-[100px]"></div>
        </div>

        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">The Speaker</h3>
        </div>
        <Speaker words={knownWords} />
      </section>

      {wordFrequencies.length > 0 && (
        <div className="mt-12 animate-fade-in">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6 px-2 border-b border-gray-200 dark:border-slate-800 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                Words from file
                <span className="text-sm font-bold bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">{wordFrequencies.length}</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={markAllAsKnown}
                className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Known All
              </button>
              <button
                onClick={clearFile}
                className="px-4 py-2 text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/50 rounded-lg transition-colors active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                Clear List
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-400 italic mb-4 text-left px-2">Click to <strong className="font-bold text-gray-500 dark:text-gray-300">mark as known</strong></div>

          <ol className="flex items-start flex-wrap gap-3 justify-center">
            {wordFrequencies.map((item) => (
              <li
                key={item.word}
                onClick={() => addKnownWord(item.word)}
                className="group relative cursor-pointer bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm rounded-xl px-4 py-2 hover:shadow-md hover:border-primary/30 dark:hover:border-primary/50 hover:scale-105 active:scale-95 transition-all duration-200"
                role="button"
              >
                <b className="text-gray-700 dark:text-gray-200 font-bold group-hover:text-primary dark:group-hover:text-primary-400 transition-colors">{item.word.toUpperCase()}</b>
                <span className="absolute -top-2 -right-2 bg-gray-100 dark:bg-slate-700 text-[10px] font-bold text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full shadow-sm border border-white dark:border-slate-600 group-hover:bg-primary group-hover:text-white transition-colors">
                  {item.count}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* File Upload Area - Moved after Words List */}
      <div className="import mt-12 mb-12 transform transition-all hover:-translate-y-1">
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl cursor-pointer bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-lg transition-all group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-12 h-12 mb-4 text-gray-400 dark:text-gray-500 group-hover:text-primary transition-colors" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
            </svg>
            <p className="mb-2 text-lg text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"><span className="font-semibold text-primary dark:text-primary-400">Click to upload text</span> or drag and drop</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">SRT, TXT, SUB, MD</p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".srt,.txt,.sub,.md"
            className="hidden"
          />
        </label>
      </div>

      {knownWords.length > 0 && (
        <div className="mt-16 animate-fade-in pb-20">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6 px-2 border-b border-gray-200 dark:border-slate-800 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                Known Words
                <span className="text-sm font-bold bg-green-100 dark:bg-emerald-900/30 text-green-700 dark:text-emerald-400 px-3 py-1 rounded-full">{knownWords.length}</span>
              </h2>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {/* Import */}
              <label className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors shadow-sm active:scale-95 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                Import JSON
                <input
                  type="file"
                  ref={importInputRef}
                  onChange={importKnownWords}
                  accept=".json"
                  className="hidden"
                />
              </label>

              {/* Export */}
              <button onClick={exportKnownWords} className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm active:scale-95 flex items-center gap-2 cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Export
              </button>

              {/* Forget All */}
              <button
                onClick={clearKnownWords}
                className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                Forget All
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-400 italic mb-4 text-left px-2">Click to <strong className="font-bold text-gray-500 dark:text-gray-300">remove</strong></div>

          <ul className="flex flex-wrap gap-2 justify-center">
            {knownWords.map((word) => (
              <li
                key={word}
                onClick={() => removeKnownWord(word)}
                className="cursor-pointer flex items-center gap-2 bg-green-50/50 dark:bg-emerald-900/20 border border-transparent rounded-lg px-3 py-1.5 text-sm font-medium text-green-700 dark:text-emerald-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors duration-200 group"
                role="button"
              >
                {word.toUpperCase()}
                <svg className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
