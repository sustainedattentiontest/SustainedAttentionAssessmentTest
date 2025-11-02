import '../../../globalcss/TestReal.css';
import NumberTestRuntime from "../testRuntimes/NumberTestRuntime";
import { usePageContext } from "../../../contexts/PageContext";
import Page from "../../../enums/Page";

function Test4Real() {
    const { setPage } = usePageContext();

    const handleComplete = () => {
        // Move to next test page (Test5)
        setPage(Page.Test5);
    };

    return (
        <div className="test-real">
            <NumberTestRuntime trial={false} onComplete={handleComplete} goStimulusNumber="1" testKey="test4" />
        </div>
    );
}

export default Test4Real;
