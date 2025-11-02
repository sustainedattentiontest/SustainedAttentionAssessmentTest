import '../../../globalcss/TestReal.css';
import NegativeNumberTestRuntime from "../testRuntimes/NegativeNumberTestRuntime";
import { usePageContext } from "../../../contexts/PageContext";
import Page from "../../../enums/Page";

function Test10Real() {
    const { setPage } = usePageContext();

    const handleComplete = () => {
        // Navigate to Results page after completing the final test
        setPage(Page.Results);
    };

    return (
        <div className="test-real">
            <NegativeNumberTestRuntime trial={false} onComplete={handleComplete} goStimulusNumber="3" testKey="test10" />
        </div>
    );
}

export default Test10Real;

