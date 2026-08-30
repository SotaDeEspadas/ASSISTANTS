import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthUser, Client, FilterParams } from '../../types';
import { mockClients, mockPrivateBankers } from '../../data/mockData';
import {
  Search,
  Plus,
  Edit,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { DataTable } from './DataTable';
import './ClientList.css';

interface ClientListProps {
  currentUser: AuthUser | null;
}

// Columnas para la tabla de clientes
export const clientColumns = [
  { accessorKey: 'code', header: 'Código', width: 100 },
  { accessorKey: 'name', header: 'Nombre', width: 250 },
  { accessorKey: 'dni', header: 'DNI/NIE', width: 120 },
  { accessorKey: 'kycsStatus', header: 'Estado KYC', width: 120 },
  { accessorKey: 'kycsExpiry', header: 'Caducidad KYC', width: 150 },
  { accessorKey: 'assignedPB', header: 'PRFI Asesor', width: 120 },
  { accessorKey: 'portfolioValue', header: 'Patrimonio (€)', width: 120 },
  { accessorKey: 'category', header: 'Categoría', width: 120 },
  { accessorKey: 'phone', header: 'Teléfono', width: 120 },
  { accessorKey: 'email', header: 'Email', width: 200 },
];

export const ClientList: React.FC<ClientListProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterParams>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ASC' | 'DESC' } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtrar clientes por el asistente actual (si tiene PRFIs asignados)
  const filteredByAssistant = currentUser?.assignedPB
    ? mockClients.filter(client => currentUser.assignedPB.includes(client.assignedPB))
    : mockClients;

  // Aplicar búsqueda
  const searchedClients = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return filteredByAssistant;
    return filteredByAssistant.filter(client =>
      client.code.toLowerCase().includes(query) ||
      client.name.toLowerCase().includes(query) ||
      client.dni.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query)
    );
  }, [filteredByAssistant, searchQuery]);

  // Aplicar filtros
  const filteredClients = useMemo(() => {
    let result = [...searchedClients];

    // Filtrar por PRFI
    if (filters.prfi) {
      result = result.filter(client => client.assignedPB === filters.prfi);
    }

    // Filtrar por estado KYC
    if (filters.kycsStatus) {
      result = result.filter(client => client.kycsStatus === filters.kycsStatus);
    }

    // Filtrar por categoría
    if (filters.category) {
      result = result.filter(client => client.category === filters.category);
    }

    return result;
  }, [searchedClients, filters]);

  // Aplicar ordenación
  const sortedClients = useMemo(() => {
    if (!sortConfig) return filteredClients;

    return [...filteredClients].sort((a, b) => {
      const key = sortConfig.key as keyof Client;
      const valueA = a[key];
      const valueB = b[key];

      if (valueA === undefined || valueB === undefined) return 0;

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortConfig.direction === 'ASC'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortConfig.direction === 'ASC' ? valueA - valueB : valueB - valueA;
      }

      if (valueA instanceof Date && valueB instanceof Date) {
        return sortConfig.direction === 'ASC'
          ? valueA.getTime() - valueB.getTime()
          : valueB.getTime() - valueA.getTime();
      }

      return 0;
    });
  }, [filteredClients, sortConfig]);

  // Aplicar paginación
  const paginatedClients = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return sortedClients.slice(startIndex, startIndex + pageSize);
  }, [sortedClients, page, pageSize]);

  const totalItems = sortedClients.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Opciones de filtro
  const prfiOptions = useMemo(() => {
    const prfis = [...new Set(filteredByAssistant.map(c => c.assignedPB))];
    return [{ value: '', label: 'Todos los PRFI' }].concat(
      prfis.map(prfi => ({
        value: prfi,
        label: mockPrivateBankers.find(pb => pb.prfi === prfi)?.name || prfi,
      }))
    );
  }, [filteredByAssistant]);

  const kycsStatusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'VIGENT', label: 'Vigente' },
    { value: 'EXPIRED', label: 'Caducado' },
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'INCOMPLETE', label: 'Incompleto' },
  ];

  const categoryOptions = [
    { value: '', label: 'Todas las categorías' },
    { value: 'Privilegium', label: 'Privilegium' },
    { value: 'ATM', label: 'ATM' },
    { value: 'No Privilegium', label: 'No Privilegium' },
  ];

  const handleRequestSort = (key: string) => {
    if (sortConfig?.key === key) {
      setSortConfig(prev => prev ? {
        ...prev,
        direction: prev.direction === 'ASC' ? 'DESC' : 'ASC'
      } : { key, direction: 'ASC' });
    } else {
      setSortConfig({ key, direction: 'ASC' });
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
    setPage(1); // Resetear a la primera página al filtrar
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setSortConfig(null);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'ASC' ? <SortAsc size={16} /> : <SortDesc size={16} />;
  };

  return (
    <div className="client-list">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>Clientes</h1>
          <p className="header-subtitle">
            Gestión y búsqueda de clientes asignados
          </p>
        </div>
        <div className="header-right">
          <button className="btn btn-primary" onClick={() => navigate('/clients/new')}>
            <Plus size={18} />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar clientes (código, nombre, DNI, email)..."
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
            value={filters.prfi || ''}
            onChange={(e) => handleFilterChange('prfi', e.target.value)}
            className="filter-select"
          >
            {prfiOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.kycsStatus || ''}
            onChange={(e) => handleFilterChange('kycsStatus', e.target.value)}
            className="filter-select"
          >
            {kycsStatusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="filter-select"
          >
            {categoryOptions.map(option => (
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
          Mostrando {paginatedClients.length} de {totalItems} clientes
        </span>
        {Object.keys(filters).length > 0 || searchQuery && (
          <span className="results-filtered">
            (filtrados)
          </span>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        <DataTable
          columns={clientColumns}
          data={paginatedClients}
          sortConfig={sortConfig}
          onRequestSort={handleRequestSort}
          getSortIcon={getSortIcon}
          onRowClick={(row) => navigate(`/clients/${row.code}`)}
        />
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
          <div className="pagination-size">
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="pagination-select"
            >
              <option value={5}>5 por página</option>
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
            </select>
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalItems === 0 && (
        <div className="empty-state">
          <p>No se encontraron clientes con los criterios de búsqueda</p>
          <button className="btn btn-outline" onClick={handleClearFilters}>
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
};
