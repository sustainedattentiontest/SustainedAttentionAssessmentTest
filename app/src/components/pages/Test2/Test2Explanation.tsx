import '../../../globalcss/TestExplanation.css';

interface Test2ExplanationProps {
    onContinue?: () => void;
}

function Test2Explanation({ onContinue }: Test2ExplanationProps) {
    return (
        <>
            <h1 className="test-explanation">Test2Explanation</h1>
            <button 
                className="test-explanation-button" 
                onClick={onContinue}
            >
                Continue
            </button>
        </>
    )
}

export default Test2Explanation;

