import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TestMetrics {
    hits: number;
    commissionMisses: number;
    omissionMisses: number;
    hitReactionTimes: { [round: number]: number }; // Reaction times in ms for each round where a hit was made
}

interface TestMetricsData {
    [testKey: string]: TestMetrics;
}

interface TestMetricsContextType {
    testMetrics: TestMetricsData;
    setTestMetrics: (testKey: string, metrics: TestMetrics) => void;
}

const TestMetricsContext = createContext<TestMetricsContextType | undefined>(undefined);

/**
 * Hook to get test metrics from context
 * @returns The test metrics data object
 */
export const useTestMetrics = () => {
    const context = useContext(TestMetricsContext);
    if (context === undefined) {
        throw new Error('useTestMetrics must be used within a TestMetricsProvider');
    }
    return context.testMetrics;
};

/**
 * Hook to set test metrics in context
 * @returns A function to set test metrics: setTestMetrics(testKey, { hits, commissionMisses, omissionMisses })
 */
export const useSetTestMetrics = () => {
    const context = useContext(TestMetricsContext);
    if (context === undefined) {
        throw new Error('useSetTestMetrics must be used within a TestMetricsProvider');
    }
    return context.setTestMetrics;
};

interface TestMetricsProviderProps {
    children: ReactNode;
}

export const TestMetricsProvider: React.FC<TestMetricsProviderProps> = ({ children }) => {
    const [testMetrics, setTestMetricsState] = useState<TestMetricsData>({});

    const setTestMetrics = (testKey: string, metrics: TestMetrics) => {
        setTestMetricsState(prev => ({
            ...prev,
            [testKey]: metrics
        }));
    };

    return (
        <TestMetricsContext.Provider value={{ testMetrics, setTestMetrics }}>
            {children}
        </TestMetricsContext.Provider>
    );
};

