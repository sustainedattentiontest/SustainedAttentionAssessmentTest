import { useEffect, useState } from 'react';
import { usePageContext } from '../../../contexts/PageContext';
import Page from '../../../enums/Page';
import './DebugView.css';

interface ListEntry {
    key: string;
    data: any;
    timestamp: string;
}

interface ListResponse {
    entries: ListEntry[];
    count: number;
}

function DebugView() {
    const { setPage } = usePageContext();
    const [prodEntries, setProdEntries] = useState<ListEntry[]>([]);
    const [testEntries, setTestEntries] = useState<ListEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isDev = process.env.REACT_APP_IS_DEV === 'true';

    // Redirect to Results if not in dev mode
    useEffect(() => {
        if (!isDev) {
            setPage(Page.Results);
        }
    }, [isDev, setPage]);

    useEffect(() => {
        // Don't fetch if not in dev mode
        if (!isDev) {
            setLoading(false);
            return;
        }
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const apiKey = process.env.REACT_APP_API_KEY;
                const apiUrl = process.env.REACT_APP_API_URL || 'http://ec2-3-71-203-6.eu-central-1.compute.amazonaws.com:8080';

                const response = await fetch(`${apiUrl}/list`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': apiKey || '',
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch data: ${response.statusText}`);
                }

                const data: ListResponse = await response.json();

                // Filter entries: TEST- prefix vs regular UUIDs
                const testEntriesList = data.entries.filter(entry => entry.key.startsWith('TEST-'));
                const prodEntriesList = data.entries.filter(entry => !entry.key.startsWith('TEST-'));

                setTestEntries(testEntriesList);
                setProdEntries(prodEntriesList);
            } catch (err) {
                console.error('Error fetching debug data:', err);
                setError(err instanceof Error ? err.message : 'Unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        if (isDev) {
            fetchData();
        }
    }, [isDev]);

    // Format entries as JSON array
    const formatEntries = (entries: ListEntry[]): string => {
        if (entries.length === 0) {
            return '[]';
        }

        const entriesArray = entries.map(entry => ({
            key: entry.key,
            timestamp: entry.timestamp,
            ...entry.data
        }));

        return JSON.stringify(entriesArray, null, 2);
    };

    return (
        <div className="debug-view-container">
            <h1 className="debug-view-title">Debug View - All Entries</h1>
            
            {loading && (
                <div className="debug-view-loading">Loading entries...</div>
            )}

            {error && (
                <div className="debug-view-error">
                    <h2>Error</h2>
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && (
                <div className="debug-view-content">
                    <div className="debug-view-section">
                        <h2 className="debug-view-section-title">PROD ({prodEntries.length} entries)</h2>
                        <textarea
                            className="debug-view-textarea"
                            readOnly
                            value={formatEntries(prodEntries)}
                            placeholder="No production entries found."
                        />
                    </div>

                    <div className="debug-view-section">
                        <h2 className="debug-view-section-title">TEST ({testEntries.length} entries)</h2>
                        <textarea
                            className="debug-view-textarea"
                            readOnly
                            value={formatEntries(testEntries)}
                            placeholder="No test entries found."
                        />
                    </div>
                </div>
            )}

            <div className="debug-view-actions">
                <button 
                    className="debug-view-button"
                    onClick={() => setPage(Page.Results)}
                >
                    Back to Results
                </button>
            </div>
        </div>
    );
}

export default DebugView;

