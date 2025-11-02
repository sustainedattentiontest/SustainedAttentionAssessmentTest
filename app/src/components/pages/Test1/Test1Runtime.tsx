import {MAX_ROUNDS, ROUND_INTERVAL_IN_MS, MAX_TOTAL_MISSES_FOR_TRIAL} from "../../../constants";
import {useState, useEffect, useRef} from "react";
import './Test1Runtime.css';
import { useSetTestMetrics } from '../../../contexts/TestMetricsContext';

interface Test1RuntimeProps {
    collectMetrics: boolean;
    trial: boolean;
    onComplete?: () => void;
}

type ShapeType = 'circle' | 'star' | 'triangle';

// Function to generate a random shape sequence for trial (infinite, no consecutive duplicates)
const generateTrialSequence = (length: number): ShapeType[] => {
    const shapes: ShapeType[] = ['circle', 'star', 'triangle'];
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

// Function to generate sequence for real test: exactly 40% triangles (8 out of 20), non-consecutive
const generateRealTestSequence = (): ShapeType[] => {
    const sequence: ShapeType[] = new Array(20).fill(null);
    const nonTriangleShapes: ShapeType[] = ['circle', 'star'];
    const TRIANGLE_COUNT = 8; // 40% of 20
    
    // Step 1: Determine positions for triangles (ensuring non-consecutive)
    // Use a more reliable algorithm: try placing triangles until we get exactly 8
    const trianglePositions: number[] = [];
    let attempts = 0;
    const maxAttempts = 1000;
    
    while (trianglePositions.length < TRIANGLE_COUNT && attempts < maxAttempts) {
        attempts++;
        const candidatePos = Math.floor(Math.random() * 20);
        
        // Check if position is valid (not consecutive to existing triangles)
        const isValid = trianglePositions.every(tp => Math.abs(tp - candidatePos) > 1);
        
        if (isValid && !trianglePositions.includes(candidatePos)) {
            trianglePositions.push(candidatePos);
        }
    }
    
    // Sort positions for easier filling
    trianglePositions.sort((a, b) => a - b);
    
    // Place triangles
    trianglePositions.forEach(pos => {
        sequence[pos] = 'triangle';
    });
    
    // Step 2: Fill remaining positions with circle/star (non-consecutive)
    for (let i = 0; i < sequence.length; i++) {
        if (sequence[i] === null) {
            let availableShapes = [...nonTriangleShapes];
            
            // Check the shape before this position to avoid consecutive duplicates
            if (i > 0 && sequence[i - 1] !== null && sequence[i - 1] !== 'triangle') {
                availableShapes = availableShapes.filter(s => s !== sequence[i - 1]);
            }
            
            // Check the shape after this position (if it's not a triangle) to avoid consecutive duplicates
            if (i < sequence.length - 1 && sequence[i + 1] !== null && sequence[i + 1] !== 'triangle') {
                availableShapes = availableShapes.filter(s => s !== sequence[i + 1]);
            }
            
            // If no available shapes (edge case), default to circle
            const selectedShape = availableShapes.length > 0 
                ? availableShapes[Math.floor(Math.random() * availableShapes.length)]
                : 'circle';
            
            sequence[i] = selectedShape;
        }
    }
    
    return sequence;
};

function Test1Runtime({ collectMetrics, trial, onComplete }: Test1RuntimeProps) {
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

    // Initialize shape sequence based on trial mode
    useEffect(() => {
        if (trial) {
            // For trial: generate a long sequence that we'll extend as needed
            shapeSequenceRef.current = generateTrialSequence(100);
            trialSequencePositionRef.current = 0;
        } else {
            // For real test: generate fixed sequence with exactly 8 triangles
            shapeSequenceRef.current = generateRealTestSequence();
        }
    }, [trial]);

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
            shapeSequenceRef.current = generateTrialSequence(100);
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
        if (!hasStarted) {
            // Initialize round start time when test starts (will be set when shape actually renders)
            return;
        }

        intervalRef.current = setInterval(() => {
            setRound(prevRound => {
                // Check for omission miss: if previous round was triangle and space wasn't pressed
                // Only check once per round to prevent double counting
                if (prevRound >= 1 && omissionCheckedForRoundRef.current !== prevRound) {
                    const prevShapeIndex = prevRound - 1;
                    let prevShape: ShapeType;
                    if (trial) {
                        // For trial: extend sequence if needed
                        if (prevShapeIndex >= shapeSequenceRef.current.length) {
                            const extension = generateTrialSequence(50);
                            const lastShape = shapeSequenceRef.current[shapeSequenceRef.current.length - 1];
                            // Ensure first shape of extension is not the same as last
                            if (extension[0] === lastShape) {
                                extension[0] = extension[0] === 'circle' ? 'star' : 'circle';
                            }
                            shapeSequenceRef.current = [...shapeSequenceRef.current, ...extension];
                        }
                        prevShape = shapeSequenceRef.current[prevShapeIndex];
                    } else {
                        prevShape = shapeSequenceRef.current[prevShapeIndex];
                    }
                    
                    if (prevShape === 'triangle' && spacePressedForRoundRef.current !== prevRound) {
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
                if (!trial && newRound > MAX_ROUNDS) {
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                    // Store metrics in context for real test completion
                    setTestMetrics('test1', {
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
    }, [trial, hasStarted, onComplete]);

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
                            const extension = generateTrialSequence(50);
                            const lastShape = shapeSequenceRef.current[shapeSequenceRef.current.length - 1];
                            // Ensure first shape of extension is not the same as last
                            if (extension[0] === lastShape) {
                                extension[0] = extension[0] === 'circle' ? 'star' : 'circle';
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

                // Check if triangle is showing and record hit
                if (currentShape === 'triangle') {
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
                } else if (currentShape !== null) {
                    // Space pressed on wrong shape - record commission miss
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
    }, [trial, onComplete]);

    // Get current shape based on round
    let currentShape: ShapeType | null = null;
    if (round >= 1) {
        const shapeIndex = round - 1;
        if (trial) {
            // For trial: extend sequence if needed
            if (shapeIndex >= shapeSequenceRef.current.length) {
                const extension = generateTrialSequence(50);
                const lastShape = shapeSequenceRef.current[shapeSequenceRef.current.length - 1];
                // Ensure first shape of extension is not the same as last
                if (extension[0] === lastShape) {
                    extension[0] = extension[0] === 'circle' ? 'star' : 'circle';
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

export default Test1Runtime;