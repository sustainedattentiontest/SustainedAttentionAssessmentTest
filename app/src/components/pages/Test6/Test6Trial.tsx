import '../../../globalcss/TestTrial.css';
import NegativeShapeTestRuntime from "../testRuntimes/NegativeShapeTestRuntime";

interface Test6TrialProps {
    onComplete?: () => void;
}

function Test6Trial({ onComplete }: Test6TrialProps) {
    return <div className="test-trial">
        <NegativeShapeTestRuntime trial={true} onComplete={onComplete} goStimulusShape="circle" testKey="test6" />
    </div>
}

export default Test6Trial;
