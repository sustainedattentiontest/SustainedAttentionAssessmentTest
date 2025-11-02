import {MAX_ROUNDS, ROUND_INTERVAL_IN_MS, MAX_TOTAL_MISSES_FOR_TRIAL} from "../../../constants";
import {useState, useEffect, useRef} from "react";
import './NegativeShapeTestRuntime.css';
import { useSetTestMetrics } from '../../../contexts/TestMetricsContext';

type ShapeType = 'circle' | 'star' | 'triangle' | 'square';

interface NegativeShapeTestRuntimeProps {
    trial: boolean;
    onComplete?: () => void;
    goStimulusShape: ShapeType; // The shape that should NOT be pressed (pressing it = commission miss)
    testKey: string; // The key to use when storing metrics in TestMetrics context (e.g., 'test6', 'test7')
}

// Function to generate a random shape sequence for trial (infinite, no consecutive duplicates)
const generateTrialSequence = (length: number, goStimulusShape: ShapeType): ShapeType[] => {
    const shapes: ShapeType[] = ['circle', 'star', 'triangle', 'square'];
    const sequence: ShapeType[] = [];
    
    let lastShape: ShapeType | null = null;
    for (let i = 0; i < length; i++) {
        let availableShapes = shapes;
        if (lastShape !== null) {
            // Exclude the last shape to prevent consecutive duplicates
            availableShapes = shapes.filter(s => s !== lastShape);
        }
        const randomIndex = Math.floor(Math.random() * availableShapes.length);
        const selectedShape = availableShapes[randomIndex];
        sequence.push(selectedShape);
        lastShape = selectedShape;
    }
    
    return sequence;
};

