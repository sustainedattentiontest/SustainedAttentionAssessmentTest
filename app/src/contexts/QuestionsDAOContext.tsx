import React, { createContext, useContext, useState, ReactNode } from 'react';
import { QuestionsDAO } from '../dao/QuestionsDAO';

interface QuestionsDAOContextType {
  questionsDAO: QuestionsDAO | null;
  setQuestionsDAO: (dao: QuestionsDAO | null) => void;
}

const QuestionsDAOContext = createContext<QuestionsDAOContextType | undefined>(undefined);

/**
 * Hook to get the QuestionsDAO from context
 * Use this in React components: const questionsDAO = useGetQuestionsDAO();
 * 
 * Alternative usage with custom name:
 * import { useGetQuestionsDAO as getQuestionsDAO } from './contexts/QuestionsDAOContext';
 * const questionsDAO = getQuestionsDAO();
 * 
 * @returns The QuestionsDAO instance or null if not set
 */
export const useGetQuestionsDAO = () => {
  const context = useContext(QuestionsDAOContext);
  if (context === undefined) {
    throw new Error('useGetQuestionsDAO must be used within a QuestionsDAOProvider');
  }
  return context.questionsDAO;
};

/**
 * Hook to set the QuestionsDAO in context
 * Use this in React components: const setQuestionsDAO = useSetQuestionsDAO();
 * 
 * Alternative usage with custom name:
 * import { useSetQuestionsDAO as setQuestionsDAO } from './contexts/QuestionsDAOContext';
 * const setQuestionsDAO = useSetQuestionsDAO();
 * 
 * @returns A function to set the QuestionsDAO: setQuestionsDAO(questionsDAO)
 */
export const useSetQuestionsDAO = () => {
  const context = useContext(QuestionsDAOContext);
  if (context === undefined) {
    throw new Error('useSetQuestionsDAO must be used within a QuestionsDAOProvider');
  }
  return context.setQuestionsDAO;
};

interface QuestionsDAOProviderProps {
  children: ReactNode;
}

export const QuestionsDAOProvider: React.FC<QuestionsDAOProviderProps> = ({ children }) => {
  const [questionsDAO, setQuestionsDAO] = useState<QuestionsDAO | null>(null);

  return (
    <QuestionsDAOContext.Provider value={{ questionsDAO, setQuestionsDAO }}>
      {children}
    </QuestionsDAOContext.Provider>
  );
};

