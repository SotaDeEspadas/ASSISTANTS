import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { loginRequest, tokenRequest } from './services/authService';
import { Layout } from './components/shared/Layout';
import { DashboardView } from './components/Dashboard/DashboardView';
import { ClientList } from './components/Clients/ClientList';
import { ClientDetail } from './components/Clients/ClientDetail';
import { ContractList } from './components/Contracts/ContractList';
import { TaskList } from './components/Tasks/TaskList';
import { AlertList } from './components/Alerts/AlertList';
import { ReportList } from './components/Reports/ReportList';
import { DocumentList } from './components/Documents/DocumentList';
import { LoginPage } from './components/shared/LoginPage';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import { AuthUser } from './types';
import './App.css';

const App: React.FC = () => {
  const { instance, accounts, inProgress } = useMsal();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const location = useLocation();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (accounts.length > 0) {
          const account = accounts[0];
          const user: AuthUser = {
            id: account.username,
            name: account.name || '',
            email: account.username,
            username: account.username,
            prfi: '', // Se obtendrá del backend
            role: 'assistant',
            zone: '',
            office: '',
            assignedPB: [],
          };
          setCurrentUser(user);
          
          // Obtener información adicional del usuario desde el backend
          // await fetchUserInfo(user.email);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [accounts]);

  const handleLogin = () => {
    instance.loginRedirect(loginRequest).catch((e) => {
      console.error('Login failed:', e);
      toast.error('Error al iniciar sesión');
    });
  };

  const handleLogout = () => {
    instance.logoutRedirect().catch((e) => {
      console.error('Logout failed:', e);
      toast.error('Error al cerrar sesión');
    });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
        <p>Cargando configuración de autenticación...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <AuthenticatedTemplate>
        <Layout currentUser={currentUser} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardView currentUser={currentUser} />} />
            <Route path="/clients" element={<ClientList currentUser={currentUser} />} />
            <Route path="/clients/:clientId" element={<ClientDetail currentUser={currentUser} />} />
            <Route path="/contracts" element={<ContractList currentUser={currentUser} />} />
            <Route path="/tasks" element={<TaskList currentUser={currentUser} />} />
            <Route path="/alerts" element={<AlertList currentUser={currentUser} />} />
            <Route path="/reports" element={<ReportList currentUser={currentUser} />} />
            <Route path="/documents" element={<DocumentList currentUser={currentUser} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </AuthenticatedTemplate>

      <UnauthenticatedTemplate>
        <LoginPage onLogin={handleLogin} isLoading={inProgress === 'login'} />
      </UnauthenticatedTemplate>
    </div>
  );
};

export default App;
