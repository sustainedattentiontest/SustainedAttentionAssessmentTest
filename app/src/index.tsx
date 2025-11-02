import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import PageOrchestrator from "./components/PageOrchestrator/PageOrchestrator";
import { PageProvider } from "./contexts/PageContext";
import { QuestionsDAOProvider } from "./contexts/QuestionsDAOContext";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <PageProvider>
      <QuestionsDAOProvider>
        <PageOrchestrator />
      </QuestionsDAOProvider>
    </PageProvider>
  </React.StrictMode>
);
