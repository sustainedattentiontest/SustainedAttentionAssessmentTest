import {MAX_ROUNDS, ROUND_INTERVAL_IN_MS, MAX_TOTAL_MISSES_FOR_TRIAL} from "../../../constants";
import {useState, useEffect, useRef} from "react";
import styles from './NegativeNumberTestRuntime.module.css';
import { useSetTestMetrics } from '../../../contexts/TestMetricsContext';

type NumberType = '1' | '2' | '3' | '4';

interface NegativeNumberTestRuntimeProps {
    trial: boolean;
    onComplete?: () => void;
    goStimulusNumber: NumberType; // The number that should NOT be pressed (pressing it = commission miss)
    testKey: string; // The key to use when storing metrics in TestMetrics context (e.g., 'test9', 'test10')
}

// Function to generate a random number sequence for trial (infinite, no consecutive duplicates)
const generateTrialSequence = (length: number, goStimulusNumber: NumberType): NumberType[] => {
    const numbers: NumberType[] = ['1', '2', '3', '4'];
    const sequence: NumberType[] = [];
    
    let lastNumber: NumberType | null = null;
    for (let i = 0; i < length; i++) {
        let availableNumbers = numbers;
        if (lastNumber !== null) {
            // Exclude the last number to prevent consecutive duplicates
            availableNumbers = numbers.filter(n => n !== lastNumber);
        }
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        const selectedNumber = availableNumbers[randomIndex];
        sequence.push(selectedNumber);
        lastNumber = selectedNumber;
    }
    
    return sequence;
};

