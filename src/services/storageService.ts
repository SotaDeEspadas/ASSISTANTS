import { Client, Contract, Task, Alert, GeneratedReport } from '../types';

// ============================================================================
// STORAGE SERVICE - Servicio de almacenamiento y exportación de archivos
// ============================================================================

/**
 * Tipo de exportación
 */
export type ExportFormat = 'EXCEL' | 'PDF' | 'WORD' | 'CSV';

/**
 * Opciones de exportación
 */
export interface ExportOptions {
  format: ExportFormat;
  fileName?: string;
  includeHeader?: boolean;
  includeFooter?: boolean;
  columns?: string[];
  orientation?: 'portrait' | 'landscape';
}

/**
 * Resultado de exportación
 */
export interface ExportResult {
  success: boolean;
  url?: string;
  blob?: Blob;
  fileName: string;
  size: number;
  error?: string;
}

/**
 * Configuración de columna para exportación
 */
export interface ColumnConfig {
  key: string;
  label: string;
  width?: number;
  format?: (value: unknown) => string;
}

/**
 * Servicio para manejo de almacenamiento local y exportación de datos.
 * Este servicio proporciona funcionalidad para:
 * - Exportar datos a diferentes formatos (Excel, PDF, Word)
 * - Generar archivos descargables
 * - Manejar almacenamiento en el navegador
 */
