import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// Create a root
const container = document.getElementById('app');
const root = createRoot(container);

// Render your app
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);