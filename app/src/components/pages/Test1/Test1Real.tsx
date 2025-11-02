import '../../../globalcss/TestReal.css';
import ShapeTestRuntime from "../testRuntimes/ShapeTestRuntime";
import { usePageContext } from "../../../contexts/PageContext";
import Page from "../../../enums/Page";

function Test1Real() {
    const { setPage } = usePageContext();

    const handleComplete = () => {
        // Move to next test page (Test2)
        setPage(Page.Test2);
    };

    return (
        <div className="test-real">
            <ShapeTestRuntime trial={false} onComplete={handleComplete} goStimulusShape="triangle" testKey="test1" />
        </div>
    );
}

export default Test1Real;