export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // ==========================================================================
  // EXPORTACIÓN A EXCEL
  // ==========================================================================

  /**
   * Exportar datos a Excel
   */
  async exportToExcel(
    data: Record<string, unknown>[],
    options: ExportOptions = { format: 'EXCEL' }
  ): Promise<ExportResult> {
    try {
      const fileName = options.fileName || `export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      // Crear libro de trabajo
      // Note: En producción, usar una librería como xlsx o SheetJS
      // Por ahora simulamos la generación
      const blob = await this.createExcelBlob(data, options);
      
      return {
        success: true,
        blob,
        fileName,
        size: blob.size,
      };
    } catch (error) {
      return {
        success: false,
        fileName: '',
        size: 0,
        error: `Error al exportar a Excel: ${error}`,
      };
    }
  }

  /**
   * Crear blob de Excel (simulación)
   */
  private async createExcelBlob(
    data: Record<string, unknown>[],
    options: ExportOptions
  ): Promise<Blob> {
    // Simulación: crear un CSV que Excel puede abrir
    const csvContent = this.convertToCSV(data, options.columns);
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  // ==========================================================================
  // EXPORTACIÓN A PDF
  // ==========================================================================

  /**
   * Exportar datos a PDF
   */
  async exportToPDF(
    data: Record<string, unknown>[],
    title: string,
    options: ExportOptions = { format: 'PDF' }
  ): Promise<ExportResult> {
    try {
      const fileName = options.fileName || `export-${new Date().toISOString().slice(0, 10)}.pdf`;
      
      // Crear contenido HTML para el PDF
      const htmlContent = this.createPDFHtml(data, title, options);
      
      // Usar librería jsPDF o similar para generar el PDF
      // Por ahora simulamos con un blob HTML
      const blob = new Blob([htmlContent], { type: 'text/html' });
      
      return {
        success: true,
        blob,
        fileName,
        size: blob.size,
      };
    } catch (error) {
      return {
        success: false,
        fileName: '',
        size: 0,
        error: `Error al exportar a PDF: ${error}`,
      };
    }
  }

  /**
   * Crear HTML para PDF
   */
  private createPDFHtml(
    data: Record<string, unknown>[],
    title: string,
    options: ExportOptions
  ): string {
    const headers = options.columns || Object.keys(data[0] || {});
    
    const headerRow = headers.map(h => `<th>${h}</th>`).join('');
    const rows = data.map(row => {
      return headers.map(header => {
        const value = (row as Record<string, unknown>)[header];
        return `<td>${value !== undefined ? String(value) : ''}</td>`;
      }).join('');
    }).map(row => `<tr>${row}</tr>`).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #003366; border-bottom: 2px solid #003366; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #003366; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .footer { margin-top: 40px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generado: ${new Date().toLocaleString('es-ES')}</p>
        <table>
          <thead>
            <tr>${headerRow}</tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div class="footer">
          <p>Banco Mediolanum - ASSISTANTS</p>
          <p>Página 1 de 1</p>
        </div>
      </body>
      </html>
    `;
  }

  // ==========================================================================
  // EXPORTACIÓN A WORD
  // ==========================================================================

  /**
   * Exportar datos a Word (DOCX)
   */
  async exportToWord(
    data: Record<string, unknown>[],
    title: string,
    options: ExportOptions = { format: 'WORD' }
  ): Promise<ExportResult> {
    try {
      const fileName = options.fileName || `export-${new Date().toISOString().slice(0, 10)}.docx`;
      
      // Crear contenido HTML para Word
      const htmlContent = this.createWordHtml(data, title, options);
      
      // Word puede abrir HTML
      const blob = new Blob([htmlContent], { type: 'text/html' });
      
      return {
        success: true,
        blob,
        fileName,
        size: blob.size,
      };
    } catch (error) {
      return {
        success: false,
        fileName: '',
        size: 0,
        error: `Error al exportar a Word: ${error}`,
      };
    }
  }

  /**
   * Crear HTML para Word
   */
  private createWordHtml(
    data: Record<string, unknown>[],
    title: string,
    options: ExportOptions
  ): string {
    const headers = options.columns || Object.keys(data[0] || {});
    
    const content = data.map(row => {
      return headers.map(header => {
        const value = (row as Record<string, unknown>)[header];
        return `<p><strong>${header}:</strong> ${value !== undefined ? String(value) : ''}</p>`;
      }).join('');
    }).join('<br/>');

    return `
      <!DOCTYPE html>
      <html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page Section1 { size: 595.3pt 841.9pt; margin: 72pt 72pt 72pt 72pt; }
          div.Section1 { page: Section1; }
        </style>
      </head>
      <body>
        <div class=Section1>
          <h1 style='color: #003366'>${title}</h1>
          <p>Generado: <strong>${new Date().toLocaleString('es-ES')}</strong></p>
          <br/>
          ${content}
          <br/>
          <p style='font-size: 10pt; color: #666;'>Banco Mediolanum - ASSISTANTS</p>
        </div>
      </body>
      </html>
    `;
  }

  // ==========================================================================
  // EXPORTACIÓN A CSV
  // ==========================================================================

  /**
   * Exportar datos a CSV
   */
  async exportToCSV(
    data: Record<string, unknown>[],
    options: ExportOptions = { format: 'CSV' }
  ): Promise<ExportResult> {
    try {
      const fileName = options.fileName || `export-${new Date().toISOString().slice(0, 10)}.csv`;
      const csvContent = this.convertToCSV(data, options.columns);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      return {
        success: true,
        blob,
        fileName,
        size: blob.size,
      };
    } catch (error) {
      return {
        success: false,
        fileName: '',
        size: 0,
        error: `Error al exportar a CSV: ${error}`,
      };
    }
  }

  /**
   * Convertir datos a CSV
   */
  private convertToCSV(
    data: Record<string, unknown>[],
    columns?: string[]
  ): string {
    if (data.length === 0) return '';

    const headers = columns || Object.keys(data[0] || {});
    
    // Formatear headers
    const headerRow = headers.map(h => `"${h}"`).join(',');
    
    // Formatear filas
    const rows = data.map(row => {
      return headers.map(header => {
        const value = (row as Record<string, unknown>)[header];
        const stringValue = value !== undefined ? String(value) : '';
        // Escapar comillas y newlines
        const escaped = stringValue
          .replace(/"/g, '""')
          .replace(/\n/g, '\n')
          .replace(/\r/g, '\r');
        return `"${escaped}"`;
      }).join(',');
    });

    return [headerRow, ...rows].join('\n');
  }

  // ==========================================================================
  // EXPORTACIÓN GENÉRICA
  // ==========================================================================

  /**
   * Exportar datos en el formato especificado
   */
  async exportData(
    data: Record<string, unknown>[],
    title: string,
    format: ExportFormat,
    options: Omit<ExportOptions, 'format'> = {}
  ): Promise<ExportResult> {
    switch (format) {
      case 'EXCEL':
        return this.exportToExcel(data, { ...options, format });
      case 'PDF':
        return this.exportToPDF(data, title, { ...options, format });
      case 'WORD':
        return this.exportToWord(data, title, { ...options, format });
      case 'CSV':
        return this.exportToCSV(data, { ...options, format });
      default:
        return {
          success: false,
          fileName: '',
          size: 0,
          error: `Formato no soportado: ${format}`,
        };
    }
  }

  // ==========================================================================
  // EXPORTACIÓN ESPECÍFICA POR ENTIDAD
  // ==========================================================================

  /**
   * Exportar clientes a Excel
   */
  async exportClientsToExcel(
    clients: Client[],
    fileName?: string
  ): Promise<ExportResult> {
    const columns = [
      'code', 'name', 'dni', 'dniStatus', 'email', 'phone', 'mobile',
      'address', 'city', 'postalCode', 'province', 'birthDate',
      'gender', 'language', 'category', 'mifidCategory', 'riskLevel',
      'kycsStatus', 'assignedPB', 'portfolioValue', 'createdAt'
    ];

    const columnLabels: Record<string, string> = {
      code: 'Código',
      name: 'Nombre',
      dni: 'DNI/NIE',
      dniStatus: 'Estado DNI',
      email: 'Email',
      phone: 'Teléfono',
      mobile: 'Móvil',
      address: 'Dirección',
      city: 'Ciudad',
      postalCode: 'Código Postal',
      province: 'Provincia',
      birthDate: 'Fecha Nacimiento',
      gender: 'Género',
      language: 'Idioma',
      category: 'Categoría',
      mifidCategory: 'Categoría MIFID',
      riskLevel: 'Nivel Riesgo',
      kycsStatus: 'Estado KYC',
      assignedPB: 'PRFI Asesor',
      portfolioValue: 'Valor Cartera',
      createdAt: 'Fecha Alta',
    };

    // Mapear datos
    const exportData = clients.map(client => {
      const mapped: Record<string, unknown> = {};
      columns.forEach(col => {
        let value = (client as Record<string, unknown>)[col];
        
        // Formatear fechas
        if (value instanceof Date) {
          value = value.toLocaleDateString('es-ES');
        }
        
        // Formatear valores numéricos
        if (typeof value === 'number') {
          if (col === 'portfolioValue') {
            value = new Intl.NumberFormat('es-ES', {
              style: 'currency',
              currency: 'EUR'
            }).format(value);
          }
        }
        
        mapped[col] = value;
      });
      return mapped;
    });

    return this.exportToExcel(exportData, {
      format: 'EXCEL',
      fileName: fileName || `clientes-${new Date().toISOString().slice(0, 10)}.xlsx`,
    });
  }

  /**
   * Exportar contratos a Excel
   */
  async exportContractsToExcel(
    contracts: Contract[],
    fileName?: string
  ): Promise<ExportResult> {
    const columns = [
      'code', 'product', 'productDescription', 'amount', 'currency',
      'startDate', 'endDate', 'status', 'clientCode', 'clientName',
      'assignedPB', 'cancellationDate', 'cancellationReason'
    ];

    const columnLabels: Record<string, string> = {
      code: 'Código Contrato',
      product: 'Producto',
      productDescription: 'Descripción Producto',
      amount: 'Importe',
      currency: 'Moneda',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      status: 'Estado',
      clientCode: 'Código Cliente',
      clientName: 'Nombre Cliente',
      assignedPB: 'PRFI Asesor',
      cancellationDate: 'Fecha Cancelación',
      cancellationReason: 'Motivo Cancelación',
    };

    // Mapear datos
    const exportData = contracts.map(contract => {
      const mapped: Record<string, unknown> = {};
      columns.forEach(col => {
        let value = (contract as Record<string, unknown>)[col];
        
        if (value instanceof Date) {
          value = value.toLocaleDateString('es-ES');
        }
        
        if (typeof value === 'number' && col === 'amount') {
          value = new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: contract.currency || 'EUR'
          }).format(value);
        }
        
        mapped[col] = value;
      });
      return mapped;
    });

    return this.exportToExcel(exportData, {
      format: 'EXCEL',
      fileName: fileName || `contratos-${new Date().toISOString().slice(0, 10)}.xlsx`,
    });
  }

  /**
   * Exportar tareas a Excel
   */
  async exportTasksToExcel(
    tasks: Task[],
    fileName?: string
  ): Promise<ExportResult> {
    const columns = [
      'id', 'type', 'title', 'description', 'priority', 'status',
      'createdAt', 'dueDate', 'requester', 'requesterName',
      'assistant', 'assistantName', 'relatedClient', 'relatedClientName',
      'category', 'completedAt'
    ];

    const columnLabels: Record<string, string> = {
      id: 'ID',
      type: 'Tipo',
      title: 'Título',
      description: 'Descripción',
      priority: 'Prioridad',
      status: 'Estado',
      createdAt: 'Fecha Creación',
      dueDate: 'Fecha Límite',
      requester: 'Solicitante PRFI',
      requesterName: 'Solicitante',
      assistant: 'Asistente PRFI',
      assistantName: 'Asistente',
      relatedClient: 'Código Cliente',
      relatedClientName: 'Cliente',
      category: 'Categoría',
      completedAt: 'Fecha Completada',
    };

    // Mapear datos
    const exportData = tasks.map(task => {
      const mapped: Record<string, unknown> = {};
      columns.forEach(col => {
        let value = (task as Record<string, unknown>)[col];
        
        if (value instanceof Date) {
          value = value.toLocaleDateString('es-ES');
        }
        
        mapped[col] = value;
      });
      return mapped;
    });

    return this.exportToExcel(exportData, {
      format: 'EXCEL',
      fileName: fileName || `tareas-${new Date().toISOString().slice(0, 10)}.xlsx`,
    });
  }

  /**
   * Exportar alertas a Excel
   */
  async exportAlertsToExcel(
    alerts: Alert[],
    fileName?: string
  ): Promise<ExportResult> {
    const columns = [
      'id', 'type', 'title', 'description', 'dueDate', 'status',
      'priority', 'createdAt', 'relatedTo', 'relatedToType',
      'relatedToName', 'requiredAction', 'actionNotes'
    ];

    const columnLabels: Record<string, string> = {
      id: 'ID',
      type: 'Tipo',
      title: 'Título',
      description: 'Descripción',
      dueDate: 'Fecha Límite',
      status: 'Estado',
      priority: 'Prioridad',
      createdAt: 'Fecha Creación',
      relatedTo: 'Relacionado con',
      relatedToType: 'Tipo Relación',
      relatedToName: 'Nombre',
      requiredAction: 'Acción Requerida',
      actionNotes: 'Notas',
    };

    // Mapear datos
    const exportData = alerts.map(alert => {
      const mapped: Record<string, unknown> = {};
      columns.forEach(col => {
        let value = (alert as Record<string, unknown>)[col];
        
        if (value instanceof Date) {
          value = value.toLocaleDateString('es-ES');
        }
        
        mapped[col] = value;
      });
      return mapped;
    });

    return this.exportToExcel(exportData, {
      format: 'EXCEL',
      fileName: fileName || `alertas-${new Date().toISOString().slice(0, 10)}.xlsx`,
    });
  }

  // ==========================================================================
  // DESCARGA DE ARCHIVOS
  // ==========================================================================

  /**
   * Descargar archivo generado
   */
  downloadFile(
    blob: Blob,
    fileName: string,
    mimeType?: string
  ): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    if (mimeType) {
      a.type = mimeType;
    }
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  /**
   * Descargar desde URL
   */
  async downloadFromUrl(url: string, fileName: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error al descargar: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      this.downloadFile(blob, fileName);
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      throw error;
    }
  }

  // ==========================================================================
  // ALMACENAMIENTO LOCAL
  // ==========================================================================

  /**
   * Guardar en localStorage
   */
  saveToLocalStorage<T>(key: string, data: T): void {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(key, json);
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
      throw error;
    }
  }

  /**
   * Obtener de localStorage
   */
  getFromLocalStorage<T>(key: string): T | null {
    try {
      const json = localStorage.getItem(key);
      if (json) {
        return JSON.parse(json) as T;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener de localStorage:', error);
      return null;
    }
  }

  /**
   * Eliminar de localStorage
   */
  removeFromLocalStorage(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error al eliminar de localStorage:', error);
      throw error;
    }
  }

  /**
   * Limpiar localStorage
   */
  clearLocalStorage(prefix?: string): void {
    try {
      if (prefix) {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(prefix)) {
            localStorage.removeItem(key);
          }
        });
      } else {
        localStorage.clear();
      }
    } catch (error) {
      console.error('Error al limpiar localStorage:', error);
      throw error;
    }
  }

  // ==========================================================================
  // ALMACENAMIENTO DE SESIÓN
  // ==========================================================================

  /**
   * Guardar en sessionStorage
   */
  saveToSessionStorage<T>(key: string, data: T): void {
    try {
      const json = JSON.stringify(data);
      sessionStorage.setItem(key, json);
    } catch (error) {
      console.error('Error al guardar en sessionStorage:', error);
      throw error;
    }
  }

  /**
   * Obtener de sessionStorage
   */
  getFromSessionStorage<T>(key: string): T | null {
    try {
      const json = sessionStorage.getItem(key);
      if (json) {
        return JSON.parse(json) as T;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener de sessionStorage:', error);
      return null;
    }
  }

  /**
   * Eliminar de sessionStorage
   */
  removeFromSessionStorage(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error al eliminar de sessionStorage:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
export const storageService = StorageService.getInstance();
