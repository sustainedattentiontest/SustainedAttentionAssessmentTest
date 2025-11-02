import { useState } from 'react';
import Test4Explanation from './Test4Explanation';
import Test4Trial from './Test4Trial';
import Test4Real from './Test4Real';
import TestPhase from '../../../enums/TestPhase';
import '../../../globalcss/TestExplanation.css';

function Test4() {
    const [phase, setPhase] = useState<TestPhase>(TestPhase.Explanation);

    const renderPhase = () => {
        switch (phase) {
            case TestPhase.Explanation:
                return <Test4Explanation onContinue={() => setPhase(TestPhase.Trial)} />;
            case TestPhase.Trial:
                return <Test4Trial />;
            case TestPhase.Real:
                return <Test4Real />;
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

export default Test4;

