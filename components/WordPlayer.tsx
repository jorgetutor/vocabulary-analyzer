"use client";

import { useState, useMemo, useEffect, useRef } from 'react';

interface WordPlayerProps {
    words: string[];
}

export default function WordPlayer({ words = [] }: WordPlayerProps) {
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(1);
    const [seconds, setSeconds] = useState(0);

    const [totalSeconds, setTotalSeconds] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentWord, setCurrentWord] = useState('');

    // Refs for mutable values that don't need to trigger re-renders directly in the loop but affect logic
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const elapsedRef = useRef(0);
    const shuffledRef = useRef<string[]>([]);
    const indexRef = useRef(0);

    const displayTime = useMemo(() => {
        const h = isPlaying
            ? Math.floor(totalSeconds / 3600)
            : hours;
        const m = isPlaying
            ? Math.floor((totalSeconds % 3600) / 60)
            : minutes;
        const s = isPlaying
            ? totalSeconds % 60
            : seconds;
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }, [isPlaying, totalSeconds, hours, minutes, seconds]);

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

        shuffledRef.current = shuffle(words);
        indexRef.current = 0;
        elapsedRef.current = 0;
        setCurrentWord(shuffledRef.current[indexRef.current] || '');

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setTotalSeconds((prev) => {
                if (prev > 0) {
                    elapsedRef.current++;
                    if (elapsedRef.current % 5 === 0 && shuffledRef.current.length > 0) {
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

    function stop() {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsPlaying(false);

        // Update input values based on what was left
        // Note: totalSeconds state update might be pending, so this logic in React needs care.
        // However, since stop() is called from effect or manually, reading state directly or via callback.
        // For simplicity, we trust the current render 'totalSeconds' or the one just set to 0.
        // If stopped manually, totalSeconds has the remaining time.
        setHours((h) => Math.floor(totalSeconds / 3600) || 0); // fallback if NaN
        setMinutes((m) => Math.floor((totalSeconds % 3600) / 60) || 0);
        setSeconds((s) => totalSeconds % 60 || 0);
    }

    // Need to handle the case where 'stop' is called from within the interval (which sees stale state if not careful).
    // In the setInterval above, we call stop() but that refers to the closure's stop, which uses stale state? 
    // Actually, 'stop' definition closes over 'totalSeconds' at the time of render.
    // BUT the setInterval callback uses the functional update form for setTotalSeconds.
    // Logic fix: The 'stop' inside setInterval might not update the input fields correctly because of closure.
    // It's better to use a useEffect to watch totalSeconds reaching 0?

    // Revised approach for stop logic sync
    useEffect(() => {
        if (isPlaying && totalSeconds === 0) {
            stop();
        }
    }, [totalSeconds, isPlaying]);


    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return (
        <div className="word-player border border-dashed border-gray-50 mt-4 mb-8 p-4">
            <div className="display flex items-center justify-center text-2xl mb-2">
                <div className="timer font-bold mr-2">{displayTime}</div>
                <div className="word uppercase p-4 text-3xl font-extrabold md:text-8xl">{currentWord}</div>
            </div>
            <div className="controls flex items-center justify-center gap-2">
                {!isPlaying && (
                    <>
                        <input
                            type="number"
                            value={hours}
                            onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                            min="0"
                            className="w-12 text-center border rounded bg-transparent p-1"
                        />
                        :
                        <input
                            type="number"
                            value={minutes}
                            onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                            min="0"
                            max="59"
                            className="w-12 text-center border rounded bg-transparent p-1"
                        />
                        :
                        <input
                            type="number"
                            value={seconds}
                            onChange={(e) => setSeconds(parseInt(e.target.value) || 0)}
                            min="0"
                            max="59"
                            className="w-12 text-center border rounded bg-transparent p-1"
                        />
                    </>
                )}
                <button
                    onClick={isPlaying ? stop : start}
                    className="ml-2 px-4 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
                >
                    {isPlaying ? 'Stop' : 'Play'}
                </button>
            </div>
        </div>
    );
}
