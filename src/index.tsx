import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css'; // 更新为新的 CSS 路径
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);