// Function to generate sequence for real test:
// - Each of the 4 numbers appears exactly 5 times (25% each)
// - goStimulusNumber is the ONLY no-go stimulus
// - All other numbers (the 3 others) are hit numbers
// - No number appears consecutively (all numbers)
const generateRealTestSequence = (goStimulusNumber: NumberType): NumberType[] => {
    const sequence: (NumberType | null)[] = new Array(20).fill(null);
    const allNumbers: NumberType[] = ['1', '2', '3', '4'];
    const hitNumbers: NumberType[] = allNumbers.filter(n => n !== goStimulusNumber) as NumberType[]; // All numbers except goStimulusNumber are hit numbers
    
    const NUMBER_COUNT = 5; // 25% of 20 for each number
    
    // Step 1: Determine positions for all numbers ensuring non-consecutive placement
    // We'll try different random placements until we find a valid configuration
    let maxAttempts = 10000;
    let attempts = 0;
    let foundValidSequence = false;
    
    while (!foundValidSequence && attempts < maxAttempts) {
        attempts++;
        
        // Reset sequence
        for (let i = 0; i < 20; i++) {
            sequence[i] = null;
        }
        
        // Create arrays to track positions for each number
        const goStimulusPositions: number[] = [];
        const hitNumberPositions: { [key: string]: number[] } = {
            [hitNumbers[0]]: [],
            [hitNumbers[1]]: [],
            [hitNumbers[2]]: []
        };
        
        // Generate candidate positions for all numbers
        const allPositions = Array.from({ length: 20 }, (_, i) => i);
        
        // Shuffle positions
        const shuffledPositions = [...allPositions].sort(() => Math.random() - 0.5);
        
        // Helper function to check if position is consecutive to any existing positions
        const isConsecutive = (pos: number, allPositionArrays: number[][]): boolean => {
            return allPositionArrays.some(arr => arr.some(p => Math.abs(p - pos) === 1));
        };
        
        // Collect all position arrays for consecutive checking
        const getAllPositionArrays = (): number[][] => {
            return [goStimulusPositions, ...Object.values(hitNumberPositions)];
        };
        
        // Try to place goStimulusNumber first (25% = 5 positions)
        for (const pos of shuffledPositions) {
            if (goStimulusPositions.length >= NUMBER_COUNT) break;
            if (isConsecutive(pos, getAllPositionArrays())) continue;
            goStimulusPositions.push(pos);
        }
        
        // If we didn't get enough goStimulus positions, try again
        if (goStimulusPositions.length < NUMBER_COUNT) continue;
        
        // Try to place each hit number (25% each = 5 positions)
        let allHitNumbersPlaced = true;
        
        for (let i = 0; i < hitNumbers.length; i++) {
            const hitNumber = hitNumbers[i];
            
            for (const pos of shuffledPositions) {
                if (hitNumberPositions[hitNumber].length >= NUMBER_COUNT) break;
                if (goStimulusPositions.includes(pos)) continue;
                // Check if position is already taken by another hit number
                const isTaken = Object.values(hitNumberPositions).some(positions => positions.includes(pos));
                if (isTaken) continue;
                if (isConsecutive(pos, getAllPositionArrays())) continue;
                hitNumberPositions[hitNumber].push(pos);
            }
            
            if (hitNumberPositions[hitNumber].length < NUMBER_COUNT) {
                allHitNumbersPlaced = false;
                break;
            }
        }
        
        // Check if we successfully placed all numbers (5 each)
        if (goStimulusPositions.length === NUMBER_COUNT && allHitNumbersPlaced) {
            
            // Place all numbers in sequence
            goStimulusPositions.forEach(pos => {
                sequence[pos] = goStimulusNumber;
            });
            Object.entries(hitNumberPositions).forEach(([number, positions]) => {
                positions.forEach(pos => {
                    sequence[pos] = number as NumberType;
                });
            });
            
            // Verify no consecutive duplicates
            let hasConsecutive = false;
            for (let i = 1; i < sequence.length; i++) {
                if (sequence[i] === sequence[i - 1]) {
                    hasConsecutive = true;
                    break;
                }
            }
            
            if (!hasConsecutive) {
                foundValidSequence = true;
            }
        }
    }
    
    // If we couldn't generate a valid sequence after max attempts, use backtracking
    if (!foundValidSequence) {
        // Use backtracking to guarantee both requirements: 5 of each number, no consecutive
        const numberCounts: { [key: string]: number } = {
            [goStimulusNumber]: NUMBER_COUNT
        };
        allNumbers.filter(n => n !== goStimulusNumber).forEach((number) => {
            numberCounts[number] = NUMBER_COUNT;
        });
        
        const backtrackSequence: (NumberType | null)[] = new Array(20).fill(null);
        
        const backtrack = (pos: number): boolean => {
            if (pos === 20) {
                // Verify each number appears exactly 5 times
                const counts: { [key: string]: number } = {
                    '1': 0,
                    '2': 0,
                    '3': 0,
                    '4': 0
                };
                backtrackSequence.forEach(number => {
                    if (number) counts[number]++;
                });
                return allNumbers.every(number => counts[number] === NUMBER_COUNT);
            }
            
            // Try each number at this position
            const shuffledNumbers = [...allNumbers].sort(() => Math.random() - 0.5);
            for (const number of shuffledNumbers) {
                // Skip if no more of this number available
                if (numberCounts[number] <= 0) continue;
                // Skip if consecutive duplicate
                if (pos > 0 && backtrackSequence[pos - 1] === number) continue;
                
                // Try placing this number
                backtrackSequence[pos] = number;
                numberCounts[number]--;
                
                if (backtrack(pos + 1)) {
                    return true;
                }
                
                // Backtrack
                backtrackSequence[pos] = null;
                numberCounts[number]++;
            }
            
            return false;
        };
        
        if (backtrack(0)) {
            // Verify no consecutive duplicates one more time
            let hasConsecutive = false;
            for (let i = 1; i < backtrackSequence.length; i++) {
                if (backtrackSequence[i] === backtrackSequence[i - 1]) {
                    hasConsecutive = true;
                    break;
                }
            }
            
            if (!hasConsecutive) {
                for (let i = 0; i < 20; i++) {
                    sequence[i] = backtrackSequence[i];
                }
                foundValidSequence = true;
            }
        }
    }
    
    // Final verification before returning
    if (foundValidSequence) {
        // Double-check: verify each number appears exactly 5 times and no consecutive
        const counts: { [key: string]: number } = {
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0
        };
        let hasConsecutive = false;
        
        for (let i = 0; i < sequence.length; i++) {
            const number = sequence[i];
            if (number) {
                counts[number]++;
            }
            if (i > 0 && sequence[i] === sequence[i - 1]) {
                hasConsecutive = true;
            }
        }
        
        const allNumbersCorrect = allNumbers.every(number => counts[number] === NUMBER_COUNT);
        
        if (allNumbersCorrect && !hasConsecutive) {
            return sequence.filter((s): s is NumberType => s !== null);
        }
    }
    
    // Ultimate fallback: simple greedy with verification
    const finalSequence: NumberType[] = [];
    const finalNumberCounts: { [key: string]: number } = {
        '1': NUMBER_COUNT,
        '2': NUMBER_COUNT,
        '3': NUMBER_COUNT,
        '4': NUMBER_COUNT
    };
    
    for (let i = 0; i < 20; i++) {
        const availableNumbers = allNumbers.filter(number => {
            if (finalNumberCounts[number] <= 0) return false;
            if (i > 0 && finalSequence[i - 1] === number) return false;
            return true;
        });
        
        if (availableNumbers.length === 0) {
            // This shouldn't happen, but if it does, use any remaining number
            const remaining = allNumbers.filter(n => finalNumberCounts[n] > 0);
            if (remaining.length > 0) {
                const selected = remaining[0];
                finalSequence.push(selected);
                finalNumberCounts[selected]--;
            }
        } else {
            const selected = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
            finalSequence.push(selected);
            finalNumberCounts[selected]--;
        }
    }
    
    // Verify the final sequence
    const counts: { [key: string]: number } = {
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0
    };
    let hasConsecutive = false;
    
    for (let i = 0; i < finalSequence.length; i++) {
        counts[finalSequence[i]]++;
        if (i > 0 && finalSequence[i] === finalSequence[i - 1]) {
            hasConsecutive = true;
        }
    }
    
    // If verification fails, log warning but return sequence anyway (should rarely happen)
    if (!allNumbers.every(number => counts[number] === NUMBER_COUNT) || hasConsecutive) {
        console.warn('NegativeNumberTestRuntime: Sequence generation verification failed, but returning sequence anyway');
    }
    
    return finalSequence;
};

