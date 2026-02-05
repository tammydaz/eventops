import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { EventStoreProvider } from "./state/eventStore";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <EventStoreProvider>
      <App />
    </EventStoreProvider>
  </React.StrictMode>
);
