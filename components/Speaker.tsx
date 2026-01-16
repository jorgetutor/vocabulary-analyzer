import { useState, useRef, useEffect, useMemo } from 'react';

interface SpeakerProps {
    words: string[];
}

export default function Speaker({ words = [] }: SpeakerProps) {
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(1);
    const [seconds, setSeconds] = useState(0);
    const [interval, setIntervalValue] = useState(5);

    const [totalSeconds, setTotalSeconds] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentWord, setCurrentWord] = useState('');

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const elapsedRef = useRef(0);
    const shuffledRef = useRef<string[]>([]);
    const indexRef = useRef(0);

    // Initial setup time needed to reset if cancelled, 
    // but the user requirement implies "goes back to initial screen" so we just reset isPlaying.

    const displayTime = useMemo(() => {
        // Show countdown logic only if playing, otherwise config inputs shown
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }, [totalSeconds]);

    function shuffle(array: string[]) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function start() {
        const initial = hours * 3600 + minutes * 60 + seconds;
        if (initial <= 0) return;

        setTotalSeconds(initial);
        setIsPlaying(true);
        setIsPaused(false);

        shuffledRef.current = shuffle(words);
        indexRef.current = 0;
        elapsedRef.current = 0;
        setCurrentWord(shuffledRef.current[indexRef.current] || '');

        startInterval();
    }

    function startInterval() {
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setTotalSeconds((prev) => {
                if (prev > 0) {
                    elapsedRef.current++;
                    // Use dynamic interval
                    if (elapsedRef.current % interval === 0 && shuffledRef.current.length > 0) {
                        indexRef.current++;
                        if (indexRef.current >= shuffledRef.current.length) {
                            shuffledRef.current = shuffle(words);
                            indexRef.current = 0;
                        }
                        setCurrentWord(shuffledRef.current[indexRef.current]);
                    }
                    return prev - 1;
                } else {
                    stop();
                    return 0;
                }
            });
        }, 1000);
    }

    function pause() {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsPaused(true);
    }

    function resume() {
        setIsPaused(false);
        startInterval();
    }

    function stop() {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsPlaying(false);
        setIsPaused(false);
        // Reset inputs to previous values if needed, or leave as is. 
        // User said "goes back to initial screen", preserving inputs is standard UX.
    }

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Idle View
    if (!isPlaying) {
        return (
            <div className="speaker-idle glass dark:glass-dark rounded-2xl shadow-xl p-8 max-w-3xl mx-auto flex flex-col items-center gap-8">

                <div className="text-center max-w-lg">
                    <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
                        Boost your <strong className="text-primary-600 dark:text-primary-400">active recall</strong>. Words will appear sequentially for a fixed interval. Read them aloud instantly to train your fluency.
                    </p>
                </div>

                <div className="w-full h-px bg-gray-200 dark:bg-gray-700/50"></div>

                {/* Configuration Row */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-center gap-12 w-full">

                    {/* Duration Settings */}
                    <div className="flex flex-col items-center">
                        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Total Duration</h3>
                        <div className="flex items-center gap-4 font-mono text-xl text-gray-600 dark:text-gray-300">
                            <div className="flex flex-col items-center">
                                <input
                                    type="number"
                                    value={hours}
                                    onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                                    min="0"
                                    className="w-16 text-center border-b-2 border-gray-300 dark:border-gray-600 bg-transparent focus:border-primary dark:focus:border-primary-400 focus:outline-none p-2 text-2xl transition-colors"
                                />
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mt-2">Hr</span>
                            </div>
                            <span className="text-3xl pb-6 opacity-30">:</span>
                            <div className="flex flex-col items-center">
                                <input
                                    type="number"
                                    value={minutes}
                                    onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                    min="0"
                                    max="59"
                                    className="w-16 text-center border-b-2 border-gray-300 dark:border-gray-600 bg-transparent focus:border-primary dark:focus:border-primary-400 focus:outline-none p-2 text-2xl transition-colors"
                                />
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mt-2">Min</span>
                            </div>
                            <span className="text-3xl pb-6 opacity-30">:</span>
                            <div className="flex flex-col items-center">
                                <input
                                    type="number"
                                    value={seconds}
                                    onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                    min="0"
                                    max="59"
                                    className="w-16 text-center border-b-2 border-gray-300 dark:border-gray-600 bg-transparent focus:border-primary dark:focus:border-primary-400 focus:outline-none p-2 text-2xl transition-colors"
                                />
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mt-2">Sec</span>
                            </div>
                        </div>
                    </div>

                    {/* Divider for desktop */}
                    <div className="hidden md:block w-px h-24 bg-gray-200 dark:bg-gray-700/50"></div>

                    {/* Interval Setting */}
                    <div className="flex flex-col items-center">
                        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Word Interval</h3>
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    value={interval}
                                    onChange={(e) => setIntervalValue(Math.max(1, parseInt(e.target.value) || 1))}
                                    min="1"
                                    className="w-20 text-center border-b-2 border-primary/50 dark:border-primary-400/50 bg-transparent focus:border-primary dark:focus:border-primary-400 focus:outline-none p-2 text-2xl font-bold text-primary-600 dark:text-primary-400 transition-colors"
                                />
                                <span className="text-xl font-mono text-gray-400 dark:text-gray-600 pt-2">seconds</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full h-px bg-gray-200 dark:bg-gray-700/50"></div>

                <button
                    onClick={start}
                    disabled={words.length === 0}
                    className="w-full md:w-auto md:px-20 py-4 rounded-xl font-black text-white text-lg shadow-lg transform transition-all active:scale-95 hover:shadow-xl focus:outline-none ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 bg-gradient-to-r from-primary-600 to-accent-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {words.length === 0 ? "Add Words First" : "Start Session"}
                </button>
            </div>
        );
    }

    // Active View (Full Screen)
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-colors animate-fade-in">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gray-100 dark:bg-slate-900">
                <div
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${(totalSeconds / (hours * 3600 + minutes * 60 + seconds)) * 100}%` }}
                ></div>
            </div>

            <div className="flex flex-col items-center justify-center relative w-full h-full max-w-6xl mx-auto p-6">

                {/* Timer Display */}
                <div className="absolute top-8 right-8 font-mono text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 opacity-50">
                    {displayTime}
                </div>

                <div className="relative w-full flex justify-center py-20 flex-grow items-center">
                    {/* Background blob */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vh] h-[80vh] bg-gradient-to-r from-primary/5 to-accent/5 blur-[120px] rounded-full animate-pulse-slow"></div>

                    {/* Big Word */}
                    <div className="word uppercase p-8 text-[15vw] md:text-[12rem] font-black text-gray-900 dark:text-white tracking-tighter leading-none relative z-10 break-words text-center drop-shadow-2xl select-none animate-scale-in">
                        {currentWord}
                    </div>
                </div>

                {/* Controls */}
                <div className="mb-12 flex gap-6 z-20">
                    <button
                        onClick={isPaused ? resume : pause}
                        className={`px-10 py-4 rounded-2xl font-bold text-xl shadow-lg transform transition-all active:scale-95 hover:shadow-xl focus:outline-none ring-2 ring-offset-4 ring-offset-white dark:ring-offset-slate-950 ${isPaused
                                ? 'bg-emerald-500 hover:bg-emerald-600 ring-emerald-200 dark:ring-emerald-900 text-white'
                                : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        {isPaused ? 'Resume' : 'Pause'}
                    </button>

                    <button
                        onClick={stop}
                        className="px-10 py-4 rounded-2xl font-bold text-xl text-white bg-rose-500 hover:bg-rose-600 shadow-lg transform transition-all active:scale-95 hover:shadow-xl focus:outline-none ring-2 ring-offset-4 ring-offset-white dark:ring-offset-slate-950 ring-rose-200 dark:ring-rose-900"
                    >
                        End Session
                    </button>
                </div>
            </div>
        </div>
    );
}
