
import { createRoot } from 'react-dom/client'
import App, { queryClient } from './App.tsx';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import './index.css'

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <Router>
      <AuthProvider>
        <AdminAuthProvider>
          <div>
            <App />
          </div>
        </AdminAuthProvider>
      </AuthProvider>
    </Router>
  </QueryClientProvider>
);
