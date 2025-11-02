import '../../../globalcss/TestReal.css';
import Test1Runtime from "./Test1Runtime";
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
            <Test1Runtime collectMetrics={true} trial={false} onComplete={handleComplete} />
        </div>
    );
}

export default Test1Real;

