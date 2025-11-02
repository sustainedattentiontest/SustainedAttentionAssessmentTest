import '../../../globalcss/TestTrial.css';
import ShapeTestRuntime from "../testRuntimes/ShapeTestRuntime";

interface Test1TrialProps {
    onComplete?: () => void;
}

function Test1Trial({ onComplete }: Test1TrialProps) {
    return <div className="test-trial">
        <ShapeTestRuntime trial={true} onComplete={onComplete} goStimulusShape="triangle" testKey="test1" />
    </div>
}

export default Test1Trial;

