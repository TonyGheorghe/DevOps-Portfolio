// src/services/exportService.ts
import { 
  ExportOptions, 
  ExportResult, 
  ExportProgress, 
  ExportTemplate, 
  EXPORT_TEMPLATES, 
  AVAILABLE_EXPORT_FIELDS,
  ExportStatistics
} from '../types/exportTypes';
import Papa from 'papaparse';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export class ExportService {
  private static instance: ExportService;
  private progressCallback?: (progress: ExportProgress) => void;

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * Set progress callback for real-time updates
   */
  setProgressCallback(callback: (progress: ExportProgress) => void): void {
    this.progressCallback = callback;
  }

  private updateProgress(progress: ExportProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  /**
   * Export funds data
   */
  async exportFunds(options: ExportOptions): Promise<ExportResult> {
    try {
      this.updateProgress({
        stage: 'preparing',
        processed: 0,
        total: 100,
        message: 'Preparing export request...'
      });

      const response = await fetch(`${API_BASE_URL}/export/funds`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          ...options,
          clientId: this.generateClientId()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Export failed: ${response.status} ${response.statusText}`);
      }

      this.updateProgress({
        stage: 'processing',
        processed: 50,
        total: 100,
        message: 'Processing export data...'
      });

      const result: ExportResult = await response.json();

      this.updateProgress({
        stage: 'complete',
        processed: 100,
        total: 100,
        message: `Export complete: ${result.recordCount} records exported`
      });

      return result;
    } catch (error) {
      this.updateProgress({
        stage: 'error',
        processed: 0,
        total: 100,
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      throw error;
    }
  }

  /**
   * Export statistics and reports
   */
  async exportStatistics(filters: any, format: 'csv' | 'excel' | 'pdf' = 'excel'): Promise<ExportResult> {
    try {
      this.updateProgress({
        stage: 'preparing',
        processed: 0,
        total: 100,
        message: 'Generating statistics report...'
      });

      const response = await fetch(`${API_BASE_URL}/export/statistics`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          filters,
          format,
          clientId: this.generateClientId()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Statistics export failed: ${response.status} ${response.statusText}`);
      }

      this.updateProgress({
        stage: 'generating',
        processed: 80,
        total: 100,
        message: 'Generating report file...'
      });

      const result: ExportResult = await response.json();

      this.updateProgress({
        stage: 'complete',
        processed: 100,
        total: 100,
        message: 'Statistics report generated successfully'
      });

      return result;
    } catch (error) {
      this.updateProgress({
        stage: 'error',
        processed: 0,
        total: 100,
        message: `Statistics export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      throw error;
    }
  }

  /**
   * Export using predefined template
   */
  async exportWithTemplate(templateId: string, additionalFilters: any = {}): Promise<ExportResult> {
    const template = EXPORT_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const exportOptions: ExportOptions = {
      format: template.format,
      fields: template.defaultFields,
      filters: {
        ...template.defaultFilters,
        ...additionalFilters
      },
      includeStatistics: template.format === 'pdf'
    };

    return this.exportFunds(exportOptions);
  }

  /**
   * Download generated export file
   */
  async downloadFile(downloadUrl: string, filename: string): Promise<void> {
    try {
      this.updateProgress({
        stage: 'preparing',
        processed: 0,
        total: 100,
        message: 'Starting download...'
      });

      const response = await fetch(downloadUrl, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      // Get content length for progress tracking
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Unable to read response body');
      }

      const chunks: Uint8Array[] = [];
      let downloaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        downloaded += value.length;

        if (total > 0) {
          this.updateProgress({
            stage: 'processing',
            processed: Math.round((downloaded / total) * 80), // Reserve 20% for file processing
            total: 100,
            message: `Downloading: ${this.formatBytes(downloaded)}${total > 0 ? ` / ${this.formatBytes(total)}` : ''}...`
          });
        }
      }

      // Combine chunks
      const allData = new Uint8Array(downloaded);
      let position = 0;
      for (const chunk of chunks) {
        allData.set(chunk, position);
        position += chunk.length;
      }

      this.updateProgress({
        stage: 'processing',
        processed: 90,
        total: 100,
        message: 'Processing downloaded file...'
      });

      // Create blob and download
      const blob = new Blob([allData], { 
        type: response.headers.get('content-type') || 'application/octet-stream' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);

      this.updateProgress({
        stage: 'complete',
        processed: 100,
        total: 100,
        message: 'Download complete!'
      });

    } catch (error) {
      this.updateProgress({
        stage: 'error',
        processed: 0,
        total: 100,
        message: `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      throw error;
    }
  }

  /**
   * Get available export templates for user role
   */
  getTemplatesForRole(userRole: string): ExportTemplate[] {
    return EXPORT_TEMPLATES.filter(template => 
      template.userRoles.includes(userRole)
    );
  }

  /**
   * Get available export fields
   */
  getAvailableFields(): typeof AVAILABLE_EXPORT_FIELDS {
    return AVAILABLE_EXPORT_FIELDS;
  }

  /**
   * Validate export options
   */
  validateExportOptions(options: ExportOptions): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!options.format) {
      errors.push('Export format is required');
    }

    if (!options.fields || options.fields.length === 0) {
      errors.push('At least one field must be selected');
    }

    const enabledFields = options.fields.filter(f => f.enabled);
    if (enabledFields.length === 0) {
      errors.push('At least one field must be enabled');
    }

    // Validate date range if provided
    if (options.filters.dateRange) {
      const { start, end } = options.filters.dateRange;
      if (start && end && start > end) {
        errors.push('Start date must be before end date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Preview export data (first N records)
   */
  async previewExport(options: ExportOptions, limit: number = 10): Promise<any[]> {
    try {
      const previewOptions = {
        ...options,
        filters: {
          ...options.filters,
          limit
        }
      };

      const response = await fetch(`${API_BASE_URL}/export/preview`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(previewOptions)
      });

      if (!response.ok) {
        throw new Error(`Preview failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Export preview error:', error);
      return [];
    }
  }

  /**
   * Get export progress for long-running exports
   */
  async getExportProgress(clientId: string): Promise<ExportProgress | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/export/progress/${clientId}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get progress: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting export progress:', error);
      return null;
    }
  }

  /**
   * Cancel ongoing export process
   */
  async cancelExport(clientId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/export/cancel/${clientId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      return response.ok;
    } catch (error) {
      console.error('Error cancelling export:', error);
      return false;
    }
  }

  /**
   * Get export history
   */
  async getExportHistory(limit: number = 20): Promise<Array<{
    id: string;
    filename: string;
    format: string;
    recordCount: number;
    fileSize: number;
    exportedAt: Date;
    exportedBy: string;
    downloadUrl?: string;
    expiresAt?: Date;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/export/history?limit=${limit}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch export history: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching export history:', error);
      return [];
    }
  }

  /**
   * Client-side CSV export (for small datasets)
   */
  exportToCSVClient(data: any[], fields: string[], filename: string = 'export.csv'): void {
    try {
      const csvContent = Papa.unparse(data, {
        columns: fields,
        header: true
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Client-side CSV export error:', error);
      throw new Error('Failed to export CSV');
    }
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Generate unique client ID for progress tracking
   */
  private generateClientId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Estimate export duration based on record count
   */
  estimateExportDuration(recordCount: number, format: string): number {
    let recordsPerSecond: number;
    
    switch (format) {
      case 'csv':
        recordsPerSecond = 1000;
        break;
      case 'excel':
        recordsPerSecond = 500;
        break;
      case 'json':
        recordsPerSecond = 800;
        break;
      case 'pdf':
        recordsPerSecond = 100;
        break;
      default:
        recordsPerSecond = 500;
    }

    const baseTime = 3; // 3 seconds base time
    return Math.max(baseTime, Math.ceil(recordCount / recordsPerSecond));
  }

  /**
   * Get suggested filename based on export options
   */
  getSuggestedFilename(options: ExportOptions, userRole?: string): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const formatExt = options.format === 'excel' ? 'xlsx' : options.format;
    
    let baseName = 'export';
    
    if (userRole === 'admin') {
      baseName = 'admin_funds_export';
    } else if (userRole === 'audit') {
      baseName = 'audit_report';
    } else if (userRole === 'client') {
      baseName = 'my_funds_export';
    }
    
    if (options.filters.userIds && options.filters.userIds.length === 1) {
      baseName += '_single_user';
    }
    
    if (options.includeStatistics) {
      baseName += '_with_stats';
    }
    
    return `${baseName}_${timestamp}.${formatExt}`;
  }
}