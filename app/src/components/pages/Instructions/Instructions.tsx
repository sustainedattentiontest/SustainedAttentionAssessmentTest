import { usePageContext } from '../../../contexts/PageContext';
import Page from '../../../enums/Page';
import '../../../globalcss/TestExplanation.css';

function Instructions() {
    const { setPage } = usePageContext();

    const handleContinue = () => {
        setPage(Page.Test1);
    };

    return (
        <div className="test-explanation-container">
            <h1 className="test-explanation">Instructions</h1>
            <p style={{
                color: '#fff',
                fontSize: '1.2rem',
                textAlign: 'center',
                maxWidth: '800px',
                marginBottom: '2rem'
            }}>
                This test includes 10 mini-tests, each of which begins with a quick trial exercise that is correspondent to the mini-test that follows.
            </p>
            <button 
                className="test-explanation-button" 
                onClick={handleContinue}
            >
                Continue
            </button>
        </div>
    );
}

export default Instructions;

