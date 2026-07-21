import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root was not found in index.html.');
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register the service worker for offline app-shell support. Skipped in dev
// so Vite's own module reloading isn't fought by a stale cached shell.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('Service worker registration failed:', err);
    });
  });
}
