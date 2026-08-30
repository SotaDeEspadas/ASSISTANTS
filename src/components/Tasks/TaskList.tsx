import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AuthUser, Task } from '../../types';
import { mockTasks } from '../../data/mockData';
import {
  CheckSquare,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import './TaskList.css';

interface TaskListProps {
  currentUser: AuthUser | null;
}

export const TaskList: React.FC<TaskListProps> = ({ currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{ type?: string; status?: string; priority?: string }>({});
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Filtrar tareas por el asistente actual
  const filteredByAssistant = currentUser?.prfi
    ? mockTasks.filter(task => task.assistant === currentUser.prfi)
    : mockTasks;

  // Aplicar búsqueda
  const searchedTasks = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return filteredByAssistant;
    return filteredByAssistant.filter(task =>
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query) ||
      task.requesterName.toLowerCase().includes(query) ||
      task.relatedClientName?.toLowerCase().includes(query)
    );
  }, [filteredByAssistant, searchQuery]);

  // Aplicar filtros
  const filteredTasks = useMemo(() => {
    let result = [...searchedTasks];

    if (filters.type) {
      result = result.filter(task => task.type === filters.type);
    }

    if (filters.status) {
      result = result.filter(task => task.status === filters.status);
    }

    if (filters.priority) {
      result = result.filter(task => task.priority === filters.priority);
    }

    return result;
  }, [searchedTasks, filters]);

  // Aplicar paginación
  const paginatedTasks = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredTasks.slice(startIndex, startIndex + pageSize);
  }, [filteredTasks, page, pageSize]);

  const totalItems = filteredTasks.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Opciones de filtro
  const typeOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'CONTRACT', label: 'Contrato' },
    { value: 'REPORT', label: 'Reporte' },
    { value: 'DOCUMENT', label: 'Documento' },
    { value: 'FOLLOWUP', label: 'Seguimiento' },
    { value: 'KYC', label: 'KYC' },
    { value: 'OTHER', label: 'Otro' },
  ];

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'IN_PROGRESS', label: 'En Proceso' },
    { value: 'COMPLETED', label: 'Completada' },
    { value: 'CANCELLED', label: 'Cancelada' },
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
      case 'PENDING':
        return <Clock size={16} />;
      case 'IN_PROGRESS':
        return <AlertTriangle size={16} />;
      case 'COMPLETED':
        return <CheckCircle size={16} />;
      case 'CANCELLED':
        return <XCircle size={16} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#f59e0b';
      case 'IN_PROGRESS':
        return '#3b82f6';
      case 'COMPLETED':
        return '#15803d';
      case 'CANCELLED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'IN_PROGRESS':
        return 'En Proceso';
      case 'COMPLETED':
        return 'Completada';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CONTRACT':
        return 'Contrato';
      case 'REPORT':
        return 'Reporte';
      case 'DOCUMENT':
        return 'Documento';
      case 'FOLLOWUP':
        return 'Seguimiento';
      case 'KYC':
        return 'KYC';
      case 'OTHER':
        return 'Otro';
      default:
        return type;
    }
  };

  const getDaysUntilDue = (dueDate?: Date) => {
    if (!dueDate) return '';
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
    <div className="task-list">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>Tareas</h1>
          <p className="header-subtitle">
            Gestión de tareas y solicitudes
          </p>
        </div>
        <div className="header-right">
          <button className="btn btn-primary">
            <Plus size={18} />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar tareas..."
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
          Mostrando {paginatedTasks.length} de {totalItems} tareas
        </span>
        {Object.keys(filters).length > 0 || searchQuery ? (
          <span className="results-filtered">(filtradas)</span>
        ) : null}
      </div>

      {/* Task Cards */}
      <div className="tasks-grid">
        {paginatedTasks.length > 0 ? (
          paginatedTasks.map((task, index) => (
            <div key={index} className="task-card">
              <div className="task-card-header">
                <div
                  className="task-card-priority"
                  style={{ backgroundColor: getPriorityColor(task.priority) + '20' }}
                >
                  <span style={{ color: getPriorityColor(task.priority) }}>
                    {getPriorityLabel(task.priority)}
                  </span>
                </div>
                <div
                  className="task-card-status"
                  style={{ backgroundColor: getStatusColor(task.status) + '20' }}
                >
                  <span className="status-icon">
                    {getStatusIcon(task.status)}
                  </span>
                  <span style={{ color: getStatusColor(task.status) }}>
                    {getStatusLabel(task.status)}
                  </span>
                </div>
              </div>
              <div className="task-card-body">
                <h4 className="task-card-title">{task.title}</h4>
                <p className="task-card-description">{task.description}</p>
                <div className="task-card-meta">
                  <span className="task-card-type">
                    {getTypeLabel(task.type)}
                  </span>
                  {task.relatedClientName && (
                    <span className="task-card-related">
                      Cliente: {task.relatedClientName}
                    </span>
                  )}
                </div>
                <div className="task-card-footer">
                  <span className="task-card-requester">
                    Solicitado por: {task.requesterName}
                  </span>
                  {task.dueDate && (
                    <span className="task-card-due">
                      {getDaysUntilDue(task.dueDate)}
                    </span>
                  )}
                </div>
              </div>
              <div className="task-card-actions">
                <Link to={`/tasks/${task.id}`} className="task-action-view">
                  <Eye size={16} />
                  <span>Ver</span>
                </Link>
                {task.status === 'PENDING' && (
                  <button className="task-action-start" onClick={() => alert('Iniciar tarea')}>
                    <AlertTriangle size={16} />
                    <span>Iniciar</span>
                  </button>
                )}
                {task.status === 'IN_PROGRESS' && (
                  <button className="task-action-complete" onClick={() => alert('Completar tarea')}>
                    <CheckCircle size={16} />
                    <span>Completar</span>
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <CheckSquare size={48} />
            </div>
            <h3>No hay tareas</h3>
            <p>No hay tareas con los criterios de búsqueda actuales</p>
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

export default TaskList;
