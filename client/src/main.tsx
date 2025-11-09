import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

;(window as any).global = window;

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(<App />);
}
