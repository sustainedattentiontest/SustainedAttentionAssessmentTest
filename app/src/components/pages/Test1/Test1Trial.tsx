import '../../../globalcss/TestTrial.css';
import Test1Runtime from "./Test1Runtime";

interface Test1TrialProps {
    onComplete?: () => void;
}

function Test1Trial({ onComplete }: Test1TrialProps) {
    return <div className="test-trial">
        <Test1Runtime collectMetrics={false} trial={true} onComplete={onComplete} />
    </div>
}

export default Test1Trial;

