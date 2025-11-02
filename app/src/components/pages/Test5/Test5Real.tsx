import '../../../globalcss/TestReal.css';
import NumberTestRuntime from "../testRuntimes/NumberTestRuntime";
import { usePageContext } from "../../../contexts/PageContext";
import Page from "../../../enums/Page";

function Test5Real() {
    const { setPage } = usePageContext();

    const handleComplete = () => {
        // Move to next test page (Test6)
        setPage(Page.Test6);
    };

    return (
        <div className="test-real">
            <NumberTestRuntime trial={false} onComplete={handleComplete} goStimulusNumber="2" testKey="test5" />
        </div>
    );
}

export default Test5Real;
