import '../../../globalcss/TestExplanation.css';

interface Test5ExplanationProps {
    onContinue?: () => void;
}

function Test5Explanation({ onContinue }: Test5ExplanationProps) {
    return (
        <>
            <h1 className="test-explanation">Test5Explanation</h1>
            <button 
                className="test-explanation-button" 
                onClick={onContinue}
            >
                Continue
            </button>
        </>
    )
}

export default Test5Explanation;

