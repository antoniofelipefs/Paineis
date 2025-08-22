import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupMockApi } from './api/mock-server';

// Setup mock API before rendering the app
setupMockApi();

createRoot(document.getElementById('root')!).render(<App />);
