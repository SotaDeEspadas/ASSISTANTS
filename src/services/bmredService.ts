import {
  Client,
  Contract,
  Task,
  Alert,
  ReportTemplate,
  GeneratedReport,
  AssistantStats,
  KYCDocument,
  PrivateBanker,
  Assistant,
} from '../types';
import {
  mockClients,
  mockContracts,
  mockTasks,
  mockAlerts,
  mockReportTemplates,
  mockGeneratedReports,
  mockAssistantStats,
  mockPrivateBankers,
  mockAssistant,
} from '../data/mockData';

// ============================================================================
// BMRED SERVICE - Servicio de integración con BMred de Banco Mediolanum
// ============================================================================

/**
 * Servicio para interactuar con los datos de BMred.
 * Actualmente usa datos mock, pero está diseñado para conectarse a la API real.
 */
export class BMredService {
  private static instance: BMredService;

  private constructor() {}

  public static getInstance(): BMredService {
    if (!BMredService.instance) {
      BMredService.instance = new BMredService();
    }
    return BMredService.instance;
  }

  // ==========================================================================
  // CLIENTES
  // ==========================================================================

  /**
   * Obtener todos los clientes del asistente
   */
  async getClients(assistantPRFI: string): Promise<Client[]> {
    // Simular demora de red
    await this.delay(200);

    // Filtrar clientes por los Private Bankers asignados al asistente
    const assistant = mockAssistant;
    const assignedPBcodes = assistant.assignedPB;
    
    return mockClients.filter((client) => 
      assignedPBcodes.includes(client.assignedPB)
    );
  }

  /**
   * Obtener cliente por código
   */
  async getClientByCode(clientCode: string): Promise<Client | null> {
    await this.delay(150);
    return mockClients.find((c) => c.code === clientCode) || null;
  }

  /**
   * Buscar clientes por criterios
   */
  async searchClients(
    assistantPRFI: string,
    searchTerm?: string,
    assignedPB?: string,
    category?: string,
    kycsStatus?: string
  ): Promise<Client[]> {
    await this.delay(250);

    const assistant = mockAssistant;
    const assignedPBcodes = assistant.assignedPB;
    
    let clients = mockClients.filter((c) => 
      assignedPBcodes.includes(c.assignedPB)
    );

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      clients = clients.filter(
        (c) =>
          c.code.toLowerCase().includes(term) ||
          c.name.toLowerCase().includes(term) ||
          c.dni.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          c.phone.includes(term) ||
          c.mobile.includes(term)
      );
    }

    if (assignedPB) {
      clients = clients.filter((c) => c.assignedPB === assignedPB);
    }

    if (category) {
      clients = clients.filter((c) => c.category === category);
    }

    if (kycsStatus) {
      clients = clients.filter((c) => c.kycsStatus === kycsStatus);
    }

