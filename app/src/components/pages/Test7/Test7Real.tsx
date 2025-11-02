import '../../../globalcss/TestReal.css';
import NegativeShapeTestRuntime from "../testRuntimes/NegativeShapeTestRuntime";
import { usePageContext } from "../../../contexts/PageContext";
import Page from "../../../enums/Page";

function Test7Real() {
    const { setPage } = usePageContext();

    const handleComplete = () => {
        // Move to next test page (Test8)
        setPage(Page.Test8);
    };

    return (
        <div className="test-real">
            <NegativeShapeTestRuntime trial={false} onComplete={handleComplete} goStimulusShape="star" testKey="test7" />
        </div>
    );
}

export default Test7Real;
