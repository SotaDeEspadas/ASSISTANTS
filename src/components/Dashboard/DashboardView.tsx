import React from 'react';
import { Link } from 'react-router-dom';
import { AuthUser, Task, Alert, AssistantStats } from '../../types';
import { mockTasks, mockAlerts, mockAssistantStats } from '../../data/mockData';
import {
  LayoutDashboard,
  Users,
  FileText,
  CheckSquare,
  Bell,
  BarChart3,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import './DashboardView.css';

interface DashboardViewProps {
  currentUser: AuthUser | null;
}

// Componente para tarjeta de estadística
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  color?: string;
  link?: string;
}> = ({ title, value, icon, trend, color = '#2563eb', link }) => {
  const Content = (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ backgroundColor: color + '20' }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="stat-card-content">
        <span className="stat-card-value">{value}</span>
        <span className="stat-card-title">{title}</span>
        {trend !== undefined && (
          <span className={`stat-card-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </div>
  );

  return link ? (
    <Link to={link} className="stat-card-link">
      {Content}
    </Link>
  ) : (
    <>{Content}</>
  );
};

// Componente para tarjeta de alerta
const AlertCard: React.FC<{
  alert: Alert;
}> = ({ alert }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
      case 'URGENT':
        return '#ef4444';
      case 'MEDIUM':
        return '#f59e0b';
      case 'LOW':
        return '#15803d';
      default:
        return '#6b7280';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'Urgente';
      case 'HIGH':
        return 'Alta';
      case 'MEDIUM':
        return 'Media';
      case 'LOW':
        return 'Baja';
      default:
        return priority;
    }
  };

  const daysUntilDue = Math.ceil(
    (alert.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="alert-card">
      <div
        className="alert-card-priority"
        style={{ backgroundColor: getPriorityColor(alert.priority) + '20' }}
      >
        <span style={{ color: getPriorityColor(alert.priority) }}>
          {getPriorityLabel(alert.priority)}
        </span>
      </div>
      <div className="alert-card-content">
        <h4 className="alert-card-title">{alert.title}</h4>
        <p className="alert-card-description">{alert.description}</p>
        <div className="alert-card-meta">
          <span className="alert-card-due">
            {daysUntilDue > 0 ? `Vence en ${daysUntilDue} días` : 'Vencido'}
          </span>
          <span className="alert-card-type">{alert.relatedToName}</span>
        </div>
      </div>
    </div>
  );
};

// Componente para tarjeta de tarea
const TaskCard: React.FC<{
  task: Task;
}> = ({ task }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return '#ef4444';
      case 'HIGH':
        return '#f59e0b';
      case 'MEDIUM':
        return '#f59e0b';
      case 'LOW':
        return '#15803d';
      default:
        return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#15803d';
      case 'IN_PROGRESS':
        return '#f59e0b';
      case 'PENDING':
        return '#6b7280';
      case 'CANCELLED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="task-card">
      <div className="task-card-header">
        <span
          className="task-card-priority"
          style={{ backgroundColor: getPriorityColor(task.priority) + '20' }}
        >
          <span style={{ color: getPriorityColor(task.priority) }}>
            {task.priority}
          </span>
        </span>
        <span
          className="task-card-status"
          style={{ backgroundColor: getStatusColor(task.status) + '20' }}
        >
          <span style={{ color: getStatusColor(task.status) }}>
            {task.status.replace('_', ' ')}
          </span>
        </span>
      </div>
      <h4 className="task-card-title">{task.title}</h4>
      <p className="task-card-description">{task.description}</p>
      <div className="task-card-meta">
        <span className="task-card-requester">
          Solicitado por: {task.requesterName}
        </span>
        {task.dueDate && (
          <span className="task-card-due">
            Vence: {task.dueDate.toLocaleDateString('es-ES')}
          </span>
        )}
      </div>
    </div>
  );
};

// Componente para gráfico simple de barras
const SimpleBarChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  title: string;
}> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value), 100);

  return (
    <div className="simple-bar-chart">
      <h4 className="chart-title">{title}</h4>
      <div className="chart-container">
        {data.map((item, index) => (
          <div key={index} className="chart-bar-container">
            <div className="chart-bar-info">
              <span className="chart-bar-label">{item.label}</span>
              <span className="chart-bar-value">{item.value}</span>
            </div>
            <div
              className="chart-bar"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({ currentUser }) => {
  const tasks = mockTasks;
  const alerts = mockAlerts;
  const stats = mockAssistantStats;

  // Filtrar tareas pendientes
  const pendingTasks = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
  const urgentTasks = pendingTasks.filter(t => t.priority === 'URGENT');
  const highTasks = pendingTasks.filter(t => t.priority === 'HIGH');

  // Filtrar alertas
  const openAlerts = alerts.filter(a => a.status === 'OPEN');
  const highAlerts = openAlerts.filter(a => a.priority === 'HIGH' || a.priority === 'URGENT');

  // Datos para gráficos
  const tasksByPriority = [
    { label: 'Urgentes', value: stats.tasksByPriority.URGENT || 0, color: '#ef4444' },
    { label: 'Altas', value: stats.tasksByPriority.HIGH || 0, color: '#f59e0b' },
    { label: 'Medias', value: stats.tasksByPriority.MEDIUM || 0, color: '#f59e0b' },
    { label: 'Bajas', value: stats.tasksByPriority.LOW || 0, color: '#15803d' },
  ];

  const tasksByType = [
    { label: 'KYC', value: stats.tasksByType.KYC || 0, color: '#2563eb' },
    { label: 'Contratos', value: stats.tasksByType.CONTRACT || 0, color: '#15803d' },
    { label: 'Reportes', value: stats.tasksByType.REPORT || 0, color: '#7c3aed' },
    { label: 'Documentos', value: stats.tasksByType.DOCUMENT || 0, color: '#f59e0b' },
    { label: 'Seguimiento', value: stats.tasksByType.FOLLOWUP || 0, color: '#06b6d4' },
  ];

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>Bienvenido/a, {currentUser?.name || 'Asistente'}</h1>
          <p className="dashboard-subtitle">
            Panel de control - Soporte operativo a Private Bankers
          </p>
        </div>
        <div className="dashboard-date">
          <span>{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Row 1 */}
      <div className="stats-grid">
        <StatCard
          title="Tareas pendientes"
          value={pendingTasks.length}
          icon={<CheckSquare size={24} />}
          trend={((pendingTasks.length - 10) / 10) * 100}
          color="#2563eb"
          link="/tasks"
        />
        <StatCard
          title="Alertas activas"
          value={openAlerts.length}
          icon={<Bell size={24} />}
          trend={((openAlerts.length - 5) / 5) * 100}
          color="#ef4444"
          link="/alerts"
        />
        <StatCard
          title="Clientes gestionados"
          value={stats.clientsManaged}
          icon={<Users size={24} />}
          trend={15}
          color="#15803d"
          link="/clients"
        />
        <StatCard
          title="Contratos procesados"
          value={stats.contractsProcessed}
          icon={<FileText size={24} />}
          trend={22}
          color="#7c3aed"
          link="/contracts"
        />
      </div>

      {/* Content Grid */}
      <div className="dashboard-grid">
        {/* Alertas urgentes */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>
              <AlertTriangle size={20} />
              Alertas Urgentes
            </h2>
            <Link to="/alerts" className="section-link">
              Ver todas
            </Link>
          </div>
          <div className="section-content">
            {highAlerts.length > 0 ? (
              highAlerts.slice(0, 3).map((alert, index) => (
                <AlertCard key={index} alert={alert} />
              ))
            ) : (
              <div className="empty-state">
                <p>No hay alertas urgentes en este momento</p>
              </div>
            )}
          </div>
        </div>

        {/* Tareas pendientes */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>
              <CheckSquare size={20} />
              Tareas Pendientes
            </h2>
            <Link to="/tasks" className="section-link">
              Ver todas
            </Link>
          </div>
          <div className="section-content">
            {pendingTasks.length > 0 ? (
              pendingTasks.slice(0, 3).map((task, index) => (
                <TaskCard key={index} task={task} />
              ))
            ) : (
              <div className="empty-state">
                <p>No hay tareas pendientes</p>
              </div>
            )}
          </div>
        </div>

        {/* Tareas por prioridad */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>
              <TrendingUp size={20} />
              Tareas por Prioridad
            </h2>
          </div>
          <div className="section-content">
            <SimpleBarChart data={tasksByPriority} title="" />
          </div>
        </div>

        {/* Tareas por tipo */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>
              <BarChart3 size={20} />
              Tareas por Tipo
            </h2>
          </div>
          <div className="section-content">
            <SimpleBarChart data={tasksByType} title="" />
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="dashboard-section stats-summary">
          <div className="section-header">
            <h2>
              <Clock size={20} />
              Este Mes
            </h2>
          </div>
          <div className="section-content">
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-value">{stats.tasksCompleted}</span>
                <span className="summary-label">Tareas completadas</span>
              </div>
              <div className="summary-item">
                <span className="summary-value">{stats.alertsResolved}</span>
                <span className="summary-label">Alertas resueltas</span>
              </div>
              <div className="summary-item">
                <span className="summary-value">{stats.totalHours}h</span>
                <span className="summary-label">Horas trabajadas</span>
              </div>
              <div className="summary-item">
                <span className="summary-value">{stats.activeDays}</span>
                <span className="summary-label">Días activos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