// Function to generate sequence for real test:
// - Each of the 4 shapes appears exactly 5 times (25% each)
// - goStimulusShape is the ONLY no-go stimulus
// - All other shapes (square + 2 others) are hit shapes
// - No shape appears consecutively (all shapes)
const generateRealTestSequence = (goStimulusShape: ShapeType): ShapeType[] => {
    const sequence: (ShapeType | null)[] = new Array(20).fill(null);
    const allShapes: ShapeType[] = ['circle', 'star', 'triangle', 'square'];
    const hitShapes: ShapeType[] = allShapes.filter(s => s !== goStimulusShape) as ShapeType[]; // All shapes except goStimulusShape are hit shapes
    
    const SHAPE_COUNT = 5; // 25% of 20 for each shape
    
    // Step 1: Determine positions for all shapes ensuring non-consecutive placement
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
        
        // Create arrays to track positions for each shape
        const goStimulusPositions: number[] = [];
        const hitShapePositions: { [key: string]: number[] } = {
            [hitShapes[0]]: [],
            [hitShapes[1]]: [],
            [hitShapes[2]]: []
        };
        
        // Generate candidate positions for all shapes
        const allPositions = Array.from({ length: 20 }, (_, i) => i);
        
        // Shuffle positions
        const shuffledPositions = [...allPositions].sort(() => Math.random() - 0.5);
        
        // Helper function to check if position is consecutive to any existing positions
        const isConsecutive = (pos: number, allPositionArrays: number[][]): boolean => {
            return allPositionArrays.some(arr => arr.some(p => Math.abs(p - pos) === 1));
        };
        
        // Collect all position arrays for consecutive checking
        const getAllPositionArrays = (): number[][] => {
            return [goStimulusPositions, ...Object.values(hitShapePositions)];
        };
        
        // Try to place goStimulusShape first (25% = 5 positions)
        for (const pos of shuffledPositions) {
            if (goStimulusPositions.length >= SHAPE_COUNT) break;
            if (isConsecutive(pos, getAllPositionArrays())) continue;
            goStimulusPositions.push(pos);
        }
        
        // If we didn't get enough goStimulus positions, try again
        if (goStimulusPositions.length < SHAPE_COUNT) continue;
        
        // Try to place each hit shape (25% each = 5 positions)
        let allHitShapesPlaced = true;
        
        for (let i = 0; i < hitShapes.length; i++) {
            const hitShape = hitShapes[i];
            
            for (const pos of shuffledPositions) {
                if (hitShapePositions[hitShape].length >= SHAPE_COUNT) break;
                if (goStimulusPositions.includes(pos)) continue;
                // Check if position is already taken by another hit shape
                const isTaken = Object.values(hitShapePositions).some(positions => positions.includes(pos));
                if (isTaken) continue;
                if (isConsecutive(pos, getAllPositionArrays())) continue;
                hitShapePositions[hitShape].push(pos);
            }
            
            if (hitShapePositions[hitShape].length < SHAPE_COUNT) {
                allHitShapesPlaced = false;
                break;
            }
        }
        
        // Check if we successfully placed all shapes (5 each)
        if (goStimulusPositions.length === SHAPE_COUNT && allHitShapesPlaced) {
            
            // Place all shapes in sequence
            goStimulusPositions.forEach(pos => {
                sequence[pos] = goStimulusShape;
            });
            Object.entries(hitShapePositions).forEach(([shape, positions]) => {
                positions.forEach(pos => {
                    sequence[pos] = shape as ShapeType;
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
        // Use backtracking to guarantee both requirements: 5 of each shape, no consecutive
        const shapeCounts: { [key: string]: number } = {
            [goStimulusShape]: SHAPE_COUNT
        };
        allShapes.filter(s => s !== goStimulusShape).forEach((shape) => {
            shapeCounts[shape] = SHAPE_COUNT;
        });
        
        const backtrackSequence: (ShapeType | null)[] = new Array(20).fill(null);
        
        const backtrack = (pos: number): boolean => {
            if (pos === 20) {
                // Verify each shape appears exactly 5 times
                const counts: { [key: string]: number } = {
                    'circle': 0,
                    'star': 0,
                    'triangle': 0,
                    'square': 0
                };
                backtrackSequence.forEach(shape => {
                    if (shape) counts[shape]++;
                });
                return allShapes.every(shape => counts[shape] === SHAPE_COUNT);
            }
            
            // Try each shape at this position
            const shuffledShapes = [...allShapes].sort(() => Math.random() - 0.5);
            for (const shape of shuffledShapes) {
                // Skip if no more of this shape available
                if (shapeCounts[shape] <= 0) continue;
                // Skip if consecutive duplicate
                if (pos > 0 && backtrackSequence[pos - 1] === shape) continue;
                
                // Try placing this shape
                backtrackSequence[pos] = shape;
                shapeCounts[shape]--;
                
                if (backtrack(pos + 1)) {
                    return true;
                }
                
                // Backtrack
                backtrackSequence[pos] = null;
                shapeCounts[shape]++;
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
        // Double-check: verify each shape appears exactly 5 times and no consecutive
        const counts: { [key: string]: number } = {
            'circle': 0,
            'star': 0,
            'triangle': 0,
            'square': 0
        };
        let hasConsecutive = false;
        
        for (let i = 0; i < sequence.length; i++) {
            const shape = sequence[i];
            if (shape) {
                counts[shape]++;
            }
            if (i > 0 && sequence[i] === sequence[i - 1]) {
                hasConsecutive = true;
            }
        }
        
        const allShapesCorrect = allShapes.every(shape => counts[shape] === SHAPE_COUNT);
        
        if (allShapesCorrect && !hasConsecutive) {
            return sequence.filter((s): s is ShapeType => s !== null);
        }
    }
    
    // Ultimate fallback: simple greedy with verification
    const finalSequence: ShapeType[] = [];
    const finalShapeCounts: { [key: string]: number } = {
        'circle': SHAPE_COUNT,
        'star': SHAPE_COUNT,
        'triangle': SHAPE_COUNT,
        'square': SHAPE_COUNT
    };
    
    for (let i = 0; i < 20; i++) {
        const availableShapes = allShapes.filter(shape => {
            if (finalShapeCounts[shape] <= 0) return false;
            if (i > 0 && finalSequence[i - 1] === shape) return false;
            return true;
        });
        
        if (availableShapes.length === 0) {
            // This shouldn't happen, but if it does, use any remaining shape
            const remaining = allShapes.filter(s => finalShapeCounts[s] > 0);
            if (remaining.length > 0) {
                const selected = remaining[0];
                finalSequence.push(selected);
                finalShapeCounts[selected]--;
            }
        } else {
            const selected = availableShapes[Math.floor(Math.random() * availableShapes.length)];
            finalSequence.push(selected);
            finalShapeCounts[selected]--;
        }
    }
    
    // Verify the final sequence
    const counts: { [key: string]: number } = {
        'circle': 0,
        'star': 0,
        'triangle': 0,
        'square': 0
    };
    let hasConsecutive = false;
    
    for (let i = 0; i < finalSequence.length; i++) {
        counts[finalSequence[i]]++;
        if (i > 0 && finalSequence[i] === finalSequence[i - 1]) {
            hasConsecutive = true;
        }
    }
    
    // If verification fails, log warning but return sequence anyway (should rarely happen)
    if (!allShapes.every(shape => counts[shape] === SHAPE_COUNT) || hasConsecutive) {
        console.warn('NegativeShapeTestRuntime: Sequence generation verification failed, but returning sequence anyway');
    }
    
    return finalSequence;
};

function NegativeShapeTestRuntime({ trial, onComplete, goStimulusShape, testKey }: NegativeShapeTestRuntimeProps) {
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
    const shapeSequenceRef = useRef<ShapeType[]>([]);
    const trialSequencePositionRef = useRef<number>(0);
    const roundStartTimeRef = useRef<number>(performance.now()); // Track when current round started (high precision)
    const hitReactionTimesRef = useRef<{ [round: number]: number }>({}); // Store reaction times for each hit by round
    const roundStateRef = useRef<number>(1); // Track round to detect changes for RAF timing
    const completedRef = useRef<boolean>(false); // Track if test has completed to prevent infinite loops

    // Initialize shape sequence based on trial mode
    useEffect(() => {
        if (trial) {
            // For trial: generate a long sequence that we'll extend as needed
            shapeSequenceRef.current = generateTrialSequence(100, goStimulusShape);
            trialSequencePositionRef.current = 0;
        } else {
            // For real test: generate fixed sequence with exactly 8 goStimulusShape
            shapeSequenceRef.current = generateRealTestSequence(goStimulusShape);
        }
    }, [trial, goStimulusShape]);

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
            shapeSequenceRef.current = generateTrialSequence(100, goStimulusShape);
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

    // Set round start time when shape is actually visible on screen (after render)
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
            // Initialize round start time when test starts (will be set when shape actually renders)
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
                // Check for omission miss: if previous round was goStimulusShape and space wasn't pressed
                // Only check once per round to prevent double counting
                if (prevRound >= 1 && omissionCheckedForRoundRef.current !== prevRound) {
                    const prevShapeIndex = prevRound - 1;
                    let prevShape: ShapeType;
                    if (trial) {
                        // For trial: extend sequence if needed
                        if (prevShapeIndex >= shapeSequenceRef.current.length) {
                            const extension = generateTrialSequence(50, goStimulusShape);
                            const lastShape = shapeSequenceRef.current[shapeSequenceRef.current.length - 1];
                            // Ensure first shape of extension is not the same as last
                            if (extension[0] === lastShape) {
                                const allShapes: ShapeType[] = ['circle', 'star', 'triangle', 'square'];
                                const alternativeShapes = allShapes.filter(s => s !== lastShape);
                                extension[0] = alternativeShapes[Math.floor(Math.random() * alternativeShapes.length)];
                            }
                            shapeSequenceRef.current = [...shapeSequenceRef.current, ...extension];
                        }
                        prevShape = shapeSequenceRef.current[prevShapeIndex];
                    } else {
                        prevShape = shapeSequenceRef.current[prevShapeIndex];
                    }
                    
                    // In negative test: omission miss when any hit shape (not goStimulusShape) appears and space wasn't pressed
                    if (prevShape !== goStimulusShape && spacePressedForRoundRef.current !== prevRound) {
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
                // Round start time will be set when shape actually renders (see useEffect below)
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
    }, [trial, hasStarted, onComplete, goStimulusShape, testKey, setTestMetrics]);

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
                
                // Get current shape based on current round (1-indexed, so subtract 1 for array index)
                let currentShape: ShapeType | null = null;
                if (currentRound >= 1) {
                    const shapeIndex = currentRound - 1;
                    if (trial) {
                        // For trial: extend sequence if needed
                        if (shapeIndex >= shapeSequenceRef.current.length) {
                            const extension = generateTrialSequence(50, goStimulusShape);
                            const lastShape = shapeSequenceRef.current[shapeSequenceRef.current.length - 1];
                            // Ensure first shape of extension is not the same as last
                            if (extension[0] === lastShape) {
                                const allShapes: ShapeType[] = ['circle', 'star', 'triangle', 'square'];
                                const alternativeShapes = allShapes.filter(s => s !== lastShape);
                                extension[0] = alternativeShapes[Math.floor(Math.random() * alternativeShapes.length)];
                            }
                            shapeSequenceRef.current = [...shapeSequenceRef.current, ...extension];
                        }
                        currentShape = shapeSequenceRef.current[shapeIndex];
                    } else {
                        currentShape = shapeIndex < shapeSequenceRef.current.length 
                            ? shapeSequenceRef.current[shapeIndex]
                            : null;
                    }
                }

                // In negative test: hit when pressing on any hit shape (not goStimulusShape)
                if (currentShape !== null && currentShape !== goStimulusShape) {
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
                } else if (currentShape === goStimulusShape) {
                    // In negative test: commission miss when pressing on goStimulusShape (the ONLY "no-go" stimulus)
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
    }, [trial, onComplete, goStimulusShape]);

    // Get current shape based on round
    let currentShape: ShapeType | null = null;
    if (round >= 1) {
        const shapeIndex = round - 1;
        if (trial) {
            // For trial: extend sequence if needed
            if (shapeIndex >= shapeSequenceRef.current.length) {
                const extension = generateTrialSequence(50, goStimulusShape);
                const lastShape = shapeSequenceRef.current[shapeSequenceRef.current.length - 1];
                // Ensure first shape of extension is not the same as last
                if (extension[0] === lastShape) {
                    const allShapes: ShapeType[] = ['circle', 'star', 'triangle', 'square'];
                    const alternativeShapes = allShapes.filter(s => s !== lastShape);
                    extension[0] = alternativeShapes[Math.floor(Math.random() * alternativeShapes.length)];
                }
                shapeSequenceRef.current = [...shapeSequenceRef.current, ...extension];
            }
            currentShape = shapeSequenceRef.current[shapeIndex];
        } else {
            currentShape = shapeIndex < shapeSequenceRef.current.length 
                ? shapeSequenceRef.current[shapeIndex]
                : null;
        }
    }

    const totalMisses = commissionMisses + omissionMisses;

    const renderShape = () => {
        if (!currentShape) return null;

        switch (currentShape) {
            case 'circle':
                return <div className="shape circle"></div>;
            case 'star':
                return <div className="shape star">★</div>;
            case 'triangle':
                return <div className="shape triangle"></div>;
            case 'square':
                return <div className="shape square"></div>;
            default:
                return null;
        }
    };

    const isDev = process.env.REACT_APP_IS_DEV === 'true';

    return (
        <div className="test1-runtime-container">
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
                <div className="shape-wrapper">
                    <div className="small-circle"></div>
                    {renderShape()}
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
                            <span className="debug-label">Current Shape:</span>
                            <span className="debug-value">{currentShape || 'None'}</span>
                        </div>
                        <div className="debug-stat">
                            <span className="debug-label">No-Go Stimulus:</span>
                            <span className="debug-value">{goStimulusShape}</span>
                        </div>
                        {Object.keys(hitReactionTimesRef.current).length > 0 && (
                            <div style={{ marginTop: '0.75rem', borderTop: '1px solid #ff66ff', paddingTop: '0.75rem' }}>
                                <div style={{ color: '#ff99ff', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                                    Reaction Times (ms):
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                                    {Object.entries(hitReactionTimesRef.current)
                                        .sort(([a], [b]) => Number(a) - Number(b))
                                        .map(([roundNum, reactionTime]) => (
                                            <div key={roundNum} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#ff99ff' }}>Round {roundNum}:</span>
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

export default NegativeShapeTestRuntime;


