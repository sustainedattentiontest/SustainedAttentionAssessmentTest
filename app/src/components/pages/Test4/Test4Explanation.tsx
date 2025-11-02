import '../../../globalcss/TestExplanation.css';

interface Test4ExplanationProps {
    onContinue?: () => void;
}

function Test4Explanation({ onContinue }: Test4ExplanationProps) {
    return (
        <>
            <h1 className="test-explanation">Test4Explanation</h1>
            <button 
                className="test-explanation-button" 
                onClick={onContinue}
            >
                Continue
            </button>
        </>
    )
}

export default Test4Explanation;

