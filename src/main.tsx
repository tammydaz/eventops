import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { FeedbackProvider } from "./components/feedback/FeedbackProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { logEventsTableFieldsForBarService } from "./services/airtable/events";
// Removed EventStoreProvider, Zustand does not require a provider

if (import.meta.env.DEV) {
  (window as unknown as { __logBarServiceFieldId?: () => Promise<void> }).__logBarServiceFieldId = logEventsTableFieldsForBarService;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <FeedbackProvider>
        <App />
      </FeedbackProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
