import React from 'react';
import { useMsal } from '@azure/msal-react';
import { Loader2 } from 'lucide-react';
import './LoginPage.css';

interface LoginPageProps {
  onLogin: () => void;
  isLoading: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isLoading }) => {
  const { instance } = useMsal();

  const handleLogin = () => {
    onLogin();
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon">A</div>
          </div>
          <h1 className="login-title">ASSISTANTS</h1>
          <p className="login-subtitle">
            WebApp para Asistentes de Banca Privada
          </p>
        </div>

        <div className="login-content">
          <p className="login-description">
            Bienvenido a la plataforma de soporte operativo para Private Bankers.
          </p>
          <p className="login-description">
            Inicia sesión con tu cuenta corporativa de Banco Mediolanum.
          </p>

          <button
            className="login-button"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Iniciando sesión...
              </>
            ) : (
              <>Iniciar sesión con Microsoft</>
            )}
          </button>
        </div>

        <div className="login-footer">
          <p className="footer-text">
            © 2026 Banco Mediolanum. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};
