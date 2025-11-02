import '../../../globalcss/TestExplanation.css';

interface Test7ExplanationProps {
    onContinue?: () => void;
}

function Test7Explanation({ onContinue }: Test7ExplanationProps) {
    return (
        <>
            <h1 className="test-explanation">Test7Explanation</h1>
            <button 
                className="test-explanation-button" 
                onClick={onContinue}
            >
                Continue
            </button>
        </>
    )
}

export default Test7Explanation;

