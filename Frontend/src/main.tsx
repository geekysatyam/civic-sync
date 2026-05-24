import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";
import { setStoredToken } from "./lib/api";

registerSW({ immediate: true });

const isPWA = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

if (!isPWA()) {
  // sessionStorage survives reloads but is cleared when the tab is closed.
  // If there's no flag on load, the tab was freshly opened (not a reload) —
  // meaning the previous tab was closed, so clear the stored token.
  if (!sessionStorage.getItem('tab_open')) {
    setStoredToken(null);
    navigator.sendBeacon('/api/auth/logout', new Blob([], { type: 'application/json' }));
  }
  sessionStorage.setItem('tab_open', '1');
}

createRoot(document.getElementById("root")!).render(<App />
);
