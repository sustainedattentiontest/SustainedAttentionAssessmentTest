import {MAX_ROUNDS, ROUND_INTERVAL_IN_MS} from "../../../constants";
import {useState, useEffect, useRef} from "react";
import './Test1Runtime.css';

interface Test1RuntimeProps {
    collectMetrics: boolean;
    trial: boolean;
    onComplete?: () => void;
}

type ShapeType = 'circle' | 'star' | 'triangle';

// Shape sequence as specified by the user (exactly 20 rounds)
// Modified to ensure no consecutive duplicate shapes
const SHAPE_SEQUENCE: ShapeType[] = [
    'circle', 'star', 'triangle', 'star', 'circle',
    'triangle', 'star', 'circle', 'triangle', 'star',
    'circle', 'triangle', 'star', 'circle', 'triangle',
    'star', 'circle', 'triangle', 'star', 'circle'
];

function Test1Runtime({ collectMetrics, trial, onComplete }: Test1RuntimeProps) {
    const [round, setRound] = useState(1);
    const [hits, setHits] = useState(0);
    const [commissionMisses, setCommissionMisses] = useState(0);
    const [omissionMisses, setOmissionMisses] = useState(0);
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

    useEffect(() => {
        if (!hasStarted) return;

        intervalRef.current = setInterval(() => {
            setRound(prevRound => {
                // Check for omission miss: if previous round was triangle and space wasn't pressed
                // Only check once per round to prevent double counting
                if (prevRound >= 1 && omissionCheckedForRoundRef.current !== prevRound) {
                    const prevShape = SHAPE_SEQUENCE[(prevRound - 1) % SHAPE_SEQUENCE.length];
                    if (prevShape === 'triangle' && spacePressedForRoundRef.current !== prevRound) {
                        const newOmissionMisses = omissionMissesRef.current + 1;
                        omissionMissesRef.current = newOmissionMisses;
                        setOmissionMisses(newOmissionMisses);
                        
                        // Check if trial should restart due to too many misses
                        if (trial) {
                            const totalMisses = commissionMissesRef.current + newOmissionMisses;
                            if (totalMisses >= 3) {
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
                if (!trial && newRound > MAX_ROUNDS) {
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
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
                const currentShape = currentRound >= 1 
                    ? SHAPE_SEQUENCE[(currentRound - 1) % SHAPE_SEQUENCE.length]
                    : null;

                // Check if triangle is showing and record hit
                if (currentShape === 'triangle') {
                    const newHits = hitsRef.current + 1;
                    hitsRef.current = newHits;
                    setHits(newHits);
                    
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
                        if (totalMisses >= 3) {
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

    const currentShape = round >= 1
        ? SHAPE_SEQUENCE[(round - 1) % SHAPE_SEQUENCE.length]
        : null;

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
                    </div>
                </div>
            )}
        </div>
    );
}

export default Test1Runtime;