import '../../../globalcss/TestExplanation.css';

interface Test1ExplanationProps {
    onContinue?: () => void;
}

function Test1Explanation({ onContinue }: Test1ExplanationProps) {
    return (
        <>
            <h1 className="test-explanation">This is the test explanation phase 1</h1>
            <button 
                className="test-explanation-button" 
                onClick={onContinue}
            >
                Continue
            </button>
        </>
    )
}

export default Test1Explanation;

