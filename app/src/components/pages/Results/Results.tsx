import { useParticipantData } from '../../../contexts/ParticipantContext';
import { useTestMetrics } from '../../../contexts/TestMetricsContext';
import { usePageContext } from '../../../contexts/PageContext';
import { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Page from '../../../enums/Page';
import './Results.css';

function Results() {
    const participantData = useParticipantData();
    const testMetrics = useTestMetrics();
    const { setPage } = usePageContext();
    const [notification, setNotification] = useState<string | null>(null);
    const hasSubmittedRef = useRef(false);
    const isSubmittingRef = useRef(false);
    const isDev = process.env.REACT_APP_IS_DEV === 'true';

    // Merge contexts and submit to database - run once when component mounts
    useEffect(() => {
        // Don't submit if already submitted or currently submitting
        if (hasSubmittedRef.current || isSubmittingRef.current) {
            return;
        }

        // Only submit if we have some data
        const hasData = participantData || Object.keys(testMetrics).length > 0;
        if (!hasData) {
            return;
        }

        const submitResults = async () => {
            isSubmittingRef.current = true;

            try {
                // Merge participant data and test metrics into a single object
                const mergedData = {
                    participantData: participantData || null,
                    testMetrics: testMetrics
                };

                // Generate UUID key
                const uuid = uuidv4();
                
                // Determine key based on environment
                const isDev = process.env.REACT_APP_IS_DEV === 'true';
                const key = isDev ? `TEST-${uuid}` : uuid;

                // Prepare the request payload
                const payload = {
                    key: key,
                    data: mergedData,
                };

                // Get API key and URL from environment variables
                const apiKey = process.env.REACT_APP_API_KEY;
                const apiUrl = process.env.REACT_APP_API_URL || 'http://ec2-3-71-203-6.eu-central-1.compute.amazonaws.com:8080';

                // Debug: Log API key status (without showing full key)
                if (!apiKey) {
                    console.warn('WARNING: REACT_APP_API_KEY is not set in environment variables');
                } else {
                    console.log(`API Key loaded: ${apiKey.substring(0, 8)}... (length: ${apiKey.length})`);
                }

                // Send POST request to the write endpoint
                const response = await fetch(`${apiUrl}/write`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': apiKey || '',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API Error Response:', errorText);
                    if (response.status === 401) {
                        throw new Error(`Unauthorized: API key is missing or invalid. Check REACT_APP_API_KEY in .env file.`);
                    }
                    throw new Error(`Failed to submit results: ${response.status} ${response.statusText}`);
                }

                const result = await response.json();
                hasSubmittedRef.current = true;
                setNotification(`Results have been reported! Key: ${key}`);
                
                // Clear notification after 5 seconds
                setTimeout(() => {
                    setNotification(null);
                }, 5000);

                // In dev mode, navigate to DebugView after a short delay
                if (isDev) {
                    setTimeout(() => {
                        setPage(Page.DebugView);
                    }, 2000);
                }
            } catch (error) {
                console.error('Error submitting results:', error);
                setNotification(`Error submitting results: ${error instanceof Error ? error.message : 'Unknown error'}`);
                
                // Clear error notification after 5 seconds
                setTimeout(() => {
                    setNotification(null);
                }, 5000);
            } finally {
                isSubmittingRef.current = false;
            }
        };

        submitResults();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    // Calculate aggregate metrics
    const totalHits = Object.values(testMetrics).reduce((sum, metrics) => sum + metrics.hits, 0);
    const totalCommissionMisses = Object.values(testMetrics).reduce((sum, metrics) => sum + metrics.commissionMisses, 0);
    const totalOmissionMisses = Object.values(testMetrics).reduce((sum, metrics) => sum + metrics.omissionMisses, 0);
    const totalMisses = totalCommissionMisses + totalOmissionMisses;
    
    // Calculate average reaction time across all tests
    const allReactionTimes: number[] = [];
    Object.values(testMetrics).forEach(metrics => {
        Object.values(metrics.hitReactionTimes).forEach(time => {
            allReactionTimes.push(time);
        });
    });
    const avgReactionTime = allReactionTimes.length > 0
        ? Math.round(allReactionTimes.reduce((sum, time) => sum + time, 0) / allReactionTimes.length)
        : 0;

    // Sort test keys for consistent display
    const sortedTestKeys = Object.keys(testMetrics).sort((a, b) => {
        const aNum = parseInt(a.replace('test', ''));
        const bNum = parseInt(b.replace('test', ''));
        return aNum - bNum;
    });

    return (
        <div className="results-container">
            <h1 className="results-title">Congratulations, test is done!</h1>
            
            {/* Notification banner */}
            {notification && (
                <div className={`notification ${notification.includes('Error') ? 'notification-error' : 'notification-success'}`}>
                    {notification}
                </div>
            )}
            
            <div className="results-content">
                {/* Participant Information */}
                {participantData && (
                    <section className="results-section">
                        <h2 className="section-title">Participant Information</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">ADHD Diagnosed:</span>
                                <span className="info-value">{participantData.adhdDiagnosed || 'N/A'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Attentional Difficulties:</span>
                                <span className="info-value">{participantData.attentionalDifficulties || 'N/A'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Age:</span>
                                <span className="info-value">{participantData.age || 'N/A'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Gender:</span>
                                <span className="info-value">{participantData.gender || 'N/A'}</span>
                            </div>
                        </div>
                    </section>
                )}

                {/* Overall Summary */}
                <section className="results-section">
                    <h2 className="section-title">Overall Summary</h2>
                    <div className="summary-grid">
                        <div className="summary-card">
                            <div className="summary-label">Total Hits</div>
                            <div className="summary-value">{totalHits}</div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-label">Commission Misses</div>
                            <div className="summary-value">{totalCommissionMisses}</div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-label">Omission Misses</div>
                            <div className="summary-value">{totalOmissionMisses}</div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-label">Total Misses</div>
                            <div className="summary-value">{totalMisses}</div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-label">Average Reaction Time</div>
                            <div className="summary-value">{avgReactionTime}ms</div>
                        </div>
                    </div>
                </section>

                {/* Detailed Test Results */}
                <section className="results-section">
                    <h2 className="section-title">Detailed Test Results</h2>
                    <div className="tests-grid">
                        {sortedTestKeys.map(testKey => {
                            const metrics = testMetrics[testKey];
                            const testNumber = testKey.replace('test', '');
                            const reactionTimes = Object.entries(metrics.hitReactionTimes);
                            const avgReactionTimeForTest = reactionTimes.length > 0
                                ? Math.round(reactionTimes.reduce((sum, [, time]) => sum + time, 0) / reactionTimes.length)
                                : 0;

                            return (
                                <div key={testKey} className="test-card">
                                    <h3 className="test-card-title">Test {testNumber}</h3>
                                    <div className="test-metrics">
                                        <div className="test-metric-item">
                                            <span className="test-metric-label">Hits:</span>
                                            <span className="test-metric-value">{metrics.hits}</span>
                                        </div>
                                        <div className="test-metric-item">
                                            <span className="test-metric-label">Commission Misses:</span>
                                            <span className="test-metric-value">{metrics.commissionMisses}</span>
                                        </div>
                                        <div className="test-metric-item">
                                            <span className="test-metric-label">Omission Misses:</span>
                                            <span className="test-metric-value">{metrics.omissionMisses}</span>
                                        </div>
                                        <div className="test-metric-item">
                                            <span className="test-metric-label">Total Misses:</span>
                                            <span className="test-metric-value">{metrics.commissionMisses + metrics.omissionMisses}</span>
                                        </div>
                                        {reactionTimes.length > 0 && (
                                            <div className="test-metric-item">
                                                <span className="test-metric-label">Avg Reaction Time:</span>
                                                <span className="test-metric-value">{avgReactionTimeForTest}ms</span>
                                            </div>
                                        )}
                                    </div>
                                    {reactionTimes.length > 0 && (
                                        <div className="reaction-times">
                                            <div className="reaction-times-label">Reaction Times by Round:</div>
                                            <div className="reaction-times-list">
                                                {reactionTimes
                                                    .sort(([a], [b]) => Number(a) - Number(b))
                                                    .map(([round, time]) => (
                                                        <span key={round} className="reaction-time-item">
                                                            Round {round}: {time}ms
                                                        </span>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Results;

