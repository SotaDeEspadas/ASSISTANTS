import { PublicClientApplication, AccountInfo, Configuration } from '@azure/msal-browser';

// Configuración de MSAL (Microsoft Authentication Library)
const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_AD_CLIENT_ID || '',
    authority: import.meta.env.VITE_AZURE_AD_AUTHORITY || 'https://login.microsoftonline.com/bancomediolanum.es',
    redirectUri: import.meta.env.VITE_AZURE_AD_REDIRECT_URI || window.location.origin,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

// Solicitud de login
export const loginRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
  prompt: 'select_account',
};

// Solicitud de token
export const tokenRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
};

// Solicitud de token silencioso
export const silentTokenRequest = {
  scopes: ['openid', 'profile', 'email'],
  account: null as AccountInfo | null,
};

// Inicializar MSAL
export const msalInstance = new PublicClientApplication(msalConfig);

// Obtener usuario actual
export const getCurrentUser = async () => {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) {
    return null;
  }
  return accounts[0];
};

// Obtener token de acceso
export const getAccessToken = async () => {
  try {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      return null;
    }
    
    const response = await msalInstance.acquireTokenSilent({
      ...tokenRequest,
      account: accounts[0],
    });
    
    return response?.accessToken || null;
  } catch (error) {
    console.error('Error acquiring token silently:', error);
    return null;
  }
};

// Obtener información del usuario desde Microsoft Graph
export const getUserInfo = async (accessToken: string) => {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
};

// Obtener información del asistente desde el backend
export const getAssistantInfo = async (email: string) => {
  try {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }
    
    const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const response = await fetch(`${apiUrl}/assistants/by-email/${encodeURIComponent(email)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching assistant info:', error);
    // Return default info if backend is not available
    return {
      prfi: '',
      name: '',
      email,
      zone: '',
      office: '',
      assignedPB: [],
      role: 'assistant',
    };
  }
};

export default msalInstance;
