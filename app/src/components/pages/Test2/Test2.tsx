import { useState } from 'react';
import Test2Explanation from './Test2Explanation';
import Test2Trial from './Test2Trial';
import Test2Real from './Test2Real';
import TestPhase from '../../../enums/TestPhase';
import '../../../globalcss/TestExplanation.css';

function Test2() {
    const [phase, setPhase] = useState<TestPhase>(TestPhase.Explanation);

    const renderPhase = () => {
        switch (phase) {
            case TestPhase.Explanation:
                return <Test2Explanation onContinue={() => setPhase(TestPhase.Trial)} />;
            case TestPhase.Trial:
                return <Test2Trial />;
            case TestPhase.Real:
                return <Test2Real />;
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

export default Test2;

