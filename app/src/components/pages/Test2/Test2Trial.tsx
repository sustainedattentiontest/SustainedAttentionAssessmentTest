import '../../../globalcss/TestTrial.css';
import ShapeTestRuntime from "../testRuntimes/ShapeTestRuntime";

interface Test2TrialProps {
    onComplete?: () => void;
}

function Test2Trial({ onComplete }: Test2TrialProps) {
    return <div className="test-trial">
        <ShapeTestRuntime trial={true} onComplete={onComplete} goStimulusShape="star" testKey="test2" />
    </div>
}

export default Test2Trial;
