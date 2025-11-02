import '../../../globalcss/TestTrial.css';
import NumberTestRuntime from "../testRuntimes/NumberTestRuntime";

interface Test5TrialProps {
    onComplete?: () => void;
}

function Test5Trial({ onComplete }: Test5TrialProps) {
    return <div className="test-trial">
        <NumberTestRuntime trial={true} onComplete={onComplete} goStimulusNumber="2" testKey="test5" />
    </div>
}

export default Test5Trial;
