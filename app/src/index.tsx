import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import PageOrchestrator from "./components/PageOrchestrator/PageOrchestrator";
import { PageProvider } from "./contexts/PageContext";
import { QuestionsDAOProvider } from "./contexts/QuestionsDAOContext";
import { TestMetricsProvider } from "./contexts/TestMetricsContext";
import { ParticipantProvider } from "./contexts/ParticipantContext";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <PageProvider>
      <QuestionsDAOProvider>
        <TestMetricsProvider>
          <ParticipantProvider>
            <PageOrchestrator />
          </ParticipantProvider>
        </TestMetricsProvider>
      </QuestionsDAOProvider>
    </PageProvider>
  </React.StrictMode>
);
