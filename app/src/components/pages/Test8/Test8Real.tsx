import '../../../globalcss/TestReal.css';
import NegativeShapeTestRuntime from "../testRuntimes/NegativeShapeTestRuntime";
import { usePageContext } from "../../../contexts/PageContext";
import Page from "../../../enums/Page";

function Test8Real() {
    const { setPage } = usePageContext();

    const handleComplete = () => {
        // Move to next test page (Test9)
        setPage(Page.Test9);
    };

    return (
        <div className="test-real">
            <NegativeShapeTestRuntime trial={false} onComplete={handleComplete} goStimulusShape="triangle" testKey="test8" />
        </div>
    );
}

export default Test8Real;
