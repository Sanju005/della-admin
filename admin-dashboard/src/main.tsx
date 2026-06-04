import { createRoot } from "react-dom/client";
import { App } from "./app";
import { AppErrorBoundary } from "./components/app-error-boundary";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
