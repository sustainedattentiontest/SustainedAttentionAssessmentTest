import '../../../globalcss/TestExplanation.css';

interface Test9ExplanationProps {
    onContinue?: () => void;
}

function Test9Explanation({ onContinue }: Test9ExplanationProps) {
    return (
        <>
            <h1 className="test-explanation">
                <br/>
                <br/>
                The trial exercise is about to begin:
                <br/>
                <br/>
                You will be presented <b>4</b> numbers, every time and only when the number <b className={'yellow-text'}>1</b> does not pop up, click the spacebar.
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

export default Test9Explanation;

