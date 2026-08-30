import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AuthUser, Alert } from '../../types';
import { mockAlerts } from '../../data/mockData';
import {
  Bell,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import './AlertList.css';

interface AlertListProps {
  currentUser: AuthUser | null;
}

export const AlertList: React.FC<AlertListProps> = ({ currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{ type?: string; status?: string; priority?: string }>({});
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Filtrar alertas por el asistente actual
  const filteredByAssistant = currentUser?.assignedPB
    ? mockAlerts.filter(alert => {
        // Obtener el cliente o contrato relacionado
        const client = mockAlerts.find(a => a.id === alert.id);
        if (!client) return true;
        // En un futuro, filtrar por PRFI del cliente
        return true;
      })
    : mockAlerts;

  // Aplicar búsqueda
  const searchedAlerts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return filteredByAssistant;
    return filteredByAssistant.filter(alert =>
      alert.title.toLowerCase().includes(query) ||
      alert.description.toLowerCase().includes(query) ||
      alert.relatedToName.toLowerCase().includes(query)
    );
  }, [filteredByAssistant, searchQuery]);

  // Aplicar filtros
  const filteredAlerts = useMemo(() => {
    let result = [...searchedAlerts];

    if (filters.type) {
      result = result.filter(alert => alert.type === filters.type);
    }

    if (filters.status) {
      result = result.filter(alert => alert.status === filters.status);
    }

    if (filters.priority) {
      result = result.filter(alert => alert.priority === filters.priority);
    }

    return result;
  }, [searchedAlerts, filters]);

  // Aplicar paginación
  const paginatedAlerts = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredAlerts.slice(startIndex, startIndex + pageSize);
  }, [filteredAlerts, page, pageSize]);

  const totalItems = filteredAlerts.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Opciones de filtro
  const typeOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'KYC_EXPIRY', label: 'KYC Caducado' },
    { value: 'DNI_EXPIRY', label: 'DNI Caducado' },
    { value: 'CONTRACT_EXPIRY', label: 'Contrato a Vencer' },
    { value: 'DOCUMENT_MISSING', label: 'Documento Faltante' },
    { value: 'CLIENT_FOLLOWUP', label: 'Seguimiento Cliente' },
  ];

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'OPEN', label: 'Abierta' },
    { value: 'RESOLVED', label: 'Resuelta' },
    { value: 'IGNORED', label: 'Ignorada' },
  ];

  const priorityOptions = [
    { value: '', label: 'Todas las prioridades' },
    { value: 'URGENT', label: 'Urgente' },
    { value: 'HIGH', label: 'Alta' },
    { value: 'MEDIUM', label: 'Media' },
    { value: 'LOW', label: 'Baja' },
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Clock size={16} />;
      case 'RESOLVED':
        return <CheckCircle size={16} />;
      case 'IGNORED':
        return <XCircle size={16} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return '#f59e0b';
      case 'RESOLVED':
        return '#15803d';
      case 'IGNORED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'KYC_EXPIRY':
        return 'KYC Caducado';
      case 'DNI_EXPIRY':
        return 'DNI Caducado';
      case 'CONTRACT_EXPIRY':
        return 'Contrato a Vencer';
      case 'DOCUMENT_MISSING':
        return 'Documento Faltante';
      case 'CLIENT_FOLLOWUP':
        return 'Seguimiento Cliente';
      default:
        return type;
    }
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const days = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days > 0) {
      return `Vence en ${days} días`;
    } else if (days === 0) {
      return 'Vence hoy';
    } else {
      return `Venció hace ${Math.abs(days)} días`;
    }
  };

  return (
    <div className="alert-list">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>Alertas</h1>
          <p className="header-subtitle">
            Gestión de alertas y recordatorios para clientes
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar alertas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="filters">
          <select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="filter-select"
          >
            {typeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.priority || ''}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="filter-select"
          >
            {priorityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {(searchQuery || Object.keys(filters).length > 0) && (
            <button className="btn btn-outline" onClick={handleClearFilters}>
              <Filter size={16} />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Info */}
      <div className="results-info">
        <span>
          Mostrando {paginatedAlerts.length} de {totalItems} alertas
        </span>
        {Object.keys(filters).length > 0 || searchQuery ? (
          <span className="results-filtered">(filtradas)</span>
        ) : null}
      </div>

      {/* Alert Cards */}
      <div className="alerts-grid">
        {paginatedAlerts.length > 0 ? (
          paginatedAlerts.map((alert, index) => (
            <div key={index} className="alert-card">
              <div className="alert-card-header">
                <div
                  className="alert-card-priority"
                  style={{ backgroundColor: getPriorityColor(alert.priority) + '20' }}
                >
                  <span style={{ color: getPriorityColor(alert.priority) }}>
                    {getPriorityLabel(alert.priority)}
                  </span>
                </div>
                <div
                  className="alert-card-status"
                  style={{ backgroundColor: getStatusColor(alert.status) + '20' }}
                >
                  <span className="status-icon">
                    {getStatusIcon(alert.status)}
                  </span>
                  <span style={{ color: getStatusColor(alert.status) }}>
                    {alert.status === 'OPEN' ? 'Abierta' : alert.status === 'RESOLVED' ? 'Resuelta' : 'Ignorada'}
                  </span>
                </div>
              </div>
              <div className="alert-card-body">
                <h4 className="alert-card-title">{alert.title}</h4>
                <p className="alert-card-description">{alert.description}</p>
                <div className="alert-card-meta">
                  <span className="alert-card-type">
                    {getTypeLabel(alert.type)}
                  </span>
                  <span className="alert-card-related">
                    {alert.relatedToName}
                  </span>
                </div>
                <div className="alert-card-footer">
                  <span className="alert-card-due">
                    {getDaysUntilDue(alert.dueDate)}
                  </span>
                  <span className="alert-card-date">
                    Creada: {alert.createdAt.toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
              <div className="alert-card-actions">
                <Link to={`/alerts/${alert.id}`} className="alert-action-view">
                  <Eye size={16} />
                  <span>Ver</span>
                </Link>
                {alert.status === 'OPEN' && (
                  <button className="alert-action-resolve" onClick={() => alert('Resolver alerta')}>
                    <CheckCircle size={16} />
                    <span>Resolver</span>
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Bell size={48} />
            </div>
            <h3>No hay alertas</h3>
            <p>No hay alertas con los criterios de búsqueda actuales</p>
            {(Object.keys(filters).length > 0 || searchQuery) && (
              <button className="btn btn-primary" onClick={handleClearFilters}>
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            <span>Página {page} de {totalPages}</span>
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-button"
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
            >
              <ChevronLeft size={20} />
              <ChevronLeft size={20} />
            </button>
            <button
              className="pagination-button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft size={20} />
            </button>
            <span className="pagination-current">{page}</span>
            <button
              className="pagination-button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight size={20} />
            </button>
            <button
              className="pagination-button"
              onClick={() => handlePageChange(totalPages)}
              disabled={page === totalPages}
            >
              <ChevronRight size={20} />
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertList;
