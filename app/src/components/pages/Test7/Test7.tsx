import { useState } from 'react';
import Test7Explanation from './Test7Explanation';
import Test7Trial from './Test7Trial';
import Test7Real from './Test7Real';
import TestPhase from '../../../enums/TestPhase';
import '../../../globalcss/TestExplanation.css';

function Test7() {
    const [phase, setPhase] = useState<TestPhase>(TestPhase.Explanation);

    const renderPhase = () => {
        switch (phase) {
            case TestPhase.Explanation:
                return <Test7Explanation onContinue={() => setPhase(TestPhase.Trial)} />;
            case TestPhase.Trial:
                return <Test7Trial />;
            case TestPhase.Real:
                return <Test7Real />;
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

export default Test7;

