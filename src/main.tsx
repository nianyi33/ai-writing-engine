import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { PwaUpdater } from './components/PwaUpdater';
import { ThemeProvider } from './components/ThemeProvider';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <PwaUpdater />
          <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
