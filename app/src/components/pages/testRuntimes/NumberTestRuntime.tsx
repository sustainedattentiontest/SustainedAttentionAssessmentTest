import {MAX_ROUNDS, ROUND_INTERVAL_IN_MS, MAX_TOTAL_MISSES_FOR_TRIAL} from "../../../constants";
import {useState, useEffect, useRef} from "react";
import './NumberTestRuntime.css';
import { useSetTestMetrics } from '../../../contexts/TestMetricsContext';

type NumberType = '1' | '2' | '3';

interface NumberTestRuntimeProps {
    trial: boolean;
    onComplete?: () => void;
    goStimulusNumber: NumberType; // The number that should trigger a hit
    testKey: string; // The key to use when storing metrics in TestMetrics context (e.g., 'test4', 'test5')
}

// Function to generate a random number sequence for trial (infinite, no consecutive duplicates)
const generateTrialSequence = (length: number, goStimulusNumber: NumberType): NumberType[] => {
    const numbers: NumberType[] = ['1', '2', '3'];
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

// Function to generate sequence for real test: exactly 40% goStimulusNumber (8 out of 20), non-consecutive
const generateRealTestSequence = (goStimulusNumber: NumberType): NumberType[] => {
    const sequence: NumberType[] = new Array(20).fill(null);
    const allNumbers: NumberType[] = ['1', '2', '3'];
    const nonGoStimulusNumbers: NumberType[] = allNumbers.filter(n => n !== goStimulusNumber) as NumberType[];
    const GO_STIMULUS_COUNT = 8; // 40% of 20
    
    // Step 1: Determine positions for goStimulusNumber (ensuring non-consecutive)
    // Use a more reliable algorithm: try placing goStimulusNumber until we get exactly 8
    const goStimulusPositions: number[] = [];
    let attempts = 0;
    const maxAttempts = 1000;
    
    while (goStimulusPositions.length < GO_STIMULUS_COUNT && attempts < maxAttempts) {
        attempts++;
        const candidatePos = Math.floor(Math.random() * 20);
        
        // Check if position is valid (not consecutive to existing goStimulusNumber)
        const isValid = goStimulusPositions.every(gp => Math.abs(gp - candidatePos) > 1);
        
        if (isValid && !goStimulusPositions.includes(candidatePos)) {
            goStimulusPositions.push(candidatePos);
        }
    }
    
    // Sort positions for easier filling
    goStimulusPositions.sort((a, b) => a - b);
    
    // Place goStimulusNumber
    goStimulusPositions.forEach(pos => {
        sequence[pos] = goStimulusNumber;
    });
    
    // Step 2: Fill remaining positions with other numbers (non-consecutive)
    for (let i = 0; i < sequence.length; i++) {
        if (sequence[i] === null) {
            let availableNumbers = [...nonGoStimulusNumbers];
            
            // Check the number before this position to avoid consecutive duplicates
            if (i > 0 && sequence[i - 1] !== null && sequence[i - 1] !== goStimulusNumber) {
                availableNumbers = availableNumbers.filter(n => n !== sequence[i - 1]);
            }
            
            // Check the number after this position (if it's not goStimulusNumber) to avoid consecutive duplicates
            if (i < sequence.length - 1 && sequence[i + 1] !== null && sequence[i + 1] !== goStimulusNumber) {
                availableNumbers = availableNumbers.filter(n => n !== sequence[i + 1]);
            }
            
            // If no available numbers (edge case), default to '1'
            const selectedNumber = availableNumbers.length > 0 
                ? availableNumbers[Math.floor(Math.random() * availableNumbers.length)]
                : '1';
            
            sequence[i] = selectedNumber;
        }
    }
    
    return sequence;
};

function NumberTestRuntime({ trial, onComplete, goStimulusNumber, testKey }: NumberTestRuntimeProps) {
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

    // Initialize number sequence based on trial mode
    useEffect(() => {
        if (trial) {
            // For trial: generate a long sequence that we'll extend as needed
            numberSequenceRef.current = generateTrialSequence(100, goStimulusNumber);
            trialSequencePositionRef.current = 0;
        } else {
            // For real test: generate fixed sequence with exactly 8 goStimulusNumber
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
        if (!hasStarted) {
            // Initialize round start time when test starts (will be set when number actually renders)
            return;
        }

        intervalRef.current = setInterval(() => {
            setRound(prevRound => {
                // Check for omission miss: if previous round was goStimulusNumber and space wasn't pressed
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
                                extension[0] = extension[0] === '1' ? '2' : '1';
                            }
                            numberSequenceRef.current = [...numberSequenceRef.current, ...extension];
                        }
                        prevNumber = numberSequenceRef.current[prevNumberIndex];
                    } else {
                        prevNumber = numberSequenceRef.current[prevNumberIndex];
                    }
                    
                    if (prevNumber === goStimulusNumber && spacePressedForRoundRef.current !== prevRound) {
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
                if (!trial && newRound > MAX_ROUNDS) {
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
                                extension[0] = extension[0] === '1' ? '2' : '1';
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

                // Check if goStimulusNumber is showing and record hit
                if (currentNumber === goStimulusNumber) {
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
                } else if (currentNumber !== null) {
                    // Space pressed on wrong number - record commission miss
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
                    extension[0] = extension[0] === '1' ? '2' : '1';
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
        return <div className="number">{currentNumber}</div>;
    };

    const isDev = process.env.REACT_APP_IS_DEV === 'true';

    return (
        <div className="number-runtime-container">
            {(countdown !== null || countdownText !== null) && (
                <div className="countdown-overlay">
                    {countdownText && (
                        <div className="countdown-prefix-text">{countdownText}</div>
                    )}
                    {countdown !== null && (
                        <div className="countdown-text">{countdown}</div>
                    )}
                </div>
            )}
            {completionMessage && (
                <div className="countdown-overlay">
                    <div className="completion-message">{completionMessage}</div>
                </div>
            )}
            {restartMessage && (
                <div className="countdown-overlay">
                    <div className="completion-message">{restartMessage}</div>
                </div>
            )}
            {hasStarted && !completionMessage && !restartMessage && (
                <div className="number-wrapper">
                    <div className="small-circle"></div>
                    {renderNumber()}
                    <div className="small-circle"></div>
                </div>
            )}
            {isDev && (
                <div className="debug-menu">
                    <h3 className="debug-menu-title">Debug: Metrics</h3>
                    <div className="debug-menu-content">
                        <div className="debug-stat">
                            <span className="debug-label">Hits:</span>
                            <span className="debug-value">{hits}</span>
                        </div>
                        <div className="debug-stat">
                            <span className="debug-label">Commission Misses:</span>
                            <span className="debug-value">{commissionMisses}</span>
                        </div>
                        <div className="debug-stat">
                            <span className="debug-label">Omission Misses:</span>
                            <span className="debug-value">{omissionMisses}</span>
                        </div>
                        <div className="debug-stat">
                            <span className="debug-label">Total Misses:</span>
                            <span className="debug-value">{totalMisses}</span>
                        </div>
                        <div className="debug-stat">
                            <span className="debug-label">Round:</span>
                            <span className="debug-value">{round}</span>
                        </div>
                        <div className="debug-stat">
                            <span className="debug-label">Current Number:</span>
                            <span className="debug-value">{currentNumber || 'None'}</span>
                        </div>
                        <div className="debug-stat">
                            <span className="debug-label">Go Stimulus:</span>
                            <span className="debug-value">{goStimulusNumber}</span>
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

export default NumberTestRuntime;

