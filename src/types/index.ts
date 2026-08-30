// ============================================================================
// TIPOS PRINCIPALES PARA ASSISTANTS
// ============================================================================

// ==================== AUTENTICACIÓN ====================
export type UserRole = 'assistant' | 'supervisor' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username: string;
  prfi: string;
  role: UserRole;
  zone: string;
  office: string;
  assignedPB: string[]; // PRFIs de Private Bankers asignados
}

// ==================== ESTADOS ====================
export type TrafficLight = 'GREEN' | 'YELLOW' | 'RED';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type AlertStatus = 'OPEN' | 'RESOLVED' | 'IGNORED';
export type AlertPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ContractStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PENDING';
export type KYCStatus = 'VIGENT' | 'EXPIRED' | 'PENDING' | 'INCOMPLETE';

// ==================== ASISTENTE ====================
export interface Assistant {
  id: string;
  prfi: string;
  name: string;
  email: string;
  zone: string;
  office: string;
  assignedPB: string[]; // PRFIs de Private Bankers que apoya
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ==================== CLIENTE ====================
export interface Client {
  code: string; // Código de cliente en BMred
  name: string;
  dni: string;
  dniExpiry: Date;
  dniStatus: string; // Situación DNI
  email?: string;
  phone?: string;
  mobile?: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  birthDate: Date;
  gender: string;
  language: string;
  
  // Categorización
  category?: string; // Privilegium, ATM, etc.
  mifidCategory: string; // Categoría MiFID
  riskLevel: string; // Nivel de riesgo
  
  // KYC
  kycs: KYCDocument[];
  kycsStatus: KYCStatus;
  kycsExpiry?: Date;
  
  // Relación con Private Banker
  assignedPB: string; // PRFI del Private Banker asignado
  
  // Cartera
  contracts: Contract[];
  portfolioValue?: number;
  
  // Fechas
  createdAt: Date;
  updatedAt: Date;
}

export interface KYCDocument {
  id: string;
  type: 'ID' | 'PASSPORT' | 'ADDRESS' | 'INCOME' | 'OTHER';
  status: KYCStatus;
  issueDate: Date;
  expiryDate: Date;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  notes?: string;
}

// ==================== CONTRATO ====================
export interface Contract {
  id: string;
  code: string; // Número de contrato
  product: string; // SEGE, CUBA, SEGURVida, etc.
  productDescription: string;
  amount: number;
  currency: string;
  startDate: Date;
  endDate?: Date;
  status: ContractStatus;
  cancellationDate?: Date;
  cancellationReason?: string;
  
  // Datos del cliente asociado
  clientCode: string;
  clientName: string;
  
  // Asesor
  assignedPB: string; // PRFI
  
  // Documentos
  documents: Document[];
  
  // Fechas
  createdAt: Date;
  updatedAt: Date;
}

// ==================== DOCUMENTO ====================
export interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  path: string; // URL o path en SharePoint
  size: number; // en bytes
  mimeType: string;
  uploadedBy: string; // PRFI
  uploadedAt: Date;
  expiryDate?: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'ARCHIVED';
  notes?: string;
}

// ==================== TAREA ====================
export interface Task {
  id: string;
  type: 'CONTRACT' | 'REPORT' | 'DOCUMENT' | 'FOLLOWUP' | 'KYC' | 'OTHER';
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: Date;
  dueDate?: Date;
  completedAt?: Date;
  
  // Solicitante y responsable
  requester: string; // PRFI del Private Banker
  requesterName: string;
  assistant: string; // PRFI del asistente
  assistantName: string;
  
  // Relaciones
  relatedClient?: string; // Código cliente
  relatedClientName?: string;
  relatedContract?: string; // Número de contrato
  relatedContractName?: string;
  category: string;
  
  // Archivos adjuntos
  attachments?: FileReference[];
  
  // Historial
  history?: TaskHistory[];
}

