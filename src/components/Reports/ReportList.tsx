import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AuthUser, ReportTemplate, GeneratedReport } from '../../types';
import { bmredService, storageService, ExportFormat } from '../../services';
import {
  FileText,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Clock,
  CheckCircle,
  File,
  BarChart3,
} from 'lucide-react';
import './ReportList.css';

interface ReportListProps {
  currentUser: AuthUser | null;
}

export const ReportList: React.FC<ReportListProps> = ({ currentUser }) => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'templates' | 'generated'>('templates');
  const [filters, setFilters] = useState<{ type?: string; status?: string }>({});
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [generating, setGenerating] = useState<string | null>(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar plantillas de reportes
        const templatesData = await bmredService.getReportTemplates();
        setTemplates(templatesData);

        // Cargar reportes generados
        if (currentUser) {
          const reportsData = await bmredService.getGeneratedReports(currentUser.prfi);
          setGeneratedReports(reportsData);
        }

        setError(null);
      } catch (err) {
        setError('Error al cargar los reportes');
        console.error('Error loading reports:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Filtrar plantillas
  const filteredTemplates = useMemo(() => {
    const query = searchQuery.toLowerCase();
    let result = [...templates];

    if (query) {
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      );
    }

    if (filters.type) {
      result = result.filter((t) => t.type === filters.type);
    }

    return result;
  }, [templates, searchQuery, filters]);

  // Filtrar reportes generados
  const filteredReports = useMemo(() => {
    const query = searchQuery.toLowerCase();
    let result = [...generatedReports];

    if (query) {
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          (r.parameters && JSON.stringify(r.parameters).toLowerCase().includes(query))
      );
    }

    if (filters.status) {
      result = result.filter((r) => r.status === filters.status);
    }

    return result;
  }, [generatedReports, searchQuery, filters]);

  // Aplicar paginación
  const paginatedData = useMemo(() => {
    const data = activeTab === 'templates' ? filteredTemplates : filteredReports;
    const startIndex = (page - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [filteredTemplates, filteredReports, activeTab, page, pageSize]);

  const totalItems = activeTab === 'templates' ? filteredTemplates.length : filteredReports.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Opciones de filtro
  const templateTypeOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'CLIENT_PORTFOLIO', label: 'Cartera de Clientes' },
    { value: 'CONTRACT_SUMMARY', label: 'Resumen de Contratos' },
    { value: 'KYC_STATUS', label: 'Estado KYC' },
    { value: 'MONTHLY_ACTIVITY', label: 'Actividad Mensual' },
  ];

  const reportStatusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'GENERATED', label: 'Generado' },
    { value: 'EXPORTED', label: 'Exportado' },
    { value: 'FAILED', label: 'Error' },
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

  const handleGenerateReport = async (template: ReportTemplate) => {
    if (!currentUser) {
      setError('Debe iniciar sesión para generar reportes');
      return;
    }

    try {
      setGenerating(template.id);
      
      // Mostrar diálogo para parámetros
      const parameters = await showParameterDialog(template);
      if (!parameters) return; // Usuario canceló

      // Generar reporte
      const newReport = await bmredService.generateReport(
        template.id,
        parameters,
        currentUser.prfi
      );

      // Actualizar lista de reportes generados
      setGeneratedReports((prev) => [newReport, ...prev]);
      setActiveTab('generated');
    } catch (err) {
      setError(`Error al generar reporte: ${err}`);
      console.error('Error generating report:', err);
    } finally {
      setGenerating(null);
    }
  };

  const handleExportReport = async (report: GeneratedReport, format: ExportFormat) => {
    try {
      const result = await storageService.exportData(
        report.data as Record<string, unknown>[],
        report.name,
        format
      );

      if (result.success && result.blob) {
        storageService.downloadFile(result.blob, result.fileName);
      } else {
        setError(result.error || 'Error al exportar');
      }
    } catch (err) {
      setError(`Error al exportar: ${err}`);
      console.error('Error exporting report:', err);
    }
  };

  // Mostrar diálogo de parámetros (simplificado)
  const showParameterDialog = async (
    template: ReportTemplate
  ): Promise<Record<string, unknown> | null> => {
    // Por ahora, devolver parámetros por defecto
    // En una implementación real, mostraría un modal con el formulario
    const defaultParams: Record<string, unknown> = {};
    
    template.parameters.forEach((param) => {
      if (param.defaultValue !== undefined) {
        defaultParams[param.id] = param.defaultValue;
      } else if (param.required && param.options && param.options.length > 0) {
        defaultParams[param.id] = param.options[0].value;
      } else if (param.type === 'SELECT' && param.options && param.options.length > 0) {
        defaultParams[param.id] = param.options[0].value;
      }
    });

    return defaultParams;
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'CLIENT_PORTFOLIO':
        return <FileText size={24} />;
      case 'CONTRACT_SUMMARY':
        return <File size={24} />;
      case 'KYC_STATUS':
        return <CheckCircle size={24} />;
      case 'MONTHLY_ACTIVITY':
        return <BarChart3 size={24} />;
      default:
        return <FileText size={24} />;
    }
  };

  const getTemplateTypeLabel = (type: string) => {
    switch (type) {
      case 'CLIENT_PORTFOLIO':
        return 'Cartera de Clientes';
      case 'CONTRACT_SUMMARY':
        return 'Resumen de Contratos';
      case 'KYC_STATUS':
        return 'Estado KYC';
      case 'MONTHLY_ACTIVITY':
        return 'Actividad Mensual';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GENERATED':
        return '#f59e0b';
      case 'EXPORTED':
        return '#15803d';
      case 'FAILED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'GENERATED':
        return 'Generado';
      case 'EXPORTED':
        return 'Exportado';
      case 'FAILED':
        return 'Error';
      default:
        return status;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && templates.length === 0 && generatedReports.length === 0) {
    return (
      <div className="report-list">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando reportes...</p>
        </div>
      </div>
    );
  }

  if (error && templates.length === 0 && generatedReports.length === 0) {
    return (
      <div className="report-list">
        <div className="error-state">
          <FileText size={48} />
          <h3>Error al cargar reportes</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-list">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>Reportes</h1>
          <p className="header-subtitle">
            Generación y gestión de reportes de clientes, contratos y alertas
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('templates');
            setPage(1);
          }}
        >
          <FileText size={18} />
          <span>Plantillas</span>
          {templates.length > 0 && (
            <span className="tab-badge">{templates.length}</span>
          )}
        </button>
        <button
          className={`tab ${activeTab === 'generated' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('generated');
            setPage(1);
          }}
        >
          <BarChart3 size={18} />
          <span>Generados</span>
          {generatedReports.length > 0 && (
            <span className="tab-badge">{generatedReports.length}</span>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder={activeTab === 'templates' ? 'Buscar plantillas...' : 'Buscar reportes...'}
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
          {activeTab === 'templates' ? (
            <select
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="filter-select"
            >
              {templateTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              {reportStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

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
          Mostrando {paginatedData.length} de {totalItems} {activeTab === 'templates' ? 'plantillas' : 'reportes'}
        </span>
        {Object.keys(filters).length > 0 || searchQuery ? (
          <span className="results-filtered">(filtrados)</span>
        ) : null}
      </div>

      {/* Content */}
      <div className="reports-content">
        {activeTab === 'templates' ? (
          // Plantillas de reporte
          <div className="templates-grid">
            {paginatedData.length > 0 ? (
              (paginatedData as ReportTemplate[]).map((template) => (
                <div key={template.id} className="template-card">
                  <div className="template-card-header">
                    <div className="template-card-icon">
                      {getTemplateIcon(template.type)}
                    </div>
                    <div className="template-card-type">
                      <span>{getTemplateTypeLabel(template.type)}</span>
                    </div>
                  </div>
                  <div className="template-card-body">
                    <h4 className="template-card-name">{template.name}</h4>
                    <p className="template-card-description">{template.description}</p>
                    <div className="template-card-meta">
                      <span className="template-card-params">
                        {template.parameters.length} parámetros
                      </span>
                      {template.parameters.some(p => p.required) && (
                        <span className="template-card-required">
                          Requiere parámetros
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="template-card-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleGenerateReport(template)}
                      disabled={generating === template.id}
                    >
                      {generating === template.id ? (
                        <>
                          <span className="spinner-small"></span>
                          <span>Generando...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={16} />
                          <span>Generar</span>
                        </>
                      )}
                    </button>
                    <Link
                      to={`/reports/templates/${template.id}`}
                      className="btn btn-outline btn-sm"
                    >
                      <FileText size={16} />
                      <span>Ver</span>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FileText size={48} />
                </div>
                <h3>No hay plantillas de reporte</h3>
                <p>No hay plantillas con los criterios de búsqueda actuales</p>
              </div>
            )}
          </div>
        ) : (
          // Reportes generados
          <div className="reports-table">
            {paginatedData.length > 0 ? (
              (paginatedData as GeneratedReport[]).map((report) => (
                <div key={report.id} className="report-card">
                  <div className="report-card-header">
                    <div className="report-card-title">
                      <FileText size={20} />
                      <span>{report.name}</span>
                    </div>
                    <div
                      className="report-card-status"
                      style={{ backgroundColor: getStatusColor(report.status) + '20' }}
                    >
                      <span style={{ color: getStatusColor(report.status) }}>
                        {getStatusLabel(report.status)}
                      </span>
                    </div>
                  </div>
                  <div className="report-card-body">
                    <div className="report-card-info">
                      <span className="report-card-template">
                        Plantilla: {templates.find(t => t.id === report.templateId)?.name || report.templateId}
                      </span>
                      <span className="report-card-date">
                        <Clock size={14} />
                        {formatDate(report.generatedAt)}
                      </span>
                      <span className="report-card-by">
                        Generado por: {report.generatedBy}
                      </span>
                    </div>
                    <div className="report-card-params">
                      {report.parameters && Object.entries(report.parameters).length > 0 ? (
                        <>
                          <strong>Parámetros:</strong>
                          {Object.entries(report.parameters).map(([key, value]) => (
                            <span key={key} className="param-tag">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </>
                      ) : (
                        <span className="no-params">Sin parámetros</span>
                      )}
                    </div>
                  </div>
                  <div className="report-card-actions">
                    {report.exportFormats.map((format) => (
                      <button
                        key={format}
                        className="btn btn-outline btn-sm"
                        onClick={() => handleExportReport(report, format as ExportFormat)}
                      >
                        <Download size={14} />
                        <span>{format}</span>
                      </button>
                    ))}
                    <Link
                      to={`/reports/${report.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      <FileText size={14} />
                      <span>Ver</span>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <BarChart3 size={48} />
                </div>
                <h3>No hay reportes generados</h3>
                <p>No hay reportes generados con los criterios de búsqueda actuales</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setActiveTab('templates')}
                >
                  <Plus size={18} />
                  <span>Generar reporte</span>
                </button>
              </div>
            )}
          </div>
        )}
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

export default ReportList;
