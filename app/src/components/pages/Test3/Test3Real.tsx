import '../../../globalcss/TestReal.css';
import ShapeTestRuntime from "../testRuntimes/ShapeTestRuntime";
import { usePageContext } from "../../../contexts/PageContext";
import Page from "../../../enums/Page";

function Test3Real() {
    const { setPage } = usePageContext();

    const handleComplete = () => {
        // Move to next test page (Test4)
        setPage(Page.Test4);
    };

    return (
        <div className="test-real">
            <ShapeTestRuntime trial={false} onComplete={handleComplete} goStimulusShape="circle" testKey="test3" />
        </div>
    );
}

export default Test3Real;
