import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'

// Global error catcher for visual debugging
window.addEventListener('error', (event) => {
  showErrorBanner('🔴 Lỗi JavaScript: ' + event.message, event.error?.stack);
});
window.addEventListener('unhandledrejection', (event) => {
  showErrorBanner('🔴 Lỗi Promise (API): ' + event.reason?.message, event.reason?.stack);
});

function showErrorBanner(message, stack) {
  let errDiv = document.getElementById('global-error-banner');
  if (!errDiv) {
    errDiv = document.createElement('div');
    errDiv.id = 'global-error-banner';
    errDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #ef4444; color: #fff; padding: 16px; z-index: 99999; font-family: sans-serif; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-height: 50vh; overflow-y: auto;';
    document.body.prepend(errDiv);
  }
  errDiv.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 6px;">${message}</div>
    ${stack ? `<pre style="margin: 0; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 4px; font-size: 11px; white-space: pre-wrap;">${stack}</pre>` : ''}
  `;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
