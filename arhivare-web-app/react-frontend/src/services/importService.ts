// src/services/importService.ts
import { ImportData, ImportResult, ImportOptions, ImportValidation, ImportProgress, ImportDuplicate } from '../types/importTypes';
import { FileProcessor } from '../components/common/FileProcessing';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export class ImportService {
  private static instance: ImportService;
  private progressCallback?: (progress: ImportProgress) => void;

  static getInstance(): ImportService {
    if (!ImportService.instance) {
      ImportService.instance = new ImportService();
    }
    return ImportService.instance;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private getFileUploadHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return {
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * Set progress callback for real-time updates
   */
  setProgressCallback(callback: (progress: ImportProgress) => void): void {
    this.progressCallback = callback;
  }

  private updateProgress(progress: ImportProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  /**
   * Parse and validate uploaded file locally (client-side)
   */
  async parseFile(file: File): Promise<ImportData[]> {
    try {
      this.updateProgress({
        stage: 'parsing',
        processed: 0,
        total: 100,
        message: 'Parsing uploaded file...'
      });

      // Process file locally using FileProcessor
      const data = await FileProcessor.processFile(file);

      this.updateProgress({
        stage: 'parsing',
        processed: 100,
        total: 100,
        message: `Successfully parsed ${data.length} rows`
      });

      return data;
    } catch (error) {
      this.updateProgress({
        stage: 'error',
        processed: 0,
        total: 100,
        message: `File parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      throw error;
    }
  }

  /**
   * Validate data locally and check for duplicates on server
   */
  async validateData(data: ImportData[]): Promise<ImportValidation> {
    try {
      this.updateProgress({
        stage: 'validating',
        processed: 0,
        total: 100,
        message: 'Validating import data...'
      });

      // Client-side validation
      const clientValidation = FileProcessor.validateImportData(data);

      this.updateProgress({
        stage: 'validating',
        processed: 50,
        total: 100,
        message: 'Checking for duplicates...'
      });

      // Server-side duplicate checking
      const response = await fetch(`${API_BASE_URL}/import/validate`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          data: data.filter((_, index) => !clientValidation.errors.some(e => e.row === index + 1))
        })
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.status} ${response.statusText}`);
      }

      const serverValidation = await response.json();

      // Merge client and server validation results
      const finalValidation: ImportValidation = {
        isValid: clientValidation.isValid && serverValidation.isValid,
        errors: [...clientValidation.errors, ...(serverValidation.errors || [])],
        warnings: [...clientValidation.warnings, ...(serverValidation.warnings || [])],
        duplicates: serverValidation.duplicates || [],
        stats: {
          ...clientValidation.stats,
          duplicateRows: serverValidation.duplicates?.length || 0
        }
      };

      this.updateProgress({
        stage: 'validating',
        processed: 100,
        total: 100,
        message: `Validation complete: ${finalValidation.stats.validRows} valid rows, ${finalValidation.errors.length} errors`
      });

      return finalValidation;
    } catch (error) {
      this.updateProgress({
        stage: 'error',
        processed: 0,
        total: 100,
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      throw error;
    }
  }

  /**
   * Execute import process
   */
  async importData(data: ImportData[], options: ImportOptions): Promise<ImportResult> {
    try {
      this.updateProgress({
        stage: 'importing',
        processed: 0,
        total: data.length,
        message: 'Starting import process...'
      });

      const response = await fetch(`${API_BASE_URL}/import/execute`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          data, 
          options,
          clientId: this.generateClientId() // For progress tracking
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Import failed: ${response.status} ${response.statusText}`);
      }

      const result: ImportResult = await response.json();

      this.updateProgress({
        stage: 'complete',
        processed: data.length,
        total: data.length,
        message: `Import complete: ${result.imported} records imported successfully`
      });

      return result;
    } catch (error) {
      this.updateProgress({
        stage: 'error',
        processed: 0,
        total: data.length,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      throw error;
    }
  }

  /**
   * Execute dry run (validation only)
   */
  async dryRunImport(data: ImportData[], options: ImportOptions): Promise<ImportResult> {
    const dryRunOptions = { ...options, dryRun: true, validateOnly: true };
    return this.importData(data, dryRunOptions);
  }

  /**
   * Get available users for assignment (Admin only)
   */
  async getAvailableUsers(): Promise<Array<{ id: number; username: string; company_name?: string; role: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/?role=client&skip=0&limit=100`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  /**
   * Check duplicate detection for specific companies
   */
  async checkDuplicates(companyNames: string[]): Promise<ImportDuplicate[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/import/check-duplicates`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ company_names: companyNames })
      });

      if (!response.ok) {
        throw new Error(`Duplicate check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return [];
    }
  }

  /**
   * Get import progress (for server-side tracking)
   */
  async getImportProgress(clientId: string): Promise<ImportProgress | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/import/progress/${clientId}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Import not found or completed
        }
        throw new Error(`Failed to get progress: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting import progress:', error);
      return null;
    }
  }

  /**
   * Cancel ongoing import process
   */
  async cancelImport(clientId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/import/cancel/${clientId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      return response.ok;
    } catch (error) {
      console.error('Error cancelling import:', error);
      return false;
    }
  }

  /**
   * Upload file to server for processing (alternative approach)
   */
  async uploadFileForProcessing(file: File): Promise<{ fileId: string; data: ImportData[] }> {
    try {
      this.updateProgress({
        stage: 'parsing',
        processed: 0,
        total: 100,
        message: 'Uploading file to server...'
      });

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/import/upload`, {
        method: 'POST',
        headers: this.getFileUploadHeaders(),
        body: formData
      });

      if (!response.ok) {
        throw new Error(`File upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      this.updateProgress({
        stage: 'parsing',
        processed: 100,
        total: 100,
        message: `File uploaded and processed: ${result.data.length} rows`
      });

      return result;
    } catch (error) {
      this.updateProgress({
        stage: 'error',
        processed: 0,
        total: 100,
        message: `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      throw error;
    }
  }

  /**
   * Download CSV template
   */
  downloadTemplate(templateType: 'basic' | 'sample' = 'sample'): void {
    const filename = templateType === 'sample' ? 
      'fond_import_template_with_examples.csv' : 
      'fond_import_template.csv';

    FileProcessor.downloadCSVTemplate(filename);
  }

  /**
   * Estimate import duration based on data size
   */
  estimateImportDuration(dataLength: number): number {
    // Rough estimate: ~100 records per second
    const recordsPerSecond = 100;
    const baseTime = 2; // 2 seconds base time
    
    return Math.max(baseTime, Math.ceil(dataLength / recordsPerSecond));
  }

  /**
   * Generate unique client ID for progress tracking
   */
  private generateClientId(): string {
    return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate file before processing
   */
  static validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedExtensions = ['csv', 'xlsx', 'xls'];
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `Unsupported file format. Allowed formats: ${allowedExtensions.join(', ')}`
      };
    }
    
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
      };
    }
    
    if (file.size === 0) {
      return {
        isValid: false,
        error: 'File is empty'
      };
    }
    
    return { isValid: true };
  }

  /**
   * Get import history (if implemented on backend)
   */
  async getImportHistory(limit: number = 10): Promise<Array<{
    id: string;
    filename: string;
    importedAt: Date;
    recordCount: number;
    success: boolean;
    importedBy: string;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/import/history?limit=${limit}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch import history: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching import history:', error);
      return [];
    }
  }
}