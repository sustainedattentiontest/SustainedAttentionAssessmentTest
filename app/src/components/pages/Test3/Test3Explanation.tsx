import '../../../globalcss/TestExplanation.css';

interface Test3ExplanationProps {
    onContinue?: () => void;
}

function Test3Explanation({ onContinue }: Test3ExplanationProps) {
    return (
        <>
            <h1 className="test-explanation">The trial exercise is about to begin:
                <br />
                <br />
                You will be presented 3 shapes<br />
                <br />Every time and only when the <b className={'pink-text'}>CIRCLE</b> pops up, click the spacebar.
                If not, wait for the shape to change.
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

export default Test3Explanation;

