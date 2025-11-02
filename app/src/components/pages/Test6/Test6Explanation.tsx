import '../../../globalcss/TestExplanation.css';

interface Test6ExplanationProps {
    onContinue?: () => void;
}

function Test6Explanation({ onContinue }: Test6ExplanationProps) {
    return (
        <>
            <h1 className="test-explanation">Test6Explanation</h1>
            <button 
                className="test-explanation-button" 
                onClick={onContinue}
            >
                Continue
            </button>
        </>
    )
}

export default Test6Explanation;

