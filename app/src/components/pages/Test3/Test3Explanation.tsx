import '../../../globalcss/TestExplanation.css';

interface Test3ExplanationProps {
    onContinue?: () => void;
}

function Test3Explanation({ onContinue }: Test3ExplanationProps) {
    return (
        <>
            <h1 className="test-explanation">Test3Explanation</h1>
            <button 
                className="test-explanation-button" 
                onClick={onContinue}
            >
                Continue
            </button>
        </>
    )
}

export default Test3Explanation;

