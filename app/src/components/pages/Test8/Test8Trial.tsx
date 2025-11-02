import '../../../globalcss/TestTrial.css';
import NegativeShapeTestRuntime from "../testRuntimes/NegativeShapeTestRuntime";

interface Test8TrialProps {
    onComplete?: () => void;
}

function Test8Trial({ onComplete }: Test8TrialProps) {
    return <div className="test-trial">
        <NegativeShapeTestRuntime trial={true} onComplete={onComplete} goStimulusShape="triangle" testKey="test8" />
    </div>
}

export default Test8Trial;