function NegativeNumberTestRuntime({ trial, onComplete, goStimulusNumber, testKey }: NegativeNumberTestRuntimeProps) {
    const [round, setRound] = useState(1);
    const [hits, setHits] = useState(0);
    const [commissionMisses, setCommissionMisses] = useState(0);
    const [omissionMisses, setOmissionMisses] = useState(0);
    const setTestMetrics = useSetTestMetrics();
    const [countdown, setCountdown] = useState<number | string | null>(null);
    const [countdownText, setCountdownText] = useState<string | null>(null);
    const [completionMessage, setCompletionMessage] = useState<string | null>(null);
    const [restartMessage, setRestartMessage] = useState<string | null>(null);
    const [hasStarted, setHasStarted] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const hitsRef = useRef(0);
    const commissionMissesRef = useRef(0);
    const omissionMissesRef = useRef(0);
    const spacePressedForRoundRef = useRef<number>(0);
    const roundRef = useRef(1);
    const omissionCheckedForRoundRef = useRef<number>(0);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const numberSequenceRef = useRef<NumberType[]>([]);
    const trialSequencePositionRef = useRef<number>(0);
    const roundStartTimeRef = useRef<number>(performance.now()); // Track when current round started (high precision)
    const hitReactionTimesRef = useRef<{ [round: number]: number }>({}); // Store reaction times for each hit by round
    const roundStateRef = useRef<number>(1); // Track round to detect changes for RAF timing
    const completedRef = useRef<boolean>(false); // Track if test has completed to prevent infinite loops

    // Initialize number sequence based on trial mode
    useEffect(() => {
        if (trial) {
            // For trial: generate a long sequence that we'll extend as needed
            numberSequenceRef.current = generateTrialSequence(100, goStimulusNumber);
            trialSequencePositionRef.current = 0;
        } else {
            // For real test: generate fixed sequence with exactly 5 of each number
            numberSequenceRef.current = generateRealTestSequence(goStimulusNumber);
        }
    }, [trial, goStimulusNumber]);

    // Function to reset trial state
    const resetTrial = () => {
        // Reset all metrics
        setRound(1);
        setHits(0);
        setCommissionMisses(0);
        setOmissionMisses(0);
        setHasStarted(false);
        setRestartMessage(null);
        setCountdown(null);
        setCountdownText(null);
        
        // Reset refs
        hitsRef.current = 0;
        commissionMissesRef.current = 0;
        omissionMissesRef.current = 0;
        spacePressedForRoundRef.current = 0;
        roundRef.current = 1;
        omissionCheckedForRoundRef.current = 0;
        trialSequencePositionRef.current = 0;
        roundStartTimeRef.current = performance.now();
        hitReactionTimesRef.current = {};
        roundStateRef.current = 1;
        completedRef.current = false; // Reset completion flag
        
        // Regenerate trial sequence
        if (trial) {
            numberSequenceRef.current = generateTrialSequence(100, goStimulusNumber);
        }
        
        // Clear any intervals
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    // Function to generate beep sound using Web Audio API
    const playBeep = (frequency: number = 800, duration: number = 200) => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        } catch (error) {
            // Silently fail if audio context is not available
        }
    };

    // Countdown effect
    useEffect(() => {
        if (hasStarted || restartMessage) return;

        // Show initial text based on trial mode
        const initialText = trial ? "Trial starting..." : "Real test starting...";
        setCountdownText(initialText);

        // After showing text, start countdown
        const textTimeout = setTimeout(() => {
            setCountdownText(null);
            let count = 3;
            setCountdown(count);
            playBeep(600, 150);

            countdownIntervalRef.current = setInterval(() => {
                count--;
                if (count > 0) {
                    setCountdown(count);
                    playBeep(600, 150);
                } else if (count === 0) {
                    setCountdown('START');
                    playBeep(800, 300);
                    
                    // After START, begin the test
                    setTimeout(() => {
                        setCountdown(null);
                        setHasStarted(true);
                    }, 500);
                }
            }, 1000);
        }, 1500); // Show text for 1.5 seconds

        return () => {
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
            clearTimeout(textTimeout);
        };
    }, [trial, hasStarted, restartMessage]);

    // Sync roundRef with round state
    useEffect(() => {
        roundRef.current = round;
    }, [round]);

    // Set round start time when number is actually visible on screen (after render)
    useEffect(() => {
        if (hasStarted && round >= 1) {
            // Use double requestAnimationFrame to ensure paint is complete
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    roundStartTimeRef.current = performance.now();
                });
            });
        }
    }, [round, hasStarted]);

    useEffect(() => {
        if (!hasStarted || completedRef.current) {
            // Initialize round start time when test starts (will be set when number actually renders)
            // Also return early if test is already completed to prevent infinite loops
            return;
        }

        intervalRef.current = setInterval(() => {
            // Guard against running if test is already completed
            if (completedRef.current) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                return;
            }

            setRound(prevRound => {
                // Check for omission miss: if previous round was a hit number and space wasn't pressed
                // Only check once per round to prevent double counting
                if (prevRound >= 1 && omissionCheckedForRoundRef.current !== prevRound) {
                    const prevNumberIndex = prevRound - 1;
                    let prevNumber: NumberType;
                    if (trial) {
                        // For trial: extend sequence if needed
                        if (prevNumberIndex >= numberSequenceRef.current.length) {
                            const extension = generateTrialSequence(50, goStimulusNumber);
                            const lastNumber = numberSequenceRef.current[numberSequenceRef.current.length - 1];
                            // Ensure first number of extension is not the same as last
                            if (extension[0] === lastNumber) {
                                const allNumbers: NumberType[] = ['1', '2', '3', '4'];
                                const alternativeNumbers = allNumbers.filter(n => n !== lastNumber);
                                extension[0] = alternativeNumbers[Math.floor(Math.random() * alternativeNumbers.length)];
                            }
                            numberSequenceRef.current = [...numberSequenceRef.current, ...extension];
                        }
                        prevNumber = numberSequenceRef.current[prevNumberIndex];
                    } else {
                        prevNumber = numberSequenceRef.current[prevNumberIndex];
                    }
                    
                    // In negative test: omission miss when any hit number (not goStimulusNumber) appears and space wasn't pressed
                    if (prevNumber !== goStimulusNumber && spacePressedForRoundRef.current !== prevRound) {
                        const newOmissionMisses = omissionMissesRef.current + 1;
                        omissionMissesRef.current = newOmissionMisses;
                        setOmissionMisses(newOmissionMisses);
                        
                        // Check if trial should restart due to too many misses
                        if (trial) {
                            const totalMisses = commissionMissesRef.current + newOmissionMisses;
                            if (totalMisses >= MAX_TOTAL_MISSES_FOR_TRIAL) {
                                // Show restart message and reset trial
                                if (intervalRef.current) {
                                    clearInterval(intervalRef.current);
                                    intervalRef.current = null;
                                }
                                setRestartMessage("Too many mistakes, restarting the trial");
                                setTimeout(() => {
                                    resetTrial();
                                }, 2500);
                            }
                        }
                    }
                    // Mark that we've checked this round to prevent duplicate checks
                    omissionCheckedForRoundRef.current = prevRound;
                }
                
                const newRound = prevRound + 1;
                roundRef.current = newRound;
                roundStateRef.current = newRound;
                // Round start time will be set when number actually renders (see useEffect below)
                if (!trial && newRound > MAX_ROUNDS && !completedRef.current) {
                    // Mark as completed to prevent further execution
                    completedRef.current = true;
                    
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                    // Store metrics in context for real test completion
                    setTestMetrics(testKey, {
                        hits: hitsRef.current,
                        commissionMisses: commissionMissesRef.current,
                        omissionMisses: omissionMissesRef.current,
                        hitReactionTimes: { ...hitReactionTimesRef.current }
                    });
                    // Show completion message instead of alert
                    setCompletionMessage("Test is done!");
                    // Call onComplete callback after showing message
                    if (onComplete) {
                        setTimeout(() => {
                            setCompletionMessage(null);
                            onComplete();
                        }, 2000);
                    }
                    // Return current round without incrementing
                    return prevRound;
                }
                return newRound;
            });
    }, ROUND_INTERVAL_IN_MS);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [trial, hasStarted, onComplete, goStimulusNumber, testKey, setTestMetrics]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.code === 'Space') {
                event.preventDefault();
                
                // Get current round from ref to ensure we have the latest value
                const currentRound = roundRef.current;
                
                // Debounce: Only record one space press per round
                if (spacePressedForRoundRef.current === currentRound) {
                    return;
                }
                
                // Mark that space was pressed for this round
                spacePressedForRoundRef.current = currentRound;
                
                // Play soft sound to register space press
                playBeep(400, 50);
                
                // Get current number based on current round (1-indexed, so subtract 1 for array index)
                let currentNumber: NumberType | null = null;
                if (currentRound >= 1) {
                    const numberIndex = currentRound - 1;
                    if (trial) {
                        // For trial: extend sequence if needed
                        if (numberIndex >= numberSequenceRef.current.length) {
                            const extension = generateTrialSequence(50, goStimulusNumber);
                            const lastNumber = numberSequenceRef.current[numberSequenceRef.current.length - 1];
                            // Ensure first number of extension is not the same as last
                            if (extension[0] === lastNumber) {
                                const allNumbers: NumberType[] = ['1', '2', '3', '4'];
                                const alternativeNumbers = allNumbers.filter(n => n !== lastNumber);
                                extension[0] = alternativeNumbers[Math.floor(Math.random() * alternativeNumbers.length)];
                            }
                            numberSequenceRef.current = [...numberSequenceRef.current, ...extension];
                        }
                        currentNumber = numberSequenceRef.current[numberIndex];
                    } else {
                        currentNumber = numberIndex < numberSequenceRef.current.length 
                            ? numberSequenceRef.current[numberIndex]
                            : null;
                    }
                }

                // In negative test: hit when pressing on any hit number (not goStimulusNumber)
                if (currentNumber !== null && currentNumber !== goStimulusNumber) {
                    const newHits = hitsRef.current + 1;
                    hitsRef.current = newHits;
                    setHits(newHits);
                    
                    // Calculate and store reaction time for this hit (using high precision timing)
                    const currentTime = performance.now();
                    const reactionTime = currentTime - roundStartTimeRef.current;
                    hitReactionTimesRef.current[currentRound] = Math.round(reactionTime); // Round to ms for storage
                    
                    // Only finish trial at 3 hits when trial=true
                    if (trial && newHits === 3) {
                        // Show completion message instead of alert
                        setCompletionMessage("Trial finished!");
                        // Call onComplete callback after showing message
                        if (onComplete) {
                            setTimeout(() => {
                                setCompletionMessage(null);
                                onComplete();
                            }, 2000);
                        }
                    }
                } else if (currentNumber === goStimulusNumber) {
                    // In negative test: commission miss when pressing on goStimulusNumber (the ONLY "no-go" stimulus)
                    const newCommissionMisses = commissionMissesRef.current + 1;
                    commissionMissesRef.current = newCommissionMisses;
                    setCommissionMisses(newCommissionMisses);
                    
                    // Check if trial should restart due to too many misses
                    if (trial) {
                        const totalMisses = newCommissionMisses + omissionMissesRef.current;
                        if (totalMisses >= MAX_TOTAL_MISSES_FOR_TRIAL) {
                            // Show restart message and reset trial
                            if (intervalRef.current) {
                                clearInterval(intervalRef.current);
                                intervalRef.current = null;
                            }
                            setRestartMessage("Too many mistakes, restarting the trial");
                            setTimeout(() => {
                                resetTrial();
                            }, 2500);
                        }
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [trial, onComplete, goStimulusNumber]);

    // Get current number based on round
    let currentNumber: NumberType | null = null;
    if (round >= 1) {
        const numberIndex = round - 1;
        if (trial) {
            // For trial: extend sequence if needed
            if (numberIndex >= numberSequenceRef.current.length) {
                const extension = generateTrialSequence(50, goStimulusNumber);
                const lastNumber = numberSequenceRef.current[numberSequenceRef.current.length - 1];
                // Ensure first number of extension is not the same as last
                if (extension[0] === lastNumber) {
                    const allNumbers: NumberType[] = ['1', '2', '3', '4'];
                    const alternativeNumbers = allNumbers.filter(n => n !== lastNumber);
                    extension[0] = alternativeNumbers[Math.floor(Math.random() * alternativeNumbers.length)];
                }
                numberSequenceRef.current = [...numberSequenceRef.current, ...extension];
            }
            currentNumber = numberSequenceRef.current[numberIndex];
        } else {
            currentNumber = numberIndex < numberSequenceRef.current.length 
                ? numberSequenceRef.current[numberIndex]
                : null;
        }
    }

    const totalMisses = commissionMisses + omissionMisses;

    const renderNumber = () => {
        if (!currentNumber) return null;
        return <div className={styles.number}>{currentNumber}</div>;
    };

    const isDev = process.env.REACT_APP_IS_DEV === 'true';

    return (
        <div className={styles['number-runtime-container']}>
            {(countdown !== null || countdownText !== null) && (
                <div className={styles['countdown-overlay']}>
                    {countdownText && (
                        <div className={styles['countdown-prefix-text']}>{countdownText}</div>
                    )}
                    {countdown !== null && (
                        <div className={styles['countdown-text']}>{countdown}</div>
                    )}
                </div>
            )}
            {completionMessage && (
                <div className={styles['countdown-overlay']}>
                    <div className={styles['completion-message']}>{completionMessage}</div>
                </div>
            )}
            {restartMessage && (
                <div className={styles['countdown-overlay']}>
                    <div className={styles['completion-message']}>{restartMessage}</div>
                </div>
            )}
            {hasStarted && !completionMessage && !restartMessage && (
                <div className={styles['number-wrapper']}>
                    <div className={styles['small-circle']}></div>
                    {renderNumber()}
                    <div className={styles['small-circle']}></div>
                </div>
            )}
            {isDev && (
                <div className={styles['debug-menu']}>
                    <h3 className={styles['debug-menu-title']}>Debug: Metrics</h3>
                    <div className={styles['debug-menu-content']}>
                        <div className={styles['debug-stat']}>
                            <span className={styles['debug-label']}>Hits:</span>
                            <span className={styles['debug-value']}>{hits}</span>
                        </div>
                        <div className={styles['debug-stat']}>
                            <span className={styles['debug-label']}>Commission Misses:</span>
                            <span className={styles['debug-value']}>{commissionMisses}</span>
                        </div>
                        <div className={styles['debug-stat']}>
                            <span className={styles['debug-label']}>Omission Misses:</span>
                            <span className={styles['debug-value']}>{omissionMisses}</span>
                        </div>
                        <div className={styles['debug-stat']}>
                            <span className={styles['debug-label']}>Total Misses:</span>
                            <span className={styles['debug-value']}>{totalMisses}</span>
                        </div>
                        <div className={styles['debug-stat']}>
                            <span className={styles['debug-label']}>Round:</span>
                            <span className={styles['debug-value']}>{round}</span>
                        </div>
                        <div className={styles['debug-stat']}>
                            <span className={styles['debug-label']}>Current Number:</span>
                            <span className={styles['debug-value']}>{currentNumber || 'None'}</span>
                        </div>
                        <div className={styles['debug-stat']}>
                            <span className={styles['debug-label']}>No-Go Stimulus:</span>
                            <span className={styles['debug-value']}>{goStimulusNumber}</span>
                        </div>
                        {Object.keys(hitReactionTimesRef.current).length > 0 && (
                            <div style={{ marginTop: '0.75rem', borderTop: '1px solid #ffff00', paddingTop: '0.75rem' }}>
                                <div style={{ color: '#ffff99', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                                    Reaction Times (ms):
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                                    {Object.entries(hitReactionTimesRef.current)
                                        .sort(([a], [b]) => Number(a) - Number(b))
                                        .map(([roundNum, reactionTime]) => (
                                            <div key={roundNum} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#ffff99' }}>Round {roundNum}:</span>
                                                <span style={{ color: '#fff' }}>{reactionTime}ms</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NegativeNumberTestRuntime;

