import { useParticipantData } from '../../../contexts/ParticipantContext';
import { useTestMetrics } from '../../../contexts/TestMetricsContext';
import './Results.css';

function Results() {
    const participantData = useParticipantData();
    const testMetrics = useTestMetrics();

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

