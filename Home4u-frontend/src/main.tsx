import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './sentry'; // VITE_SENTRY_DSN 설정 시 자동 초기화
import { Sentry } from './sentry';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p style={{ padding: '2rem', textAlign: 'center' }}>오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
