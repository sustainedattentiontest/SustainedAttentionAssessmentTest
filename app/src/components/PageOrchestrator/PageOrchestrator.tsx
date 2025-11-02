import Page from "../../enums/Page";
import { usePageContext } from "../../contexts/PageContext";
import Questions from "../pages/Questions/Questions";
import DesktopOnly from "../pages/DesktopOnly/DesktopOnly";
import Instructions from "../pages/Instructions/Instructions";
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
import { useTestMetrics } from "../../contexts/TestMetricsContext";
import { useParticipantData } from "../../contexts/ParticipantContext";

function renderPage(page: Page) {
    if (page === Page.DesktopOnly)
        return <DesktopOnly />
    if (page === Page.Questions)
        return <Questions />
    if (page === Page.Instructions)
        return <Instructions />
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
    const testMetrics = useTestMetrics();
    const participantData = useParticipantData();

    useEffect(() => {
        // Check if device is desktop, if not route to DesktopOnly page
        if (!isDev && !isDesktop) {
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
            {isDev && (
                <div style={{
                    position: 'fixed',
                    top: '10px',
                    left: '20px',
                    padding: '1.5rem',
                    backgroundColor: '#000000',
                    border: '2px solid #ff00ff',
                    borderRadius: '8px',
                    zIndex: 9998,
                    minWidth: '250px',
                    maxHeight: '80vh',
                    overflowY: 'auto'
                }}>
                    <h3 style={{
                        color: '#ff00ff',
                        fontSize: '1rem',
                        fontWeight: 600,
                        margin: '0 0 1rem 0',
                        textAlign: 'center',
                        borderBottom: '1px solid #ff00ff',
                        paddingBottom: '0.5rem'
                    }}>
                        Debug: Test Metrics
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {Object.keys(testMetrics).length === 0 ? (
                            <div style={{ color: '#ff99ff', fontSize: '0.875rem', textAlign: 'center' }}>
                                No test metrics yet
                            </div>
                        ) : (
                            Object.entries(testMetrics).map(([testKey, metrics]) => (
                                <div key={testKey} style={{
                                    padding: '0.75rem',
                                    border: '1px solid #ff66ff',
                                    borderRadius: '4px',
                                    backgroundColor: '#000000'
                                }}>
                                    <div style={{ color: '#ff00ff', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                        {testKey.toUpperCase()}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                            <span style={{ color: '#ff99ff' }}>Hits:</span>
                                            <span style={{ color: '#fff' }}>{metrics.hits}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                            <span style={{ color: '#ff99ff' }}>Commission:</span>
                                            <span style={{ color: '#fff' }}>{metrics.commissionMisses}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                            <span style={{ color: '#ff99ff' }}>Omission:</span>
                                            <span style={{ color: '#fff' }}>{metrics.omissionMisses}</span>
                                        </div>
                                        {Object.keys(metrics.hitReactionTimes).length > 0 && (
                                            <div style={{ marginTop: '0.5rem', borderTop: '1px solid #ff66ff', paddingTop: '0.5rem' }}>
                                                <div style={{ color: '#ff99ff', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                                                    Reaction Times (ms):
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', fontSize: '0.75rem' }}>
                                                    {Object.entries(metrics.hitReactionTimes)
                                                        .sort(([a], [b]) => Number(a) - Number(b))
                                                        .map(([round, reactionTime]) => (
                                                            <div key={round} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ color: '#ff99ff' }}>Round {round}:</span>
                                                                <span style={{ color: '#fff' }}>{reactionTime}ms</span>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
            {isDev && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '20px',
                    padding: '1.5rem',
                    backgroundColor: '#000000',
                    border: '2px solid #ff00ff',
                    borderRadius: '8px',
                    zIndex: 9998,
                    minWidth: '250px'
                }}>
                    <h3 style={{
                        color: '#ff00ff',
                        fontSize: '1rem',
                        fontWeight: 600,
                        margin: '0 0 1rem 0',
                        textAlign: 'center',
                        borderBottom: '1px solid #ff00ff',
                        paddingBottom: '0.5rem'
                    }}>
                        Debug: Participant Data
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {!participantData ? (
                            <div style={{ color: '#ff99ff', fontSize: '0.875rem', textAlign: 'center' }}>
                                No participant data yet
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                    <span style={{ color: '#ff99ff' }}>ADHD Diagnosed:</span>
                                    <span style={{ color: '#fff' }}>{participantData.adhdDiagnosed || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                    <span style={{ color: '#ff99ff' }}>Attentional Difficulties:</span>
                                    <span style={{ color: '#fff' }}>{participantData.attentionalDifficulties || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                    <span style={{ color: '#ff99ff' }}>Age:</span>
                                    <span style={{ color: '#fff' }}>{participantData.age || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                    <span style={{ color: '#ff99ff' }}>Gender:</span>
                                    <span style={{ color: '#fff' }}>{participantData.gender || 'N/A'}</span>
                                </div>
                            </>
                        )}
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