export interface FileReference {
  id: string;
  name: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface TaskHistory {
  id: string;
  action: string;
  performedBy: string;
  performedAt: Date;
  notes?: string;
}

// ==================== ALERTA ====================
export interface Alert {
  id: string;
  type: 'DNI_EXPIRY' | 'KYC_EXPIRY' | 'CONTRACT_EXPIRY' | 'DOCUMENT_MISSING' | 'CLIENT_FOLLOWUP';
  title: string;
  description: string;
  dueDate: Date;
  status: AlertStatus;
  priority: AlertPriority;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  
  // Relación
  relatedTo: string; // Cliente, Contrato, etc.
  relatedToType: 'CLIENT' | 'CONTRACT' | 'DOCUMENT';
  relatedToName: string;
  
  // Acción requerida
  requiredAction: string;
  actionNotes?: string;
}

// ==================== REPORTE ====================
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'CLIENT_PORTFOLIO' | 'CONTRACT_SUMMARY' | 'KYC_STATUS' | 'MONTHLY_ACTIVITY' | 'ZONE_SUMMARY';
  parameters: ReportParameter[];
  query: string; // Consulta para Dataverse/BMred
  createdBy: string;
  createdAt: Date;
}

export interface ReportParameter {
  id: string;
  name: string;
  type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT';
  required: boolean;
  defaultValue?: any;
  options?: { value: string; label: string }[];
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  name: string;
  generatedAt: Date;
  generatedBy: string; // PRFI
  parameters: Record<string, any>;
  data: any; // Datos del reporte
  status: 'GENERATED' | 'EXPORTED' | 'SENT';
  exportFormats?: ('PDF' | 'EXCEL' | 'WORD')[];
  fileUrls?: Record<'PDF' | 'EXCEL' | 'WORD', string>;
}

// ==================== PRIVATE BANKER ====================
export type AgentCategory =
  | 'PR-W'    // Wealth Advisor (≥ 50M€)
  | 'PRIV'    // Private Banker (≥ 23M€)
  | 'TG-FB'   // Top Global Family Banker (≥ 23M€)
  | 'G-FB'    // Global Family Banker (≥ 15M€)
  | 'GB'      // Global Banker
  | 'PAT-J'   // Patrimonial Manager (≥ 23M€)
  | 'PAT-M'   // Patrimonial Manager
  | 'PROF'    // Professional Banker (≥ 10M€)
  | 'FB'      // Family Banker
  | 'BANAX';

export type CategoryGroup =
  | 'WEALTH_ADVISOR'
  | 'PRIVATE_BANKER'
  | 'GLOBAL_BANKER'
  | 'PATRIMONIAL_MANAGER'
  | 'PROFESSIONAL'
  | 'FAMILY_BANKER';

export interface PrivateBanker {
  prfi: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  office: string;
  zone: string;
  region: string;
  
  // Categorización
  category: AgentCategory;
  categoryGroup: CategoryGroup;
  categoryName: string;
  
  // Cartera
  clientsCount: number;
  portfolioValue: number;
  
  // Fechas
  hireDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== SESIÓN DE TRABAJO ====================
export interface WorkSession {
  id: string;
  assistantId: string;
  assistantPRFI: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // en minutos
  tasksCompleted: number;
  notes?: string;
}

// ==================== ESTADÍSTICAS ====================
export interface AssistantStats {
  assistantId: string;
  assistantPRFI: string;
  period: string; // 'TODAY', 'WEEK', 'MONTH', 'YEAR', 'CUSTOM'
  startDate: Date;
  endDate: Date;
  
  // Tareas
  tasksCompleted: number;
  tasksPending: number;
  tasksByPriority: Record<TaskPriority, number>;
  tasksByType: Record<string, number>;
  avgTaskDuration: number; // minutos
  
  // Alertas
  alertsResolved: number;
  alertsPending: number;
  alertsByType: Record<string, number>;
  alertsResolvedOnTime: number;
  
  // Clientes
  clientsManaged: number;
  contractsProcessed: number;
  newClients: number;
  
  // Tiempo
  totalHours: number;
  activeDays: number;
}

// ==================== CONFIGURACIÓN ====================
export interface AppConfig {
  azureAd: {
    clientId: string;
    tenantId: string;
    authority: string;
    redirectUri: string;
    scopes: string[];
  };
  api: {
    baseUrl: string;
  };
  dataverse: {
    url: string;
  };
  featureFlags: {
    enableOfflineMode: boolean;
    enablePWA: boolean;
    enableAnalytics: boolean;
  };
}

// ==================== RESPUESTA DE API ====================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface FilterParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  [key: string]: any;
}
