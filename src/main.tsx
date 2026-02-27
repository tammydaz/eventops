
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { logEventsTableFieldsForBarService } from "./services/airtable/events";
// Removed EventStoreProvider, Zustand does not require a provider

if (import.meta.env.DEV) {
  (window as unknown as { __logBarServiceFieldId?: () => Promise<void> }).__logBarServiceFieldId = logEventsTableFieldsForBarService;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
