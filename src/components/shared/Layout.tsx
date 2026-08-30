import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { msalInstance } from '../../services/authService';
import { AuthUser } from '../../types';
import {
  LayoutDashboard,
  Users,
  FileText,
  CheckSquare,
  Bell,
  BarChart3,
  Folder,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import './Layout.css';

interface LayoutProps {
  currentUser: AuthUser | null;
  onLogout: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
  { id: 'clients', label: 'Clientes', icon: <Users size={20} />, path: '/clients' },
  { id: 'contracts', label: 'Contratos', icon: <FileText size={20} />, path: '/contracts' },
  { id: 'tasks', label: 'Tareas', icon: <CheckSquare size={20} />, path: '/tasks' },
  { id: 'alerts', label: 'Alertas', icon: <Bell size={20} />, path: '/alerts' },
  { id: 'reports', label: 'Reportes', icon: <BarChart3 size={20} />, path: '/reports' },
  { id: 'documents', label: 'Documentos', icon: <Folder size={20} />, path: '/documents' },
];

export const Layout: React.FC<LayoutProps> = ({ currentUser, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getInitials = (name: string) => {
    if (!name) return 'A';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">A</div>
          </div>
          <div className="sidebar-title">
            <span>ASSISTANTS</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <div key={item.id} className="sidebar-nav-item">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-nav-link ${isActive ? 'active' : ''}`
                }
              >
                <span className="icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button className="header-menu-button" onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
            <h1 className="header-title">
              {navItems.find(item => location.pathname.startsWith(item.path))?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="header-right">
            {currentUser && (
              <div className="header-user">
                <div className="header-user-info">
                  <span className="header-user-name">{currentUser.name || currentUser.email}</span>
                  <span className="header-user-email">{currentUser.email}</span>
                </div>
                <div className="header-user-avatar">
                  {getInitials(currentUser.name || currentUser.email)}
                </div>
                <button className="header-logout-button" onClick={onLogout}>
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="main-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
