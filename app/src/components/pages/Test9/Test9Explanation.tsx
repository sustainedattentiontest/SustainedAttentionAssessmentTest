import '../../../globalcss/TestExplanation.css';

interface Test9ExplanationProps {
    onContinue?: () => void;
}

function Test9Explanation({ onContinue }: Test9ExplanationProps) {
    return (
        <>
            <h1 className="test-explanation">Test9Explanation</h1>
            <button 
                className="test-explanation-button" 
                onClick={onContinue}
            >
                Continue
            </button>
        </>
    )
}

export default Test9Explanation;

