import '../../../globalcss/TestExplanation.css';

interface Test10ExplanationProps {
    onContinue?: () => void;
}

function Test10Explanation({ onContinue }: Test10ExplanationProps) {
    return (
        <>
            <h1 className="test-explanation">Test10Explanation</h1>
            <button 
                className="test-explanation-button" 
                onClick={onContinue}
            >
                Continue
            </button>
        </>
    )
}

export default Test10Explanation;

