import '../../../globalcss/TestTrial.css';
import NegativeShapeTestRuntime from "../testRuntimes/NegativeShapeTestRuntime";

interface Test7TrialProps {
    onComplete?: () => void;
}

function Test7Trial({ onComplete }: Test7TrialProps) {
    return <div className="test-trial">
        <NegativeShapeTestRuntime trial={true} onComplete={onComplete} goStimulusShape="star" testKey="test7" />
    </div>
}

export default Test7Trial;
