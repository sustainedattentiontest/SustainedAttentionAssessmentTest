import '../../../globalcss/TestTrial.css';
import NumberTestRuntime from "../testRuntimes/NumberTestRuntime";

interface Test4TrialProps {
    onComplete?: () => void;
}

function Test4Trial({ onComplete }: Test4TrialProps) {
    return <div className="test-trial">
        <NumberTestRuntime trial={true} onComplete={onComplete} goStimulusNumber="1" testKey="test4" />
    </div>
}

export default Test4Trial;