    return clients;
  }

  /**
   * Obtener clientes por Private Banker específico
   */
  async getClientsByPrivateBanker(prfi: string): Promise<Client[]> {
    await this.delay(150);
    return mockClients.filter((c) => c.assignedPB === prfi);
  }

  // ==========================================================================
  // CONTRATOS
  // ==========================================================================

  /**
   * Obtener todos los contratos
   */
  async getContracts(assistantPRFI: string): Promise<Contract[]> {
    await this.delay(200);
    return mockContracts;
  }

  /**
   * Obtener contratos por cliente
   */
  async getContractsByClient(clientCode: string): Promise<Contract[]> {
    await this.delay(150);
    return mockContracts.filter((c) => c.clientCode === clientCode);
  }

  /**
   * Obtener contratos por Private Banker
   */
  async getContractsByPrivateBanker(prfi: string): Promise<Contract[]> {
    await this.delay(150);
    return mockContracts.filter((c) => c.assignedPB === prfi);
  }

  /**
   * Obtener contrato por código
   */
  async getContractByCode(contractCode: string): Promise<Contract | null> {
    await this.delay(150);
    return mockContracts.find((c) => c.code === contractCode) || null;
  }

  /**
   * Buscar contratos
   */
  async searchContracts(
    assistantPRFI: string,
    product?: string,
    status?: string,
    startDate?: Date,
    endDate?: Date,
    clientCode?: string
  ): Promise<Contract[]> {
    await this.delay(250);

    let contracts = [...mockContracts];

    if (product) {
      contracts = contracts.filter((c) => c.product === product);
    }

    if (status) {
      contracts = contracts.filter((c) => c.status === status);
    }

    if (startDate) {
      contracts = contracts.filter((c) => 
        c.startDate && c.startDate >= new Date(startDate)
      );
    }

    if (endDate) {
      contracts = contracts.filter((c) => {
        if (c.endDate) {
          return c.endDate <= new Date(endDate);
        }
        return false;
      });
    }

    if (clientCode) {
      contracts = contracts.filter((c) => c.clientCode === clientCode);
    }

    return contracts;
  }

  // ==========================================================================
  // TAREAS
  // ==========================================================================

  /**
   * Obtener todas las tareas del asistente
   */
  async getTasks(assistantPRFI: string): Promise<Task[]> {
    await this.delay(200);
    return mockTasks.filter((t) => t.assistant === assistantPRFI);
  }

  /**
   * Obtener tarea por ID
   */
  async getTaskById(taskId: string): Promise<Task | null> {
    await this.delay(150);
    return mockTasks.find((t) => t.id === taskId) || null;
  }

  /**
   * Crear nueva tarea
   */
  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'history'>): Promise<Task> {
    await this.delay(300);
    
    const newTask: Task = {
      ...task,
      id: (mockTasks.length + 1).toString(),
      createdAt: new Date(),
      history: [
        {
          action: 'CREATED',
          by: task.assistant || 'SYSTEM',
          timestamp: new Date(),
          notes: `Tarea creada: ${task.title}`,
        },
      ],
    };

    mockTasks.push(newTask);
    return newTask;
  }

  /**
   * Actualizar tarea
   */
  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    await this.delay(200);

    const taskIndex = mockTasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return null;

    const updatedTask = {
      ...mockTasks[taskIndex],
      ...updates,
      updatedAt: new Date(),
    };

    // Añadir a historial
    if (updates.status) {
      updatedTask.history = updatedTask.history || [];
      updatedTask.history.push({
        action: `STATUS_CHANGED`,
        by: updates.assistant || 'SYSTEM',
        timestamp: new Date(),
        notes: `Estado cambiado a: ${updates.status}`,
      });
    }

    mockTasks[taskIndex] = updatedTask;
    return updatedTask;
  }

  /**
   * Marcar tarea como completada
   */
  async completeTask(taskId: string, completedBy: string): Promise<Task | null> {
    await this.delay(200);

    const task = await this.updateTask(taskId, {
      status: 'COMPLETED',
      completedAt: new Date(),
    });

    if (task) {
      task.history = task.history || [];
      task.history.push({
        action: 'COMPLETED',
        by: completedBy,
        timestamp: new Date(),
        notes: 'Tarea marcada como completada',
      });
    }

    return task;
  }

  // ==========================================================================
  // ALERTAS
  // ==========================================================================

  /**
   * Obtener todas las alertas
   */
  async getAlerts(assistantPRFI: string): Promise<Alert[]> {
    await this.delay(200);
    return mockAlerts;
  }

  /**
   * Obtener alerta por ID
   */
  async getAlertById(alertId: string): Promise<Alert | null> {
    await this.delay(150);
    return mockAlerts.find((a) => a.id === alertId) || null;
  }

  /**
   * Obtener alertas por tipo
   */
  async getAlertsByType(type: string): Promise<Alert[]> {
    await this.delay(150);
    return mockAlerts.filter((a) => a.type === type);
  }

  /**
   * Obtener alertas por cliente
   */
  async getAlertsByClient(clientCode: string): Promise<Alert[]> {
    await this.delay(150);
    return mockAlerts.filter((a) => a.relatedTo === clientCode);
  }

  /**
   * Cerrar alerta
   */
  async closeAlert(alertId: string, closedBy: string, resolutionNotes?: string): Promise<Alert | null> {
    await this.delay(200);

    const alertIndex = mockAlerts.findIndex((a) => a.id === alertId);
    if (alertIndex === -1) return null;

    const updatedAlert = {
      ...mockAlerts[alertIndex],
      status: 'CLOSED',
      closedAt: new Date(),
      closedBy,
      resolutionNotes,
    };

    mockAlerts[alertIndex] = updatedAlert;
    return updatedAlert;
  }

  // ==========================================================================
  // REPORTES
  // ==========================================================================

  /**
   * Obtener plantillas de reportes
   */
  async getReportTemplates(): Promise<ReportTemplate[]> {
    await this.delay(150);
    return mockReportTemplates;
  }

  /**
   * Obtener plantilla por ID
   */
  async getReportTemplateById(templateId: string): Promise<ReportTemplate | null> {
    await this.delay(150);
    return mockReportTemplates.find((t) => t.id === templateId) || null;
  }

  /**
   * Generar reporte
   */
  async generateReport(
    templateId: string,
    parameters: Record<string, unknown>,
    generatedBy: string
  ): Promise<GeneratedReport> {
    await this.delay(500); // Simular generación más lenta

    const template = mockReportTemplates.find((t) => t.id === templateId);
    if (!template) {
      throw new Error(`Plantilla no encontrada: ${templateId}`);
    }

    // Simular datos generados
    let data: unknown = [];
    switch (template.type) {
      case 'CLIENT_PORTFOLIO':
        data = mockClients.filter((c) => {
          if (parameters.prfi && c.assignedPB !== parameters.prfi) return false;
          if (parameters.zone && c.zone !== parameters.zone) return false;
          if (parameters.office && c.office !== parameters.office) return false;
          return true;
        });
        break;
      case 'CONTRACT_SUMMARY':
        data = mockContracts.filter((c) => {
          if (parameters.prfi && c.assignedPB !== parameters.prfi) return false;
          if (parameters.status && c.status !== parameters.status) return false;
          return true;
        });
        break;
      case 'KYC_STATUS':
        const days = (parameters.days as number) || 30;
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() + days);
        data = mockClients.filter((c) => {
          if (c.kycsExpiry && c.kycsExpiry <= thresholdDate && c.kycsStatus === 'VIGENT') {
            if (parameters.prfi && c.assignedPB !== parameters.prfi) return false;
            return true;
          }
          return false;
        });
        break;
      case 'MONTHLY_ACTIVITY':
        // Filtrar contratos por mes
        const month = parameters.month as Date | undefined;
        const year = parameters.year as number | undefined;
        if (month && year) {
          data = mockContracts.filter((c) => {
            const start = c.startDate || new Date();
            return (
              start.getFullYear() === year &&
              start.getMonth() === month.getMonth()
            );
          });
        } else {
          data = mockContracts;
        }
        break;
    }

    const newReport: GeneratedReport = {
      id: (mockGeneratedReports.length + 1).toString(),
      templateId,
      name: `${template.name} - ${new Date().toLocaleDateString('es-ES')}`,
      generatedAt: new Date(),
      generatedBy,
      parameters,
      data: data as Client[] | Contract[],
      status: 'GENERATED',
      exportFormats: ['EXCEL', 'PDF'],
      fileUrls: {
        EXCEL: `/reports/${templateId}-${Date.now()}.xlsx`,
        PDF: `/reports/${templateId}-${Date.now()}.pdf`,
      },
    };

    mockGeneratedReports.push(newReport);
    return newReport;
  }

  /**
   * Obtener reportes generados
   */
  async getGeneratedReports(assistantPRFI: string): Promise<GeneratedReport[]> {
    await this.delay(150);
    return mockGeneratedReports.filter(
      (r) => r.generatedBy === assistantPRFI || r.generatedBy === 'SYSTEM'
    );
  }

  /**
   * Exportar reporte
   */
  async exportReport(reportId: string, format: 'EXCEL' | 'PDF' | 'WORD'): Promise<string> {
    await this.delay(300);

    const report = mockGeneratedReports.find((r) => r.id === reportId);
    if (!report) {
      throw new Error(`Reporte no encontrado: ${reportId}`);
    }

    // Verificar que el formato es válido
    if (!report.exportFormats.includes(format)) {
      throw new Error(`Formato no soportado: ${format}`);
    }

    // Simular generación de URL de descarga
    const url = report.fileUrls[format];
    if (!url) {
      throw new Error(`URL de ${format} no disponible`);
    }

    // Marcar como exportado
    report.status = 'EXPORTED';
    report.exportedAt = new Date();
    report.exportedBy = 'CURRENT_USER';

    return url;
  }

  // ==========================================================================
  // DOCUMENTOS
  // ==========================================================================

  /**
   * Obtener documentos KYC de un cliente
   */
  async getKYCDocuments(clientCode: string): Promise<KYCDocument[]> {
    await this.delay(150);

    const client = mockClients.find((c) => c.code === clientCode);
    return client?.kycs || [];
  }

  /**
   * Obtener documentos de un contrato
   */
  async getContractDocuments(contractId: string): Promise<string[]> {
    await this.delay(150);

    const contract = mockContracts.find((c) => c.id === contractId);
    return contract?.documents || [];
  }

  /**
   * Subir documento
   */
  async uploadDocument(
    clientCode: string,
    documentType: string,
    fileName: string,
    fileContent: string, // Base64 o URL
    uploadedBy: string
  ): Promise<{ success: boolean; documentId: string; url: string }> {
    await this.delay(300);

    // Simular subida exitosa
    const documentId = `DOC-${Date.now()}`;
    const url = `/documents/${clientCode}/${documentId}/${fileName}`;

    // Actualizar cliente para añadir el documento
    const client = mockClients.find((c) => c.code === clientCode);
    if (client) {
      if (!client.documents) {
        client.documents = [];
      }
      client.documents.push({
        id: documentId,
        type: documentType,
        name: fileName,
        url,
        uploadedAt: new Date(),
        uploadedBy,
      });
    }

    return { success: true, documentId, url };
  }

  // ==========================================================================
  // PRIVATE BANKERS
  // ==========================================================================

  /**
   * Obtener todos los Private Bankers
   */
  async getPrivateBankers(): Promise<PrivateBanker[]> {
    await this.delay(150);
    return mockPrivateBankers;
  }

  /**
   * Obtener Private Banker por PRFI
   */
  async getPrivateBankerByPRFI(prfi: string): Promise<PrivateBanker | null> {
    await this.delay(150);
    return mockPrivateBankers.find((pb) => pb.prfi === prfi) || null;
  }

  // ==========================================================================
  // ASISTENTE
  // ==========================================================================

  /**
   * Obtener información del asistente
   */
  async getAssistant(prfi: string): Promise<Assistant | null> {
    await this.delay(150);
    return mockAssistant.prfi === prfi ? mockAssistant : null;
  }

  /**
   * Obtener estadísticas del asistente
   */
  async getAssistantStats(assistantPRFI: string): Promise<AssistantStats | null> {
    await this.delay(200);
    return mockAssistantStats;
  }

  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================

  /**
   * Obtener dashboard de estadísticas
   */
  async getDashboardStats(assistantPRFI: string): Promise<{
    clientsCount: number;
    contractsCount: number;
    tasksCount: number;
    alertsCount: number;
    portfolioValue: number;
    newClientsThisMonth: number;
    expiredContractsThisMonth: number;
    urgentTasks: number;
  }> {
    await this.delay(200);

    const assistant = mockAssistant;
    const assignedPBcodes = assistant.assignedPB;

    const clients = mockClients.filter((c) => assignedPBcodes.includes(c.assignedPB));
    const contracts = mockContracts.filter((c) => 
      assignedPBcodes.includes(c.assignedPB)
    );
    const tasks = mockTasks.filter((t) => t.assistant === assistantPRFI);
    const alerts = mockAlerts;

    // Calcular portfolio total
    const portfolioValue = clients.reduce((sum, c) => sum + (c.portfolioValue || 0), 0);

    // Clientes nuevos este mes
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const newClientsThisMonth = clients.filter((c) => {
      const created = c.createdAt || new Date();
      return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
    }).length;

    // Contratos que vencen este mes
    const expiredContractsThisMonth = contracts.filter((c) => {
      if (!c.endDate) return false;
      const end = new Date(c.endDate);
      return end.getMonth() === thisMonth && end.getFullYear() === thisYear;
    }).length;

    // Tareas urgentes
    const urgentTasks = tasks.filter((t) => t.priority === 'URGENT' && t.status === 'PENDING').length;

    return {
      clientsCount: clients.length,
      contractsCount: contracts.length,
      tasksCount: tasks.length,
      alertsCount: alerts.length,
      portfolioValue,
      newClientsThisMonth,
      expiredContractsThisMonth,
      urgentTasks,
    };
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  /**
   * Simular demora de red
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ==========================================================================
  // PRODUCTOS (basado en los datos de BMred)
  // ==========================================================================

  /**
   * Obtener lista de productos disponibles
   */
  async getProducts(): Promise<{ code: string; name: string; description: string; category: string }[]> {
    await this.delay(100);

    return [
      {
        code: 'SEGE',
        name: 'Mediolanum Hogar',
        description: 'Seguro de hogar con cobertura integral',
        category: 'Seguros',
      },
      {
        code: 'CUBA',
        name: 'Depósitos',
        description: 'Depósitos a plazo fijo con diferentes condiciones',
        category: 'Ahorro',
      },
      {
        code: 'SEGURVida',
        name: 'Seguro de Vida',
        description: 'Seguros de vida con capital asegurado',
        category: 'Seguros',
      },
      {
        code: 'FONDOS',
        name: 'Fondos de Inversión',
        description: 'Fondos de inversión Mediolanum',
        category: 'Inversión',
      },
      {
        code: 'PIAS',
        name: 'Plan Individual de Ahorro Sistemático',
        description: 'PIAS para ahorro a largo plazo',
        category: 'Inversión',
      },
      {
        code: 'EPSV',
        name: 'Plan de Empleo',
        description: 'Sistemas de empleo',
        category: 'Previsión',
      },
    ];
  }

  /**
   * Obtener información detallada de un producto
   */
  async getProductDetails(productCode: string): Promise<{
    code: string;
    name: string;
    description: string;
    category: string;
    features: string[];
    requirements: string[];
  } | null> {
    await this.delay(150);

    const products = await this.getProducts();
    const product = products.find((p) => p.code === productCode);

    if (!product) return null;

    // Información detallada por producto
    const details: Record<string, { features: string[]; requirements: string[] }> = {
      SEGE: {
        features: [
          'Cobertura de incendio y daños',
          'Responsabilidad civil',
          'Robo y hurto',
          'Asistencia 24 horas',
        ],
        requirements: ['DNI/NIE vigente', 'Justificante de domicilio'],
      },
      CUBA: {
        features: [
          'Tipos de interés competitivos',
          'Plazos flexibles',
          'Renovación automática opcional',
          'Liquidación anticipada con condiciones',
        ],
        requirements: ['Ser cliente de Banco Mediolanum', 'Aportación mínima según producto'],
      },
      SEGURVida: {
        features: [
          'Capital asegurado hasta 50.000€',
          'Cobertura por fallecimiento',
          'Flexibilidad de primas',
        ],
        requirements: ['Cuestionario médico', 'DNI/NIE'],
      },
      FONDOS: {
        features: [
          'Gestión profesional',
          'Diversificación',
          'Liquidabilidad',
        ],
        requirements: ['Test de idoneidad'],
      },
      PIAS: {
        features: [
          'Ventajas fiscales',
          'Ahorro sistemático',
          'Rescate parcial',
        ],
        requirements: ['Test de idoneidad', 'Compromiso mínimo'],
      },
      EPSV: {
        features: [
          'Aportaciones periódicas',
          'Rentabilidad vinculada a mercados',
          'Fiscalidad favorable',
        ],
        requirements: ['Relación laboral'],
      },
    };

    return {
      ...product,
      ...details[productCode],
    };
  }
}

// Exportar instancia singleton
export const bmredService = BMredService.getInstance();
