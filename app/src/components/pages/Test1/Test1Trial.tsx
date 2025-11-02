import '../../../globalcss/TestTrial.css';
import Test1Runtime from "./Test1Runtime";

function Test1Trial() {
    return <div className="test-trial">
        <Test1Runtime collectMetrics={false} trial={true} />
    </div>
}

export default Test1Trial;

