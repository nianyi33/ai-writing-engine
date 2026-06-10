import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import App from './App';
import { PwaUpdater } from './components/PwaUpdater';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#e94560',
          colorBgContainer: '#0f3460',
          colorBgElevated: '#16213e',
          colorBgLayout: '#1a1a2e',
          colorText: '#e0e0e0',
          colorTextSecondary: '#a0a0b0',
          colorBorder: '#1a4a7a',
          borderRadius: 8,
          fontFamily: '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
        },
      }}
    >
      <BrowserRouter>
        <PwaUpdater />
          <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>,
);
