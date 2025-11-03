import { useEffect, useState } from 'react';
import { usePageContext } from '../../../contexts/PageContext';
import Page from '../../../enums/Page';
import { MAX_ROUNDS } from '../../../constants';
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

    // Flatten nested objects for CSV
    const flattenObject = (obj: any, prefix: string = '', separator: string = '_'): Record<string, string | number> => {
        const flattened: Record<string, string | number> = {};
        
        // Check if this is a hitReactionTimes object
        // It's hitReactionTimes if the prefix ends with "hitReactionTimes" or contains "_hitReactionTimes"
        // AND the object has numeric string keys (round numbers)
        const isHitReactionTimes = (prefix.includes('hitReactionTimes') || prefix.endsWith('hitReactionTimes')) &&
                                   typeof obj === 'object' &&
                                   !Array.isArray(obj) &&
                                   Object.keys(obj).length > 0 &&
                                   Object.keys(obj).every(k => !isNaN(Number(k)));
        
        if (isHitReactionTimes) {
            // Expand hitReactionTimes to always include rounds 1-20
            for (let round = 1; round <= MAX_ROUNDS; round++) {
                const roundKey = String(round);
                const fullKey = `${prefix}${separator}${roundKey}`;
                // Use the value if it exists, otherwise empty string
                flattened[fullKey] = obj[roundKey] !== undefined && obj[roundKey] !== null ? obj[roundKey] : '';
            }
            return flattened;
        }
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const newKey = prefix ? `${prefix}${separator}${key}` : key;
                const value = obj[key];
                
                if (value === null || value === undefined) {
                    flattened[newKey] = '';
                } else if (typeof value === 'object' && !Array.isArray(value)) {
                    // Recursively flatten nested objects
                    Object.assign(flattened, flattenObject(value, newKey, separator));
                } else if (Array.isArray(value)) {
                    // For arrays, convert to comma-separated string
                    flattened[newKey] = value.map(item => 
                        typeof item === 'object' ? JSON.stringify(item) : String(item)
                    ).join(', ');
                } else {
                    flattened[newKey] = value;
                }
            }
        }
        
        return flattened;
    };

    // Convert entries to CSV format
    const formatEntriesAsCSV = (entries: ListEntry[]): string => {
        if (entries.length === 0) {
            return '';
        }

        // Flatten all entries
        const flattenedEntries = entries.map(entry => {
            const flatData = flattenObject(entry.data);
            return {
                key: entry.key,
                timestamp: entry.timestamp,
                ...flatData
            };
        });

        // Get all unique keys across all entries
        const allKeys = new Set<string>(['key', 'timestamp']);
        flattenedEntries.forEach(entry => {
            Object.keys(entry).forEach(key => allKeys.add(key));
        });

        // Custom sort function for CSV headers
        const sortHeaders = (a: string, b: string): number => {
            // Always put 'key' first
            if (a === 'key') return -1;
            if (b === 'key') return 1;
            
            // Always put 'timestamp' last
            if (a === 'timestamp') return 1;
            if (b === 'timestamp') return -1;
            
            // Check if both are hitReactionTimes columns
            const aIsHitRT = a.includes('hitReactionTimes') && a.match(/hitReactionTimes_(\d+)$/);
            const bIsHitRT = b.includes('hitReactionTimes') && b.match(/hitReactionTimes_(\d+)$/);
            
            if (aIsHitRT && bIsHitRT) {
                // Both are hitReactionTimes - sort by round number numerically
                const aMatch = a.match(/hitReactionTimes_(\d+)$/);
                const bMatch = b.match(/hitReactionTimes_(\d+)$/);
                if (aMatch && bMatch) {
                    return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
                }
            }
            
            // If only one is hitReactionTimes, they should be grouped together
            // Compare prefixes (everything before the last underscore and number)
            const aPrefix = a.replace(/_\d+$/, '');
            const bPrefix = b.replace(/_\d+$/, '');
            
            if (aPrefix !== bPrefix) {
                // Different prefixes - sort by prefix first
                const prefixCompare = aPrefix.localeCompare(bPrefix);
                if (prefixCompare !== 0) return prefixCompare;
                
                // Same prefix - if there are numeric suffixes, sort numerically
                const aSuffix = a.match(/_(\d+)$/);
                const bSuffix = b.match(/_(\d+)$/);
                if (aSuffix && bSuffix) {
                    return parseInt(aSuffix[1], 10) - parseInt(bSuffix[1], 10);
                }
            } else {
                // Same prefix - sort by numeric suffix if both have one
                const aSuffix = a.match(/_(\d+)$/);
                const bSuffix = b.match(/_(\d+)$/);
                if (aSuffix && bSuffix) {
                    return parseInt(aSuffix[1], 10) - parseInt(bSuffix[1], 10);
                }
            }
            
            // Default to lexicographic sort
            return a.localeCompare(b);
        };

        const headers = Array.from(allKeys).sort(sortHeaders);
        
        // Generate CSV
        const csvLines: string[] = [];
        
        // Header row
        csvLines.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
        
        // Data rows
        flattenedEntries.forEach(entry => {
            const row = headers.map(header => {
                const value = entry[header as keyof typeof entry];
                if (value === null || value === undefined) {
                    return '""';
                }
                // Escape quotes and wrap in quotes
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvLines.push(row.join(','));
        });

        return csvLines.join('\n');
    };

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

    // Download CSV file
    const downloadCSV = (entries: ListEntry[], filename: string) => {
        if (entries.length === 0) {
            alert('No data to export');
            return;
        }

        const csv = formatEntriesAsCSV(entries);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                        <div className="debug-view-section-header">
                            <h2 className="debug-view-section-title">PROD ({prodEntries.length} entries)</h2>
                            <button
                                className="debug-view-export-button"
                                onClick={() => downloadCSV(prodEntries, `prod_entries_${new Date().toISOString().split('T')[0]}.csv`)}
                                disabled={prodEntries.length === 0}
                            >
                                Export to CSV
                            </button>
                        </div>
                        <textarea
                            className="debug-view-textarea"
                            readOnly
                            value={formatEntries(prodEntries)}
                            placeholder="No production entries found."
                        />
                    </div>

                    <div className="debug-view-section">
                        <div className="debug-view-section-header">
                            <h2 className="debug-view-section-title">TEST ({testEntries.length} entries)</h2>
                            <button
                                className="debug-view-export-button"
                                onClick={() => downloadCSV(testEntries, `test_entries_${new Date().toISOString().split('T')[0]}.csv`)}
                                disabled={testEntries.length === 0}
                            >
                                Export to CSV
                            </button>
                        </div>
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

