import '../../../globalcss/TestTrial.css';
import NegativeNumberTestRuntime from "../testRuntimes/NegativeNumberTestRuntime";

interface Test10TrialProps {
    onComplete?: () => void;
}

function Test10Trial({ onComplete }: Test10TrialProps) {
    return <div className="test-trial">
        <NegativeNumberTestRuntime trial={true} onComplete={onComplete} goStimulusNumber="3" testKey="test10" />
    </div>
}

export default Test10Trial;

