import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { MarketProvider } from './context/MarketContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MarketProvider>
      <App />
    </MarketProvider>
  </StrictMode>
);
