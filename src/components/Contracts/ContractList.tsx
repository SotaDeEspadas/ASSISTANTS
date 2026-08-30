import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AuthUser, Contract } from '../../types';
import { bmredService, storageService } from '../../services';
import {
  FileText,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Eye,
} from 'lucide-react';
import './ContractList.css';

interface ContractListProps {
  currentUser: AuthUser | null;
}

export const ContractList: React.FC<ContractListProps> = ({ currentUser }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{
    product?: string;
    status?: string;
    assignedPB?: string;
    dateRange?: string;
  }>({});
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [products, setProducts] = useState<{ code: string; name: string; description: string; category: string }[]>([]);
  const [privateBankers, setPrivateBankers] = useState<{ prfi: string; name: string }[]>([]);

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        if (!currentUser) {
          setContracts([]);
          setLoading(false);
          return;
        }

        // Cargar contratos
        const contractsData = await bmredService.getContracts(currentUser.prfi);
        setContracts(contractsData);

        // Cargar productos
        const productsData = await bmredService.getProducts();
        setProducts(productsData);

        // Cargar Private Bankers
        const pbData = await bmredService.getPrivateBankers();
        setPrivateBankers(pbData.map(pb => ({ prfi: pb.prfi, name: pb.name })));

        setError(null);
      } catch (err) {
        setError('Error al cargar los contratos');
        console.error('Error loading contracts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Filtrar contratos
  const filteredContracts = useMemo(() => {
    const assistant = currentUser;
    if (!assistant) return [];

    let result = [...contracts];

    // Filtrar por Private Bankers asignados al asistente
    const assignedPBcodes = assistant.assignedPB;
    result = result.filter((c) => assignedPBcodes.includes(c.assignedPB));

    // Aplicar búsqueda
    const query = searchQuery.toLowerCase();
    if (query) {
      result = result.filter(
        (c) =>
          c.code.toLowerCase().includes(query) ||
          c.clientCode.toLowerCase().includes(query) ||
          c.clientName.toLowerCase().includes(query) ||
          c.product.toLowerCase().includes(query) ||
          c.productDescription.toLowerCase().includes(query)
      );
    }

    // Aplicar filtros
    if (filters.product) {
      result = result.filter((c) => c.product === filters.product);
    }

    if (filters.status) {
      result = result.filter((c) => c.status === filters.status);
    }

    if (filters.assignedPB) {
      result = result.filter((c) => c.assignedPB === filters.assignedPB);
    }

    // Filtrar por rango de fechas
    if (filters.dateRange) {
      const now = new Date();
      switch (filters.dateRange) {
        case 'active':
          result = result.filter((c) => {
            if (!c.endDate) return true; // Contratos sin fecha fin son activos
            const end = new Date(c.endDate);
            return end >= now && c.status === 'ACTIVE';
          });
          break;
        case 'expired':
          result = result.filter((c) => {
            if (!c.endDate) return false;
            const end = new Date(c.endDate);
            return end < now;
          });
          break;
        case 'thisMonth':
          result = result.filter((c) => {
            if (!c.startDate) return false;
            const start = new Date(c.startDate);
            return (
              start.getMonth() === now.getMonth() &&
              start.getFullYear() === now.getFullYear()
            );
          });
          break;
        case 'lastMonth':
          result = result.filter((c) => {
            if (!c.startDate) return false;
            const start = new Date(c.startDate);
            const lastMonth = new Date(now);
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            return (
              start.getMonth() === lastMonth.getMonth() &&
              start.getFullYear() === lastMonth.getFullYear()
            );
          });
          break;
      }
    }

    return result;
  }, [contracts, currentUser, searchQuery, filters]);

  // Aplicar paginación
  const paginatedContracts = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredContracts.slice(startIndex, startIndex + pageSize);
  }, [filteredContracts, page, pageSize]);

  const totalItems = filteredContracts.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Opciones de filtro
  const productOptions = [
    { value: '', label: 'Todos los productos' },
    ...products.map((p) => ({ value: p.code, label: p.name })),
  ];

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'CANCELLED', label: 'Cancelado' },
    { value: 'EXPIRED', label: 'Vencido' },
    { value: 'PENDING', label: 'Pendiente' },
  ];

  const pbOptions = [
    { value: '', label: 'Todos los asesores' },
    ...privateBankers.map((pb) => ({ value: pb.prfi, label: pb.name })),
  ];

  const dateRangeOptions = [
    { value: '', label: 'Todos los periodos' },
    { value: 'active', label: 'Activos' },
    { value: 'expired', label: 'Vencidos' },
    { value: 'thisMonth', label: 'Este mes' },
    { value: 'lastMonth', label: 'Mes pasado' },
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
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

  const handleExport = async (format: 'EXCEL' | 'PDF' | 'CSV') => {
    try {
      const result = await storageService.exportContractsToExcel(
        filteredContracts,
        `contratos-${new Date().toISOString().slice(0, 10)}.${format.toLowerCase()}`
      );

      if (result.success && result.blob) {
        storageService.downloadFile(result.blob, result.fileName);
      } else {
        setError(result.error || 'Error al exportar');
      }
    } catch (err) {
      setError(`Error al exportar: ${err}`);
      console.error('Error exporting contracts:', err);
    }
  };

  const getProductLabel = (productCode: string) => {
    const product = products.find((p) => p.code === productCode);
    return product ? product.name : productCode;
  };

  const getPBName = (prfi: string) => {
    const pb = privateBankers.find((p) => p.prfi === prfi);
    return pb ? pb.name : prfi;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#15803d';
      case 'CANCELLED':
        return '#ef4444';
      case 'EXPIRED':
        return '#f59e0b';
      case 'PENDING':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activo';
      case 'CANCELLED':
        return 'Cancelado';
      case 'EXPIRED':
        return 'Vencido';
      case 'PENDING':
        return 'Pendiente';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle size={14} />;
      case 'CANCELLED':
        return <XCircle size={14} />;
      case 'EXPIRED':
        return <AlertTriangle size={14} />;
      case 'PENDING':
        return <Clock size={14} />;
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Sin fecha';
    return date.toLocaleDateString('es-ES');
  };

  const getDaysUntilExpiry = (endDate: Date | undefined) => {
    if (!endDate) return null;
    const days = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days > 0) {
      return `Vence en ${days} días`;
    } else if (days === 0) {
      return 'Vence hoy';
    } else {
      return `Venció hace ${Math.abs(days)} días`;
    }
  };

  const calculateContractTrend = (contract: Contract) => {
    // Simular tendencia basada en el producto
    const trends: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
      SEGE: { icon: <TrendingUp size={16} />, label: 'Estable', color: '#15803d' },
      CUBA: { icon: <TrendingUp size={16} />, label: '+3.2%', color: '#15803d' },
      SEGURVida: { icon: <TrendingUp size={16} />, label: 'Seguro', color: '#15803d' },
      FONDOS: { icon: <TrendingUp size={16} />, label: '+5.8%', color: '#15803d' },
    };

    const trend = trends[contract.product] || { icon: null, label: '', color: '#6b7280' };
    return trend;
  };

  if (loading) {
    return (
      <div className="contract-list">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando contratos...</p>
        </div>
      </div>
    );
  }

  if (error && contracts.length === 0) {
    return (
      <div className="contract-list">
        <div className="error-state">
          <FileText size={48} />
          <h3>Error al cargar contratos</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="contract-list">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>Contratos</h1>
          <p className="header-subtitle">
            Gestión de contratos de clientes - Seguros, Depósitos, Fondos y más
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-outline"
            onClick={() => handleExport('EXCEL')}
            title="Exportar a Excel"
          >
            <Download size={18} />
            <span className="hide-mobile">Excel</span>
          </button>
          <button
            className="btn btn-outline"
            onClick={() => handleExport('PDF')}
            title="Exportar a PDF"
          >
            <FileText size={18} />
            <span className="hide-mobile">PDF</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar contratos (código, cliente, producto)..."
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
            value={filters.product || ''}
            onChange={(e) => handleFilterChange('product', e.target.value)}
            className="filter-select"
          >
            {productOptions.map((option) => (
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
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.assignedPB || ''}
            onChange={(e) => handleFilterChange('assignedPB', e.target.value)}
            className="filter-select"
          >
            {pbOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.dateRange || ''}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="filter-select"
          >
            {dateRangeOptions.map((option) => (
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
          Mostrando {paginatedContracts.length} de {totalItems} contratos
        </span>
        {Object.keys(filters).length > 0 || searchQuery ? (
          <span className="results-filtered">(filtrados)</span>
        ) : null}
        {totalItems > 0 && (
          <span className="results-total">
            Total: {formatCurrency(filteredContracts.reduce((sum, c) => sum + (c.amount || 0), 0))}
          </span>
        )}
      </div>

      {/* Contracts Table */}
      <div className="contracts-table-container">
        <table className="contracts-table">
          <thead>
            <tr>
              <th className="col-code">Código</th>
              <th className="col-client">Cliente</th>
              <th className="col-product">Producto</th>
              <th className="col-amount">Importe</th>
              <th className="col-start-date">Iniciado</th>
              <th className="col-end-date">Finaliza</th>
              <th className="col-status">Estado</th>
              <th className="col-pb">Asesor</th>
              <th className="col-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedContracts.length > 0 ? (
              paginatedContracts.map((contract) => {
                const trend = calculateContractTrend(contract);
                const daysUntilExpiry = getDaysUntilExpiry(contract.endDate);

                return (
                  <tr key={contract.id} className="contract-row">
                    <td className="col-code">
                      <div className="cell-content">
                        <span className="contract-code">{contract.code}</span>
                      </div>
                    </td>
                    <td className="col-client">
                      <div className="cell-content">
                        <span className="client-name">{contract.clientName}</span>
                        <span className="client-code">{contract.clientCode}</span>
                      </div>
                    </td>
                    <td className="col-product">
                      <div className="cell-content">
                        <span className="product-name">{getProductLabel(contract.product)}</span>
                        <span className="product-desc">{contract.productDescription}</span>
                      </div>
                    </td>
                    <td className="col-amount">
                      <div className="cell-content">
                        <span className="amount">
                          {formatCurrency(contract.amount, contract.currency)}
                        </span>
                        {trend.icon && (
                          <span
                            className="trend"
                            style={{ color: trend.color }}
                            title={trend.label}
                          >
                            {trend.icon}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="col-start-date">
                      <div className="cell-content">
                        {formatDate(contract.startDate)}
                      </div>
                    </td>
                    <td className="col-end-date">
                      <div className="cell-content">
                        {formatDate(contract.endDate)}
                        {daysUntilExpiry && (
                          <span
                            className="days-until"
                            style={{
                              color:
                                daysUntilExpiry.includes('Vence en') && !daysUntilExpiry.includes('hace')
                                  ? '#ef4444'
                                  : daysUntilExpiry.includes('Vence hoy')
                                  ? '#f59e0b'
                                  : '#6b7280',
                            }}
                          >
                            {daysUntilExpiry}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="col-status">
                      <div
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(contract.status) + '20' }}
                      >
                        <span className="status-icon" style={{ color: getStatusColor(contract.status) }}>
                          {getStatusIcon(contract.status)}
                        </span>
                        <span style={{ color: getStatusColor(contract.status) }}>
                          {getStatusLabel(contract.status)}
                        </span>
                      </div>
                      {contract.cancellationReason && (
                        <span
                          className="cancellation-reason"
                          title={contract.cancellationReason}
                        >
                          {contract.cancellationReason.substring(0, 20)}...
                        </span>
                      )}
                    </td>
                    <td className="col-pb">
                      <div className="cell-content">
                        <span className="pb-name">{getPBName(contract.assignedPB)}</span>
                        <span className="pb-code">{contract.assignedPB}</span>
                      </div>
                    </td>
                    <td className="col-actions">
                      <div className="action-buttons">
                        <Link
                          to={`/contracts/${contract.id}`}
                          className="action-button action-view"
                          title="Ver detalle"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          className="action-button action-export"
                          onClick={() => {
                            const singleContractData = [contract];
                            storageService
                              .exportContractsToExcel(singleContractData)
                              .then((result) => {
                                if (result.success && result.blob) {
                                  storageService.downloadFile(
                                    result.blob,
                                    `contrato-${contract.code}.xlsx`
                                  );
                                }
                              });
                          }}
                          title="Exportar"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">
                    <FileText size={48} />
                    <h3>No hay contratos</h3>
                    <p>No hay contratos con los criterios de búsqueda actuales</p>
                    {(Object.keys(filters).length > 0 || searchQuery) && (
                      <button className="btn btn-primary" onClick={handleClearFilters}>
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            <span>
              Página {page} de {totalPages}
            </span>
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

      {/* Summary Cards */}
      {filteredContracts.length > 0 && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-card-content">
              <TrendingUp size={24} className="summary-card-icon" />
              <div className="summary-card-info">
                <span className="summary-card-value">
                  {formatCurrency(filteredContracts.reduce((sum, c) => sum + (c.amount || 0), 0))}
                </span>
                <span className="summary-card-label">Total Invertido</span>
              </div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-content">
              <CheckCircle size={24} className="summary-card-icon" style={{ color: '#15803d' }} />
              <div className="summary-card-info">
                <span className="summary-card-value">
                  {filteredContracts.filter((c) => c.status === 'ACTIVE').length}
                </span>
                <span className="summary-card-label">Activos</span>
              </div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-content">
              <AlertTriangle size={24} className="summary-card-icon" style={{ color: '#f59e0b' }} />
              <div className="summary-card-info">
                <span className="summary-card-value">
                  {filteredContracts.filter((c) => c.status === 'EXPIRED' || (c.endDate && new Date(c.endDate) < new Date())).length}
                </span>
                <span className="summary-card-label">Por Vencer</span>
              </div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-content">
              <XCircle size={24} className="summary-card-icon" style={{ color: '#ef4444' }} />
              <div className="summary-card-info">
                <span className="summary-card-value">
                  {filteredContracts.filter((c) => c.status === 'CANCELLED').length}
                </span>
                <span className="summary-card-label">Cancelados</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-toast">
          <span>{error}</span>
          <button className="error-close" onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ContractList;
