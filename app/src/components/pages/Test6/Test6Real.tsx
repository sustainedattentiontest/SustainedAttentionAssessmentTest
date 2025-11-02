import '../../../globalcss/TestReal.css';
import NegativeShapeTestRuntime from "../testRuntimes/NegativeShapeTestRuntime";
import { usePageContext } from "../../../contexts/PageContext";
import Page from "../../../enums/Page";

function Test6Real() {
    const { setPage } = usePageContext();

    const handleComplete = () => {
        // Move to next test page (Test7)
        setPage(Page.Test7);
    };

    return (
        <div className="test-real">
            <NegativeShapeTestRuntime trial={false} onComplete={handleComplete} goStimulusShape="circle" testKey="test6" />
        </div>
    );
}

export default Test6Real;
