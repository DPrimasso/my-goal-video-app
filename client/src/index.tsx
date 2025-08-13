import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { validateConfig, isDevelopment } from './config/environment';

// Validate environment configuration on startup
validateConfig();

// Global error handler to prevent page refresh
window.addEventListener('error', (event) => {
  console.error('🚨 Global error caught:', event.error);
  event.preventDefault();
  return false;
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
  event.preventDefault();
  return false;
});

// Handle Remotion-specific errors
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('browser crashed while rendering frame')) {
    console.error('🎬 Remotion browser crash detected, preventing page refresh');
    event.preventDefault();
    return false;
  }
});

// Disable hot reload temporarily to debug refresh issues
if (process.env.NODE_ENV === 'development') {
  if (isDevelopment()) {
    console.log('🔧 Development mode - hot reload disabled for debugging');
  }
  // @ts-ignore
  if (module.hot) {
    // @ts-ignore
    module.hot.decline();
  }
}

// Detect page refresh/reload
window.addEventListener('beforeunload', (event) => {
  if (isDevelopment()) {
    console.log('🔄 Page is about to refresh/reload');
  }
});

// Detect page visibility changes
document.addEventListener('visibilitychange', () => {
  if (isDevelopment()) {
    console.log('👁️ Page visibility changed:', document.visibilityState);
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
