import '../../../globalcss/TestExplanation.css';

interface Test7ExplanationProps {
    onContinue?: () => void;
}

function Test7Explanation({ onContinue }: Test7ExplanationProps) {
    return (
        <>
            <h1 className="test-explanation">
                <br/>
                <br/>
                The trial exercise is about to begin:
                <br/>
                <br/>
                You will be presented 3 shapes, every time and only when the <b className={'pink-text'}>STAR</b> does not pop up, click the spacebar.
                <br/>
                <br/>
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

export default Test7Explanation;

