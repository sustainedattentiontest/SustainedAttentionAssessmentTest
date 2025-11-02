import React, { createContext, useContext, useState, ReactNode } from 'react';
import Page from "../enums/Page";

interface PageContextType {
  page: number;
  setPage: (page: number) => void;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export const usePageContext = () => {
  const context = useContext(PageContext);
  if (context === undefined) {
    throw new Error('usePageContext must be used within a PageProvider');
  }
  return {...context, nextPage: () => context.setPage(context.page + 1)};
};

interface PageProviderProps {
  children: ReactNode;
}

export const PageProvider: React.FC<PageProviderProps> = ({ children }) => {
  const [page, setPage] = useState<Page>(Page.Questions);

  return (
    <PageContext.Provider value={{ page, setPage }}>
      {children}
    </PageContext.Provider>
  );
};

