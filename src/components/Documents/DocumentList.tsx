import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AuthUser, KYCDocument } from '../../types';
import { bmredService, storageService } from '../../services';
import {
  Folder,
  FileText,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  File,
  Image,
  Shield,
} from 'lucide-react';
import './DocumentList.css';

interface DocumentListProps {
  currentUser: AuthUser | null;
}

// Tipos de documentos extendidos
interface Document {
  id: string;
  name: string;
  type: 'KYC' | 'CONTRACT' | 'ID' | 'PASSPORT' | 'PROOF_OF_ADDRESS' | 'SIGNATURE' | 'OTHER';
  subtype: string;
  clientCode: string;
  clientName: string;
  uploadDate: Date;
  expiryDate?: Date;
  status: 'VIGENT' | 'EXPIRED' | 'PENDING' | 'REJECTED';
  uploadedBy: string;
  fileSize: number;
  fileUrl: string;
  notes?: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({ currentUser }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{
    type?: string;
    status?: string;
    dateRange?: string;
  }>({});
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [uploading, setUploading] = useState(false);

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        if (!currentUser) {
          setDocuments([]);
          setLoading(false);
          return;
        }

        // Cargar datos mock y transformarlos a documentos
        // En una implementación real, esto vendría de la API
        const mockDocs: Document[] = [
          // Documentos KYC
          {
            id: 'DOC-001',
            name: 'DNI-25140495J.pdf',
            type: 'ID',
            subtype: 'DNI',
            clientCode: '291803',
            clientName: 'Martínez Iglesias, Francisco Javier',
            uploadDate: new Date('2025-01-15'),
            expiryDate: new Date('2030-10-17'),
            status: 'VIGENT',
            uploadedBy: '5591',
            fileSize: 1.2,
            fileUrl: '/documents/291803/dni-25140495j.pdf',
          },
          {
            id: 'DOC-002',
            name: 'Pasaporte-Alexandre.pdf',
            type: 'ID',
            subtype: 'PASSPORT',
            clientCode: '296368',
            clientName: 'Armengol Gasull, Alexandre',
            uploadDate: new Date('2023-10-20'),
            expiryDate: new Date('2032-11-23'),
            status: 'VIGENT',
            uploadedBy: '5591',
            fileSize: 1.8,
            fileUrl: '/documents/296368/pasaporte-alexandre.pdf',
          },
          {
            id: 'DOC-003',
            name: 'DNI-12345678B.pdf',
            type: 'ID',
            subtype: 'DNI',
            clientCode: '123456',
            clientName: 'García López, Ana',
            uploadDate: new Date('2021-01-01'),
            expiryDate: new Date('2024-01-01'),
            status: 'EXPIRED',
            uploadedBy: '5593',
            fileSize: 1.1,
            fileUrl: '/documents/123456/dni-12345678b.pdf',
            notes: 'Necesita renovación urgente',
          },
          // Contratos
          {
            id: 'DOC-004',
            name: 'Contrato-SEGE-291803.pdf',
            type: 'CONTRACT',
            subtype: 'SEGE',
            clientCode: '291803',
            clientName: 'Martínez Iglesias, Francisco Javier',
            uploadDate: new Date('2026-07-25'),
            status: 'VIGENT',
            uploadedBy: 'ASSIST001',
            fileSize: 2.5,
            fileUrl: '/documents/291803/contrato-sege-291803.pdf',
          },
          {
            id: 'DOC-005',
            name: 'Contrato-CUBA-853339.pdf',
            type: 'CONTRACT',
            subtype: 'CUBA',
            clientCode: '853339',
            clientName: 'Morcillo Barrera, María Teresa',
            uploadDate: new Date('2026-03-06'),
            status: 'VIGENT',
            uploadedBy: '5592',
            fileSize: 1.9,
            fileUrl: '/documents/853339/contrato-cuba-853339.pdf',
          },
          {
            id: 'DOC-006',
            name: 'Test-Idoneidad-291803.pdf',
            type: 'KYC',
            subtype: 'IDONEIDAD',
            clientCode: '291803',
            clientName: 'Martínez Iglesias, Francisco Javier',
            uploadDate: new Date('2025-08-01'),
            expiryDate: new Date('2026-08-01'),
            status: 'VIGENT',
            uploadedBy: 'ASSIST001',
            fileSize: 0.8,
            fileUrl: '/documents/291803/test-idoneidad-291803.pdf',
          },
          {
            id: 'DOC-007',
            name: 'Justificante-Domicilio-880856.pdf',
            type: 'PROOF_OF_ADDRESS',
            subtype: 'DOMICILIO',
            clientCode: '880856',
            clientName: 'Martínez Pasto, Itziar',
            uploadDate: new Date('2025-08-10'),
            status: 'PENDING',
            uploadedBy: '5592',
            fileSize: 1.5,
            fileUrl: '/documents/880856/justificante-domicilio-880856.pdf',
            notes: 'Pendiente de verificación',
          },
        ];

        setDocuments(mockDocs);

        // Cargar documentos KYC reales
        if (currentUser) {
          const kycs = await bmredService.getKYCDocuments('291803');
          setKycDocuments(kycs);
        }

        setError(null);
      } catch (err) {
        setError('Error al cargar los documentos');
        console.error('Error loading documents:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Filtrar documentos
  const filteredDocuments = useMemo(() => {
    const query = searchQuery.toLowerCase();
    let result = [...documents];

    if (query) {
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.clientCode.toLowerCase().includes(query) ||
          d.clientName.toLowerCase().includes(query) ||
          d.type.toLowerCase().includes(query) ||
          d.subtype.toLowerCase().includes(query)
      );
    }

    if (filters.type) {
      result = result.filter((d) => d.type === filters.type);
    }

    if (filters.status) {
      result = result.filter((d) => d.status === filters.status);
    }

    // Filtrar por rango de fechas
    if (filters.dateRange) {
      const now = new Date();
      switch (filters.dateRange) {
        case 'thisMonth':
          result = result.filter((d) => {
            const upload = new Date(d.uploadDate);
            return (
              upload.getMonth() === now.getMonth() &&
              upload.getFullYear() === now.getFullYear()
            );
          });
          break;
        case 'lastMonth':
          result = result.filter((d) => {
            const upload = new Date(d.uploadDate);
            const lastMonth = new Date(now);
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            return (
              upload.getMonth() === lastMonth.getMonth() &&
              upload.getFullYear() === lastMonth.getFullYear()
            );
          });
          break;
        case 'expiring':
          result = result.filter((d) => {
            if (!d.expiryDate) return false;
            const expiry = new Date(d.expiryDate);
            const daysDiff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return daysDiff >= 0 && daysDiff <= 30;
          });
          break;
        case 'expired':
          result = result.filter((d) => {
            if (!d.expiryDate) return false;
            return new Date(d.expiryDate) < now;
          });
          break;
      }
    }

    return result;
  }, [documents, searchQuery, filters]);

  // Aplicar paginación
  const paginatedDocuments = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredDocuments.slice(startIndex, startIndex + pageSize);
  }, [filteredDocuments, page, pageSize]);

  const totalItems = filteredDocuments.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Opciones de filtro
  const typeOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'KYC', label: 'KYC' },
    { value: 'ID', label: 'Identificación' },
    { value: 'PASSPORT', label: 'Pasaporte' },
    { value: 'CONTRACT', label: 'Contrato' },
    { value: 'PROOF_OF_ADDRESS', label: 'Domicilio' },
    { value: 'SIGNATURE', label: 'Firma' },
    { value: 'OTHER', label: 'Otro' },
  ];

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'VIGENT', label: 'Vigente' },
    { value: 'EXPIRED', label: 'Caducado' },
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'REJECTED', label: 'Rechazado' },
  ];

  const dateRangeOptions = [
    { value: '', label: 'Todos los periodos' },
    { value: 'thisMonth', label: 'Este mes' },
    { value: 'lastMonth', label: 'Mes pasado' },
    { value: 'expiring', label: 'Por caducar (30 días)' },
    { value: 'expired', label: 'Caducados' },
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

  const handleDownload = (document: Document) => {
    // En una implementación real, descargar desde la URL
    console.log('Descargando documento:', document.name);
    storageService.downloadFromUrl(document.fileUrl, document.name);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // Simular subida
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await storageService.uploadDocument(
        '291803', // clientCode
        'OTHER', // documentType
        file.name,
        '', // fileContent (en real sería el contenido)
        currentUser?.prfi || 'ASSIST001'
      );

      if (result.success) {
        // Añadir el nuevo documento a la lista
        const newDoc: Document = {
          id: result.documentId,
          name: file.name,
          type: 'OTHER',
          subtype: 'OTRO',
          clientCode: '291803',
          clientName: 'Martínez Iglesias, Francisco Javier',
          uploadDate: new Date(),
          status: 'PENDING',
          uploadedBy: currentUser?.prfi || 'ASSIST001',
          fileSize: Math.round(file.size / 1024 / 1024 * 100) / 100,
          fileUrl: result.url,
        };
        setDocuments((prev) => [newDoc, ...prev]);
        setError(null);
      } else {
        setError('Error al subir el documento');
      }
    } catch (err) {
      setError(`Error al subir: ${err}`);
      console.error('Error uploading document:', err);
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ID':
        return <Shield size={20} />;
      case 'PASSPORT':
        return <Shield size={20} />;
      case 'CONTRACT':
        return <FileText size={20} />;
      case 'KYC':
        return <CheckCircle size={20} />;
      case 'PROOF_OF_ADDRESS':
        return <Image size={20} />;
      case 'SIGNATURE':
        return <File size={20} />;
      default:
        return <File size={20} />;
    }
  };

  const getTypeLabel = (type: string, subtype: string) => {
    const labels: Record<string, Record<string, string>> = {
      ID: { ID: 'DNI/NIE', PASSPORT: 'Pasaporte' },
      CONTRACT: { SEGE: 'Contrato Seguro Hogar', CUBA: 'Contrato Depósito', SEGURVida: 'Contrato Seguro Vida' },
      KYC: { IDONEIDAD: 'Test de Idoneidad' },
      PROOF_OF_ADDRESS: { DOMICILIO: 'Justificante de Domicilio' },
    };
    return labels[type]?.[subtype] || subtype || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VIGENT':
        return '#15803d';
      case 'EXPIRED':
        return '#ef4444';
      case 'PENDING':
        return '#f59e0b';
      case 'REJECTED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'VIGENT':
        return 'Vigente';
      case 'EXPIRED':
        return 'Caducado';
      case 'PENDING':
        return 'Pendiente';
      case 'REJECTED':
        return 'Rechazado';
      default:
        return status;
    }
  };

  const formatFileSize = (size: number) => {
    if (size < 1) {
      return `${Math.round(size * 1024)} KB`;
    }
    return `${size} MB`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilExpiry = (expiryDate: Date | undefined) => {
    if (!expiryDate) return null;
    const days = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="document-list">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando documentos...</p>
        </div>
      </div>
    );
  }

  if (error && documents.length === 0) {
    return (
      <div className="document-list">
        <div className="error-state">
          <Folder size={48} />
          <h3>Error al cargar documentos</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="document-list">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>Documentos</h1>
          <p className="header-subtitle">
            Gestión de documentos de clientes - KYC, Contratos, Identificación y más
          </p>
        </div>
        <div className="header-actions">
          <label className="btn btn-primary">
            <Upload size={18} />
            <span>Subir Documento</span>
            <input
              type="file"
              onChange={handleUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar documentos (nombre, cliente, tipo)..."
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
            {typeOptions.map((option) => (
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
          Mostrando {paginatedDocuments.length} de {totalItems} documentos
        </span>
        {Object.keys(filters).length > 0 || searchQuery ? (
          <span className="results-filtered">(filtrados)</span>
        ) : null}
        {totalItems > 0 && (
          <span className="results-total">
            Tamaño total: {formatFileSize(filteredDocuments.reduce((sum, d) => sum + d.fileSize, 0))}
          </span>
        )}
      </div>

      {/* Documents Grid */}
      <div className="documents-grid">
        {paginatedDocuments.length > 0 ? (
          paginatedDocuments.map((document) => {
            const daysUntilExpiry = getDaysUntilExpiry(document.expiryDate);

            return (
              <div key={document.id} className="document-card">
                <div className="document-card-header">
                  <div className="document-icon" style={{ color: getStatusColor(document.status) }}>
                    {getTypeIcon(document.type)}
                  </div>
                  <div
                    className="document-status"
                    style={{ backgroundColor: getStatusColor(document.status) + '20' }}
                  >
                    <span style={{ color: getStatusColor(document.status) }}>
                      {getStatusLabel(document.status)}
                    </span>
                  </div>
                </div>
                <div className="document-card-body">
                  <h4 className="document-name">{document.name}</h4>
                  <p className="document-type">
                    {getTypeLabel(document.type, document.subtype)}
                  </p>
                  <div className="document-meta">
                    <span className="document-client">
                      {document.clientName} ({document.clientCode})
                    </span>
                    <span className="document-date">
                      <Clock size={12} />
                      {formatDate(document.uploadDate)}
                    </span>
                  </div>
                  {document.expiryDate && daysUntilExpiry !== null && (
                    <div className="document-expiry">
                      {daysUntilExpiry > 0 ? (
                        <span
                          className="expiry-badge"
                          style={{ backgroundColor: daysUntilExpiry <= 30 ? '#fef3c7' : '#dcfce7' }}
                        >
                          {daysUntilExpiry <= 30 ? '¡Por caducar!' : `Caduca en ${daysUntilExpiry} días`}
                        </span>
                      ) : (
                        <span className="expiry-badge expired">
                          Caducado hace {Math.abs(daysUntilExpiry)} días
                        </span>
                      )}
                    </div>
                  )}
                  {document.notes && (
                    <div className="document-notes">
                      <span>Notas: {document.notes}</span>
                    </div>
                  )}
                </div>
                <div className="document-card-footer">
                  <span className="document-size">{formatFileSize(document.fileSize)}</span>
                  <span className="document-uploaded">Subido por: {document.uploadedBy}</span>
                </div>
                <div className="document-card-actions">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleDownload(document)}
                  >
                    <Download size={14} />
                    <span>Descargar</span>
                  </button>
                  <Link to={`/documents/${document.id}`} className="btn btn-primary btn-sm">
                    <Eye size={14} />
                    <span>Ver</span>
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <Folder size={48} />
            <h3>No hay documentos</h3>
            <p>No hay documentos con los criterios de búsqueda actuales</p>
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

      {uploading && (
        <div className="upload-toast">
          <div className="spinner-small"></div>
          <span>Subiendo documento...</span>
        </div>
      )}
    </div>
  );
};

export default DocumentList;
