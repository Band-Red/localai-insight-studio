import React from 'react';
import ReactDOM from 'react-dom/client';
import './browser_mock'; // Mock Electron APIs for browser deployment
import App from './App';
import './styles.css';
import '../../global.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);