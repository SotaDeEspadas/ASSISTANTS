import { useMsal, useAccount, useIsAuthenticated } from '@azure/msal-react';
import { useEffect, useState, useCallback } from 'react';
import { AuthUser } from '../types';
import { getAssistantInfo } from '../services/authService';

/**
 * Hook personalizado para manejar la autenticación con Microsoft Entra ID
 * y obtener la información del asistente
 */
export const useAuth = () => {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const account = useAccount();
  
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserInfo = useCallback(async () => {
    try {
      if (!account) {
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }

      // Obtener información básica del usuario de Azure AD
      const baseUser: AuthUser = {
        id: account.username,
        name: account.name || '',
        email: account.username,
        username: account.username,
        prfi: '',
        role: 'assistant',
        zone: '',
        office: '',
        assignedPB: [],
      };

      // Obtener información del asistente desde el backend
      try {
        const assistantInfo = await getAssistantInfo(account.username);
        setCurrentUser({
          ...baseUser,
          name: assistantInfo.name || baseUser.name,
          prfi: assistantInfo.prfi || '',
          role: assistantInfo.role || 'assistant',
          zone: assistantInfo.zone || '',
          office: assistantInfo.office || '',
          assignedPB: assistantInfo.assignedPB || [],
        });
      } catch (backendError) {
        // Si el backend no está disponible, usar información básica
        console.warn('No se pudo obtener información del backend:', backendError);
        setCurrentUser(baseUser);
      }
    } catch (err) {
      console.error('Error al obtener información del usuario:', err);
      setError('Error al obtener información del usuario');
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [account, instance]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  useEffect(() => {
    // Refrescar información cuando cambian las cuentas
    if (accounts.length > 0) {
      fetchUserInfo();
    }
  }, [accounts, fetchUserInfo]);

  const login = useCallback(async () => {
    try {
      await instance.loginRedirect({
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        prompt: 'select_account',
      });
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError('Error al iniciar sesión');
      throw err;
    }
  }, [instance]);

  const logout = useCallback(async () => {
    try {
      await instance.logoutRedirect();
      setCurrentUser(null);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      setError('Error al cerrar sesión');
      throw err;
    }
  }, [instance]);

  const getAccessToken = useCallback(async () => {
    try {
      if (!account) return null;
      const response = await instance.acquireTokenSilent({
        scopes: ['openid', 'profile', 'email'],
        account,
      });
      return response?.accessToken || null;
    } catch (err) {
      console.error('Error al obtener el token:', err);
      return null;
    }
  }, [account, instance]);

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    error,
    accounts,
    inProgress,
    login,
    logout,
    getAccessToken,
    refreshUser: fetchUserInfo,
  };
};

export default useAuth;
