import React, { createContext, useContext, useState, ReactNode } from 'react';
import { QuestionsDAO } from '../dao/QuestionsDAO';

interface ParticipantData {
    adhdDiagnosed: string;
    attentionalDifficulties: string;
    age: string;
    gender: string;
}

interface ParticipantContextType {
    participantData: ParticipantData | null;
    setParticipantData: (data: ParticipantData | null) => void;
}

const ParticipantContext = createContext<ParticipantContextType | undefined>(undefined);

/**
 * Hook to get participant data from context
 * @returns The participant data or null if not set
 */
export const useParticipantData = () => {
    const context = useContext(ParticipantContext);
    if (context === undefined) {
        throw new Error('useParticipantData must be used within a ParticipantProvider');
    }
    return context.participantData;
};

/**
 * Hook to set participant data in context
 * @returns A function to set participant data: setParticipantData(data)
 */
export const useSetParticipantData = () => {
    const context = useContext(ParticipantContext);
    if (context === undefined) {
        throw new Error('useSetParticipantData must be used within a ParticipantProvider');
    }
    return context.setParticipantData;
};

interface ParticipantProviderProps {
    children: ReactNode;
}

export const ParticipantProvider: React.FC<ParticipantProviderProps> = ({ children }) => {
    const [participantData, setParticipantData] = useState<ParticipantData | null>(null);

    return (
        <ParticipantContext.Provider value={{ participantData, setParticipantData }}>
            {children}
        </ParticipantContext.Provider>
    );
};

