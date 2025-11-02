import '../../../globalcss/TestTrial.css';
import ShapeTestRuntime from "../testRuntimes/ShapeTestRuntime";

interface Test3TrialProps {
    onComplete?: () => void;
}

function Test3Trial({ onComplete }: Test3TrialProps) {
    return <div className="test-trial">
        <ShapeTestRuntime trial={true} onComplete={onComplete} goStimulusShape="circle" testKey="test3" />
    </div>
}

export default Test3Trial;
