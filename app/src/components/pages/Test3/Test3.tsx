import { useState } from 'react';
import Test3Explanation from './Test3Explanation';
import Test3Trial from './Test3Trial';
import Test3Real from './Test3Real';
import TestPhase from '../../../enums/TestPhase';
import '../../../globalcss/TestExplanation.css';

function Test3() {
    const [phase, setPhase] = useState<TestPhase>(TestPhase.Explanation);

    const renderPhase = () => {
        switch (phase) {
            case TestPhase.Explanation:
                return <Test3Explanation onContinue={() => setPhase(TestPhase.Trial)} />;
            case TestPhase.Trial:
                return <Test3Trial />;
            case TestPhase.Real:
                return <Test3Real />;
            default:
                return <div>Error: Unknown phase</div>;
        }
    };

    return (
        <div className={phase === TestPhase.Explanation ? 'test-explanation-container' : ''}>
            {renderPhase()}
        </div>
    );
}

export default Test3;

