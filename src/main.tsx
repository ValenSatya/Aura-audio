import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MiniPlayerWidget } from './components/MiniPlayerWidget';
import './index.css';

const isMiniView =
  window.location.search.includes('view=mini') || window.location.hash.includes('mini');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isMiniView ? <MiniPlayerWidget /> : <App />}
  </React.StrictMode>
);
