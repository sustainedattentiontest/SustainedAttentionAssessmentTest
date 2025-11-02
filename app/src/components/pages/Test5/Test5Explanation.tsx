import '../../../globalcss/TestExplanation.css';

interface Test5ExplanationProps {
    onContinue?: () => void;
}

function Test5Explanation({ onContinue }: Test5ExplanationProps) {
    return (
        <>
            <h1 className="test-explanation">
                <br />
                <br />
                The trial exercise is about to begin:
                <br />
                <br />
                You will be presented 3 numbers, every time and only when the number <b className={"yellow-text"}>2</b> pops up, click the spacebar. If not, wait for the shape to change.
                <br />
                <br />
                Press continue to begin the trial exercise.
            </h1>
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

