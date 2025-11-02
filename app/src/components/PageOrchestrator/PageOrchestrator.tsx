import Page from "../../enums/Page";
import { usePageContext } from "../../contexts/PageContext";
import Questions from "../pages/Questions/Questions";
import DesktopOnly from "../pages/DesktopOnly/DesktopOnly";
import Test1 from "../pages/Test1/Test1";
import Test2 from "../pages/Test2/Test2";
import Test3 from "../pages/Test3/Test3";
import Test4 from "../pages/Test4/Test4";
import Test5 from "../pages/Test5/Test5";
import Test6 from "../pages/Test6/Test6";
import Test7 from "../pages/Test7/Test7";
import Test8 from "../pages/Test8/Test8";
import Test9 from "../pages/Test9/Test9";
import Test10 from "../pages/Test10/Test10";
import { isDesktop } from "react-device-detect";
import { useEffect, useState } from "react";

function renderPage(page: Page) {
    if (page === Page.DesktopOnly)
        return <DesktopOnly />
    if (page === Page.Questions)
        return <Questions />
    if (page === Page.Test1)
        return <Test1 />
    if (page === Page.Test2)
        return <Test2 />
    if (page === Page.Test3)
        return <Test3 />
    if (page === Page.Test4)
        return <Test4 />
    if (page === Page.Test5)
        return <Test5 />
    if (page === Page.Test6)
        return <Test6 />
    if (page === Page.Test7)
        return <Test7 />
    if (page === Page.Test8)
        return <Test8 />
    if (page === Page.Test9)
        return <Test9 />
    if (page === Page.Test10)
        return <Test10 />
    else
        return <div>Error page routing!</div>
}

function PageOrchestrator() {
    const { page, setPage } = usePageContext();
    const isDev = process.env.REACT_APP_IS_DEV === 'true';
    const [debugPageInput, setDebugPageInput] = useState<string>(page.toString());

    useEffect(() => {
        // Check if device is desktop, if not route to DesktopOnly page
        if (!isDesktop) {
            setPage(Page.DesktopOnly);
        }
    }, [setPage]);

    useEffect(() => {
        setDebugPageInput(page.toString());
    }, [page]);

    const handleDebugPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setDebugPageInput(value);
        
        const pageNum = parseInt(value, 10);
        if (!isNaN(pageNum) && pageNum >= 0 && pageNum <= Page.Test10) {
            setPage(pageNum as Page);
        }
    };

    return (
        <main>
            {isDev && (
                <div style={{
                    position: 'fixed',
                    top: '10px',
                    right: '10px',
                    padding: '1rem',
                    backgroundColor: '#000000',
                    border: '2px solid #ff00ff',
                    borderRadius: '6px',
                    zIndex: 9999
                }}>
                    <label style={{ color: '#fff', display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        Debug: Page State
                    </label>
                    <input
                        type="number"
                        value={debugPageInput}
                        onChange={handleDebugPageChange}
                        min="0"
                        max={Page.Test10}
                        style={{
                            padding: '0.5rem',
                            fontSize: '0.875rem',
                            border: '2px solid #ff00ff',
                            borderRadius: '4px',
                            backgroundColor: '#000000',
                            color: '#fff',
                            width: '100px',
                            outline: 'none'
                        }}
                        placeholder={`0-${Page.Test10}`}
                    />
                    <div style={{ color: '#ff99ff', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        Current: {page} ({Object.keys(Page).find(key => Page[key as keyof typeof Page] === page)})
                    </div>
                </div>
            )}
            {
                renderPage(page)
            }
        </main>
    )
}

export default PageOrchestrator;