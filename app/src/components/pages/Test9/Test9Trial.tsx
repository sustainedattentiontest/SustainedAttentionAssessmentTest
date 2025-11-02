import '../../../globalcss/TestTrial.css';
import NegativeNumberTestRuntime from "../testRuntimes/NegativeNumberTestRuntime";

interface Test9TrialProps {
    onComplete?: () => void;
}

function Test9Trial({ onComplete }: Test9TrialProps) {
    return <div className="test-trial">
        <NegativeNumberTestRuntime trial={true} onComplete={onComplete} goStimulusNumber="1" testKey="test9" />
    </div>
}

export default Test9Trial;

