import { ThemeProvider } from 'next-themes';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element #root was not found.');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="omni-theme"
    >
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
