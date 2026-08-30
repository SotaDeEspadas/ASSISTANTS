import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthUser, Client, Contract, Alert, Task } from '../../../types';
import { bmredService, storageService } from '../../../services';
import {
  User,
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  BarChart3,
  FileText,
  Bell,
  CheckSquare,
  Clock,
  AlertTriangle,
  TrendingUp,
  Download,
  Edit,
  Plus,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import './ClientDetailView.css';

interface ClientDetailViewProps {
  currentUser: AuthUser | null;
}

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({ currentUser }) => {
  const { clientCode } = useParams<{ clientCode: string }>();
  const navigate = useNavigate();
  
  const [client, setClient] = useState<Client | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'contracts' | 'alerts' | 'tasks' | 'kyc'>('profile');

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        if (!clientCode || !currentUser) {
          setError('Código de cliente no válido');
          setLoading(false);
          return;
        }

        // Cargar cliente
        const clientData = await bmredService.getClientByCode(clientCode);
        if (!clientData) {
          setError('Cliente no encontrado');
          setLoading(false);
          return;
        }
        setClient(clientData);

        // Cargar contratos del cliente
        const contractsData = await bmredService.getContractsByClient(clientCode);
        setContracts(contractsData);

        // Cargar alertas del cliente
        const alertsData = await bmredService.getAlertsByClient(clientCode);
        setAlerts(alertsData);

        // Cargar tareas relacionadas con el cliente
        const allTasks = await bmredService.getTasks(currentUser.prfi);
        const clientTasks = allTasks.filter((t) => t.relatedClient === clientCode);
        setTasks(clientTasks);

        setError(null);
      } catch (err) {
        setError('Error al cargar los datos del cliente');
        console.error('Error loading client details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [clientCode, currentUser]);

  const handleExport = async () => {
    if (!client) return;
    
    try {
      const result = await storageService.exportClientsToExcel(
        [client],
        `cliente-${client.code}.xlsx`
      );

      if (result.success && result.blob) {
        storageService.downloadFile(result.blob, result.fileName);
      }
    } catch (err) {
      setError(`Error al exportar: ${err}`);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Sin fecha';
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getDNIStatusColor = (status: string) => {
    switch (status) {
      case 'Vigente':
        return '#15803d';
      case 'A punto de caducar':
        return '#f59e0b';
      case 'Caducado':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Conservador':
        return '#15803d';
      case 'Moderado':
        return '#f59e0b';
      case 'Dinámico':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Privilegium':
        return '#003366';
      case 'ATM':
        return '#15803d';
      case 'No Privilegium':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const calculateAge = (birthDate: Date | undefined) => {
    if (!birthDate) return null;
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const getDaysUntilDNIExpiry = () => {
    if (!client) return null;
    if (!client.dniExpiry) return null;
    
    const days = Math.ceil((client.dniExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getDaysUntilKYCExpiry = () => {
    if (!client) return null;
    if (!client.kycsExpiry) return null;
    
    const days = Math.ceil((client.kycsExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="client-detail">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando detalles del cliente...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="client-detail">
        <div className="error-state">
          <User size={48} />
          <h3>{error || 'Cliente no encontrado'}</h3>
          <p>El cliente con código {clientCode} no existe o no está disponible</p>
          <div className="error-actions">
            <button className="btn btn-primary" onClick={() => navigate('/clients')}>
              <ArrowLeft size={18} />
              <span>Volver a Clientes</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const daysUntilDNI = getDaysUntilDNIExpiry();
  const daysUntilKYC = getDaysUntilKYCExpiry();
  const clientAge = calculateAge(client.birthDate);

  return (
    <div className="client-detail">
      {/* Header */}
      <div className="detail-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/clients')}>
            <ArrowLeft size={20} />
            <span>Volver a Clientes</span>
          </button>
          <h1>
            <User size={32} />
            {client.name}
          </h1>
          <p className="client-code">Código: <strong>{client.code}</strong></p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={handleExport}>
            <Download size={18} />
            <span>Exportar</span>
          </button>
          <Link to={`/clients/${client.code}/edit`} className="btn btn-primary">
            <Edit size={18} />
            <span>Editar</span>
          </Link>
        </div>
      </div>

      {/* Client Profile Card */}
      <div className="profile-section">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <User size={48} />
            </div>
            <div className="profile-info">
              <h2>{client.name}</h2>
              <div className="profile-badges">
                <span
                  className="badge"
                  style={{ backgroundColor: getCategoryColor(client.category) + '20' }}
                >
                  <span style={{ color: getCategoryColor(client.category) }}>
                    {client.category}
                  </span>
                </span>
                <span className="badge mifid-badge">
                  {client.mifidCategory}
                </span>
                <span
                  className="badge risk-badge"
                  style={{ backgroundColor: getRiskLevelColor(client.riskLevel) + '20' }}
                >
                  <span style={{ color: getRiskLevelColor(client.riskLevel) }}>
                    Riesgo: {client.riskLevel}
                  </span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="profile-details">
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-label">
                  <Mail size={16} />
                  <span>Email</span>
                </div>
                <div className="detail-value">{client.email}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <Phone size={16} />
                  <span>Teléfono</span>
                </div>
                <div className="detail-value">{client.phone || 'No disponible'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <Phone size={16} />
                  <span>Móvil</span>
                </div>
                <div className="detail-value">{client.mobile || 'No disponible'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <Calendar size={16} />
                  <span>Fecha Nacimiento</span>
                </div>
                <div className="detail-value">{formatDate(client.birthDate)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <span>Edad</span>
                </div>
                <div className="detail-value">{clientAge ? `${clientAge} años` : 'No disponible'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <span>Género</span>
                </div>
                <div className="detail-value">{client.gender}</div>
              </div>
              <div className="detail-item full-width">
                <div className="detail-label">
                  <MapPin size={16} />
                  <span>Dirección</span>
                </div>
                <div className="detail-value">
                  {client.address}, {client.city} ({client.postalCode}), {client.province}
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <span>Idioma</span>
                </div>
                <div className="detail-value">{client.language}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <span>Asesor Asignado</span>
                </div>
                <div className="detail-value">{client.assignedPB}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <span>Fecha de Alta</span>
                </div>
                <div className="detail-value">{formatDate(client.createdAt)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Identification Card */}
        <div className="identification-card">
          <h3>
            <Shield size={20} />
            Documentación de Identificación
          </h3>
          <div className="id-details">
            <div className="id-item">
              <div className="id-label">DNI/NIE</div>
              <div className="id-value">{client.dni}</div>
            </div>
            <div className="id-item">
              <div className="id-label">Estado</div>
              <div
                className="id-status"
                style={{ color: getDNIStatusColor(client.dniStatus) }}
              >
                {client.dniStatus}
              </div>
            </div>
            <div className="id-item">
              <div className="id-label">Fecha Caducidad</div>
              <div className="id-value">{formatDate(client.dniExpiry)}</div>
            </div>
            {daysUntilDNI !== null && (
              <div className="id-item">
                <div className="id-label">Días hasta caducidad</div>
                <div
                  className="id-days"
                  style={{
                    color: daysUntilDNI > 30 ? '#15803d' : daysUntilDNI > 0 ? '#f59e0b' : '#ef4444',
                  }}
                >
                  {daysUntilDNI > 0 ? `${daysUntilDNI} días` : daysUntilDNI === 0 ? 'Hoy' : `${Math.abs(daysUntilDNI)} días caducado`}
                </div>
              </div>
            )}
          </div>

          {/* KYC Status */}
          <div className="kyc-section">
            <h4>
              <CheckSquare size={18} />
              Estado KYC
            </h4>
            <div className="kyc-details">
              <div className="kyc-item">
                <div className="kyc-label">Estado</div>
                <div
                  className="kyc-status"
                  style={{ 
                    color: client.kycsStatus === 'VIGENT' ? '#15803d' : 
                           client.kycsStatus === 'EXPIRED' ? '#ef4444' : '#f59e0b' 
                  }}
                >
                  {client.kycsStatus}
                </div>
              </div>
              <div className="kyc-item">
                <div className="kyc-label">Fecha Caducidad</div>
                <div className="kyc-value">{formatDate(client.kycsExpiry)}</div>
              </div>
              {daysUntilKYC !== null && (
                <div className="kyc-item">
                  <div className="kyc-label">Días hasta caducidad</div>
                  <div
                    className="kyc-days"
                    style={{
                      color: daysUntilKYC > 30 ? '#15803d' : daysUntilKYC > 0 ? '#f59e0b' : '#ef4444',
                    }}
                  >
                    {daysUntilKYC > 0 ? `${daysUntilKYC} días` : daysUntilKYC === 0 ? 'Hoy' : `${Math.abs(daysUntilKYC)} días caducado`}
                  </div>
                </div>
              )}
              <div className="kyc-item">
                <div className="kyc-label">Número de KYCs</div>
                <div className="kyc-value">{client.kycs?.length || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="portfolio-card">
          <h3>
            <BarChart3 size={20} />
            Resumen de Cartera
          </h3>
          <div className="portfolio-stats">
            <div className="portfolio-stat">
              <div className="stat-label">Valor Total</div>
              <div className="stat-value">{formatCurrency(client.portfolioValue)}</div>
            </div>
            <div className="portfolio-stat">
              <div className="stat-label">Número de Contratos</div>
              <div className="stat-value">{contracts.length}</div>
            </div>
            <div className="portfolio-stat">
              <div className="stat-label">Contratos Activos</div>
              <div className="stat-value">
                {contracts.filter((c) => c.status === 'ACTIVE').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={18} />
          <span>Perfil</span>
        </button>
        <button
          className={`tab ${activeTab === 'contracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contracts')}
        >
          <FileText size={18} />
          <span>Contratos</span>
          {contracts.length > 0 && <span className="tab-badge">{contracts.length}</span>}
        </button>
        <button
          className={`tab ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <Bell size={18} />
          <span>Alertas</span>
          {alerts.length > 0 && <span className="tab-badge">{alerts.length}</span>}
        </button>
        <button
          className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <CheckSquare size={18} />
          <span>Tareas</span>
          {tasks.length > 0 && <span className="tab-badge">{tasks.length}</span>}
        </button>
        <button
          className={`tab ${activeTab === 'kyc' ? 'active' : ''}`}
          onClick={() => setActiveTab('kyc')}
        >
          <Shield size={18} />
          <span>KYC</span>
          {client.kycs?.length > 0 && <span className="tab-badge">{client.kycs?.length}</span>}
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'contracts' && (
          <div className="contracts-section">
            <h3>Contratos del Cliente</h3>
            {contracts.length > 0 ? (
              <div className="contracts-table">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Producto</th>
                      <th>Importe</th>
                      <th>Iniciado</th>
                      <th>Finaliza</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((contract) => (
                      <tr key={contract.id}>
                        <td>{contract.code}</td>
                        <td>{contract.productDescription}</td>
                        <td style={{ color: '#003366', fontWeight: 600 }}>
                          {formatCurrency(contract.amount, contract.currency)}
                        </td>
                        <td>{formatDate(contract.startDate)}</td>
                        <td>{formatDate(contract.endDate)}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: 
                                contract.status === 'ACTIVE' ? '#15803d20' :
                                contract.status === 'CANCELLED' ? '#ef444420' :
                                contract.status === 'EXPIRED' ? '#f59e0b20' : '#6b728020',
                              color:
                                contract.status === 'ACTIVE' ? '#15803d' :
                                contract.status === 'CANCELLED' ? '#ef4444' :
                                contract.status === 'EXPIRED' ? '#f59e0b' : '#6b7280',
                            }}
                          >
                            {contract.status === 'ACTIVE' ? 'Activo' :
                             contract.status === 'CANCELLED' ? 'Cancelado' :
                             contract.status === 'EXPIRED' ? 'Vencido' : contract.status}
                          </span>
                        </td>
                        <td>
                          <Link to={`/contracts/${contract.id}`} className="action-link">
                            <Eye size={16} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <FileText size={32} />
                <p>No hay contratos para este cliente</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="alerts-section">
            <h3>Alertas del Cliente</h3>
            {alerts.length > 0 ? (
              <div className="alerts-list">
                {alerts.map((alert) => (
                  <div key={alert.id} className="alert-card">
                    <div className="alert-card-header">
                      <div
                        className="alert-priority"
                        style={{
                          backgroundColor: 
                            alert.priority === 'URGENT' ? '#ef444420' :
                            alert.priority === 'HIGH' ? '#f59e0b20' :
                            alert.priority === 'MEDIUM' ? '#f59e0b20' : '#15803d20',
                        }}
                      >
                        <span style={{
                          color: 
                            alert.priority === 'URGENT' ? '#ef4444' :
                            alert.priority === 'HIGH' ? '#f59e0b' :
                            alert.priority === 'MEDIUM' ? '#f59e0b' : '#15803d',
                        }}>
                          {alert.priority === 'URGENT' ? 'Urgente' :
                           alert.priority === 'HIGH' ? 'Alta' :
                           alert.priority === 'MEDIUM' ? 'Media' : 'Baja'}
                        </span>
                      </div>
                      <div
                        className="alert-status"
                        style={{
                          backgroundColor: alert.status === 'OPEN' ? '#f59e0b20' : '#15803d20',
                        }}
                      >
                        <span style={{ color: alert.status === 'OPEN' ? '#f59e0b' : '#15803d' }}>
                          {alert.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
                        </span>
                      </div>
                    </div>
                    <div className="alert-card-body">
                      <h4>{alert.title}</h4>
                      <p>{alert.description}</p>
                      <div className="alert-meta">
                        <span>Vence: {formatDate(alert.dueDate)}</span>
                        <span>Creada: {formatDate(alert.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Bell size={32} />
                <p>No hay alertas para este cliente</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="tasks-section">
            <h3>Tareas Relacionadas</h3>
            {tasks.length > 0 ? (
              <div className="tasks-list">
                {tasks.map((task) => (
                  <div key={task.id} className="task-card">
                    <div className="task-card-header">
                      <div
                        className="task-priority"
                        style={{
                          backgroundColor: 
                            task.priority === 'URGENT' ? '#ef444420' :
                            task.priority === 'HIGH' ? '#f59e0b20' :
                            task.priority === 'MEDIUM' ? '#f59e0b20' : '#15803d20',
                        }}
                      >
                        <span style={{
                          color: 
                            task.priority === 'URGENT' ? '#ef4444' :
                            task.priority === 'HIGH' ? '#f59e0b' :
                            task.priority === 'MEDIUM' ? '#f59e0b' : '#15803d',
                        }}>
                          {task.priority === 'URGENT' ? 'Urgente' :
                           task.priority === 'HIGH' ? 'Alta' :
                           task.priority === 'MEDIUM' ? 'Media' : 'Baja'}
                        </span>
                      </div>
                      <div
                        className="task-status"
                        style={{
                          backgroundColor: 
                            task.status === 'PENDING' ? '#f59e0b20' :
                            task.status === 'IN_PROGRESS' ? '#3b82f620' :
                            task.status === 'COMPLETED' ? '#15803d20' : '#6b728020',
                        }}
                      >
                        <span style={{
                          color: 
                            task.status === 'PENDING' ? '#f59e0b' :
                            task.status === 'IN_PROGRESS' ? '#3b82f6' :
                            task.status === 'COMPLETED' ? '#15803d' : '#6b7280',
                        }}>
                          {task.status === 'PENDING' ? 'Pendiente' :
                           task.status === 'IN_PROGRESS' ? 'En Progreso' :
                           task.status === 'COMPLETED' ? 'Completada' : task.status}
                        </span>
                      </div>
                    </div>
                    <div className="task-card-body">
                      <h4>{task.title}</h4>
                      <p>{task.description}</p>
                      <div className="task-meta">
                        <span>Tipo: {task.type}</span>
                        <span>Categoría: {task.category}</span>
                        <span>Vence: {formatDate(task.dueDate)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <CheckSquare size={32} />
                <p>No hay tareas relacionadas con este cliente</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'kyc' && (
          <div className="kyc-details-section">
            <h3>Documentos KYC</h3>
            {client.kycs && client.kycs.length > 0 ? (
              <div className="kyc-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                      <th>Fecha Emisión</th>
                      <th>Fecha Caducidad</th>
                      <th>Verificado</th>
                      <th>Verificado por</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.kycs.map((kyc) => (
                      <tr key={kyc.id}>
                        <td>{kyc.id}</td>
                        <td>{kyc.type === 'ID' ? 'DNI/NIE' : kyc.type === 'PASSPORT' ? 'Pasaporte' : kyc.type}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: kyc.status === 'VIGENT' ? '#15803d20' : '#ef444420',
                              color: kyc.status === 'VIGENT' ? '#15803d' : '#ef4444',
                            }}
                          >
                            {kyc.status}
                          </span>
                        </td>
                        <td>{formatDate(kyc.issueDate)}</td>
                        <td>{formatDate(kyc.expiryDate)}</td>
                        <td>
                          <span className="verification-badge" style={{
                            backgroundColor: kyc.verified ? '#15803d20' : '#ef444420',
                            color: kyc.verified ? '#15803d' : '#ef4444',
                          }}>
                            {kyc.verified ? 'Sí' : 'No'}
                          </span>
                        </td>
                        <td>{kyc.verifiedBy || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <Shield size={32} />
                <p>No hay documentos KYC para este cliente</p>
              </div>
            )}
          </div>
        )}
      </div>

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

export default ClientDetailView;
