if ((import.meta as any).env?.DEV) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
  }
  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';
import './index.css';
import { AppProvider } from './store.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

window.addEventListener('error', (e) => {
  const msg = e.message || '';
  const lowerMsg = msg.toLowerCase();
  if (
    lowerMsg.includes('websocket') ||
    lowerMsg.includes('vite') ||
    lowerMsg.includes('hmr') ||
    lowerMsg.includes('extension') ||
    lowerMsg.includes('scripterror')
  ) {
    return; // Ignore benign HMR/development socket errors
  }
  console.error('Global Error:', e.message, e.filename, e.lineno);
});

window.addEventListener('unhandledrejection', (e) => {
  const reason = e.reason;
  const reasonStr = reason ? (reason.message || String(reason)) : '';
  const lowerReason = reasonStr.toLowerCase();
  if (
    lowerReason.includes('websocket') ||
    lowerReason.includes('vite') ||
    lowerReason.includes('hmr') ||
    lowerReason.includes('extension') ||
    lowerReason.includes('unopened') ||
    lowerReason.includes('closed without opened')
  ) {
    return; // Ignore benign HMR/development socket promise rejections
  }
  console.error('Unhandled Promise Rejection:', e.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>,
);
