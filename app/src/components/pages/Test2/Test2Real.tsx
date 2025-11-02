import '../../../globalcss/TestReal.css';
import ShapeTestRuntime from "../testRuntimes/ShapeTestRuntime";
import { usePageContext } from "../../../contexts/PageContext";
import Page from "../../../enums/Page";

function Test2Real() {
    const { setPage } = usePageContext();

    const handleComplete = () => {
        // Move to next test page (Test3)
        setPage(Page.Test3);
    };

    return (
        <div className="test-real">
            <ShapeTestRuntime trial={false} onComplete={handleComplete} goStimulusShape="star" testKey="test2" />
        </div>
    );
}

export default Test2Real;
