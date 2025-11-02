import {MAX_ROUNDS, ROUND_INTERVAL_IN_MS} from "../../../constants";
import {useState, useEffect, useRef} from "react";
import './Test1Runtime.css';

interface Test1RuntimeProps {
    collectMetrics: boolean;
    trial: boolean;
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

function Test1Runtime({ collectMetrics, trial }: Test1RuntimeProps) {
    const [round, setRound] = useState(0);
    const [hits, setHits] = useState(0);
    const [commissionMisses, setCommissionMisses] = useState(0);
    const [omissionMisses, setOmissionMisses] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const hitsRef = useRef(0);
    const commissionMissesRef = useRef(0);
    const omissionMissesRef = useRef(0);
    const spacePressedForRoundRef = useRef<number>(-1);
    const roundRef = useRef(0);
    const omissionCheckedForRoundRef = useRef<number>(-1);

    // Sync roundRef with round state
    useEffect(() => {
        roundRef.current = round;
    }, [round]);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setRound(prevRound => {
                // Check for omission miss: if previous round was triangle and space wasn't pressed
                // Only check once per round to prevent double counting
                if (prevRound >= 0 && omissionCheckedForRoundRef.current !== prevRound) {
                    const prevShape = SHAPE_SEQUENCE[prevRound % SHAPE_SEQUENCE.length];
                    if (prevShape === 'triangle' && spacePressedForRoundRef.current !== prevRound) {
                        const newOmissionMisses = omissionMissesRef.current + 1;
                        omissionMissesRef.current = newOmissionMisses;
                        setOmissionMisses(newOmissionMisses);
                    }
                    // Mark that we've checked this round to prevent duplicate checks
                    omissionCheckedForRoundRef.current = prevRound;
                }
                
                const newRound = prevRound + 1;
                roundRef.current = newRound;
                if (!trial && newRound >= MAX_ROUNDS) {
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                    alert("Test is done!");
                }
                return newRound;
            });
        }, ROUND_INTERVAL_IN_MS);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [trial]);

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
                
                // Get current shape based on current round
                const currentShape = currentRound >= 0 
                    ? SHAPE_SEQUENCE[currentRound % SHAPE_SEQUENCE.length]
                    : null;

                // Check if triangle is showing and record hit
                if (currentShape === 'triangle') {
                    const newHits = hitsRef.current + 1;
                    hitsRef.current = newHits;
                    setHits(newHits);
                    
                    if (newHits === 3) {
                        alert("Trial finished!");
                    }
                } else if (currentShape !== null) {
                    // Space pressed on wrong shape - record commission miss
                    const newCommissionMisses = commissionMissesRef.current + 1;
                    commissionMissesRef.current = newCommissionMisses;
                    setCommissionMisses(newCommissionMisses);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [trial]);

    const currentShape = round >= 0
        ? SHAPE_SEQUENCE[round % SHAPE_SEQUENCE.length]
        : null;

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
            <div className="shape-wrapper">
                <div className="small-circle"></div>
                {renderShape()}
                <div className="small-circle"></div>
            </div>
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