import '../../../globalcss/TestReal.css';
import NegativeNumberTestRuntime from "../testRuntimes/NegativeNumberTestRuntime";
import { usePageContext } from "../../../contexts/PageContext";
import Page from "../../../enums/Page";

function Test9Real() {
    const { setPage } = usePageContext();

    const handleComplete = () => {
        // Move to next test page (Test10)
        setPage(Page.Test10);
    };

    return (
        <div className="test-real">
            <NegativeNumberTestRuntime trial={false} onComplete={handleComplete} goStimulusNumber="1" testKey="test9" />
        </div>
    );
}

export default Test9Real;

