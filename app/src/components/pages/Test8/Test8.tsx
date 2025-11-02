import { useState } from 'react';
import Test8Explanation from './Test8Explanation';
import Test8Trial from './Test8Trial';
import Test8Real from './Test8Real';
import TestPhase from '../../../enums/TestPhase';
import '../../../globalcss/TestExplanation.css';

function Test8() {
    const [phase, setPhase] = useState<TestPhase>(TestPhase.Explanation);

    const renderPhase = () => {
        switch (phase) {
            case TestPhase.Explanation:
                return <Test8Explanation onContinue={() => setPhase(TestPhase.Trial)} />;
            case TestPhase.Trial:
                return <Test8Trial />;
            case TestPhase.Real:
                return <Test8Real />;
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

export default Test8;

