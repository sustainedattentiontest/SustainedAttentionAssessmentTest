import '../../../globalcss/TestExplanation.css';

interface Test8ExplanationProps {
    onContinue?: () => void;
}

function Test8Explanation({ onContinue }: Test8ExplanationProps) {
    return (
        <>
            <h1 className="test-explanation">Test8Explanation</h1>
            <button 
                className="test-explanation-button" 
                onClick={onContinue}
            >
                Continue
            </button>
        </>
    )
}

export default Test8Explanation;

