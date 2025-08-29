// src/components/common/ExportUtils.ts
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ExportOptions, ExportField } from '../../types/exportTypes';

export class ExportUtils {
  /**
   * Generate Excel file client-side
   */
  static generateExcel(data: any[], fields: ExportField[], filename: string): void {
    try {
      // Filter and order data based on enabled fields
      const enabledFields = fields.filter(f => f.enabled);
      const headers = enabledFields.map(f => f.label);
      const keys = enabledFields.map(f => f.key);

      // Prepare worksheet data
      const worksheetData = [
        headers, // Header row
        ...data.map(row => keys.map(key => this.formatCellValue(row[key])))
      ];

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const columnWidths = enabledFields.map(field => ({
        wch: field.width || 20
      }));
      ws['!cols'] = columnWidths;

      // Style header row
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const headerCell = ws[XLSX.utils.encode_cell({ r: 0, c: col })];
        if (headerCell) {
          headerCell.s = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'E2E8F0' } },
            alignment: { horizontal: 'center' }
          };
        }
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Export Data');

      // Add metadata sheet
      this.addMetadataSheet(wb, {
        exportedAt: new Date(),
        recordCount: data.length,
        fields: enabledFields.map(f => f.label)
      });

      // Save file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Excel export error:', error);
      throw new Error('Failed to generate Excel file');
    }
  }

  /**
   * Generate CSV file client-side
   */
  static generateCSV(data: any[], fields: ExportField[], filename: string): void {
    try {
      const enabledFields = fields.filter(f => f.enabled);
      const headers = enabledFields.map(f => f.label);
      const keys = enabledFields.map(f => f.key);

      // Prepare CSV data
      const csvData = data.map(row => {
        const csvRow: any = {};
        enabledFields.forEach((field, index) => {
          csvRow[headers[index]] = this.formatCellValue(row[field.key]);
        });
        return csvRow;
      });

      // Generate CSV content
      const csvContent = Papa.unparse(csvData, {
        header: true,
        delimiter: ',',
        quotes: true
      });

      // Download CSV file
      this.downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
    } catch (error) {
      console.error('CSV export error:', error);
      throw new Error('Failed to generate CSV file');
    }
  }

  /**
   * Generate JSON file client-side
   */
  static generateJSON(data: any[], fields: ExportField[], filename: string): void {
    try {
      const enabledFields = fields.filter(f => f.enabled);
      const keys = enabledFields.map(f => f.key);

      // Filter data to include only enabled fields
      const jsonData = data.map(row => {
        const filteredRow: any = {};
        keys.forEach(key => {
          filteredRow[key] = row[key];
        });
        return filteredRow;
      });

      // Add metadata
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          recordCount: jsonData.length,
          fields: enabledFields.map(f => ({ key: f.key, label: f.label }))
        },
        data: jsonData
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      this.downloadBlob(jsonContent, filename, 'application/json;charset=utf-8;');
    } catch (error) {
      console.error('JSON export error:', error);
      throw new Error('Failed to generate JSON file');
    }
  }

  /**
   * Add metadata sheet to Excel workbook
   */
  private static addMetadataSheet(workbook: XLSX.WorkBook, metadata: any): void {
    const metadataData = [
      ['Export Metadata', ''],
      ['Generated At', metadata.exportedAt.toISOString()],
      ['Record Count', metadata.recordCount],
      ['Fields Exported', metadata.fields.join(', ')],
      ['', ''],
      ['Field List', ''],
      ...metadata.fields.map((field: string, index: number) => [
        `Field ${index + 1}`, field
      ])
    ];

    const metadataWs = XLSX.utils.aoa_to_sheet(metadataData);
    
    // Set column widths for metadata sheet
    metadataWs['!cols'] = [{ wch: 20 }, { wch: 50 }];
    
    XLSX.utils.book_append_sheet(workbook, metadataWs, 'Export Info');
  }

  /**
   * Format cell values for export
   */
  private static formatCellValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (value instanceof Date) {
      return value.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  }

  /**
   * Download blob as file
   */
  private static downloadBlob(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Validate export data before processing
   */
  static validateExportData(data: any[], fields: ExportField[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!Array.isArray(data)) {
      errors.push('Export data must be an array');
      return { isValid: false, errors };
    }
    
    if (data.length === 0) {
      errors.push('No data to export');
      return { isValid: false, errors };
    }
    
    const enabledFields = fields.filter(f => f.enabled);
    if (enabledFields.length === 0) {
      errors.push('No fields selected for export');
      return { isValid: false, errors };
    }
    
    // Check if all required fields exist in data
    const sampleRecord = data[0];
    const missingFields = enabledFields.filter(field => 
      !(field.key in sampleRecord)
    );
    
    if (missingFields.length > 0) {
      errors.push(`Missing fields in data: ${missingFields.map(f => f.key).join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get estimated file size
   */
  static estimateFileSize(data: any[], fields: ExportField[], format: 'csv' | 'excel' | 'json'): number {
    if (!data.length) return 0;
    
    const enabledFields = fields.filter(f => f.enabled);
    const sampleRecord = data[0];
    
    // Calculate average row size
    let avgRowSize = 0;
    enabledFields.forEach(field => {
      const value = sampleRecord[field.key];
      if (value !== null && value !== undefined) {
        avgRowSize += String(value).length;
      }
    });
    
    // Add overhead based on format
    switch (format) {
      case 'csv':
        avgRowSize += enabledFields.length * 2; // Commas and quotes
        break;
      case 'excel':
        avgRowSize *= 2; // Excel overhead
        break;
      case 'json':
        avgRowSize += enabledFields.length * 10; // JSON structure overhead
        break;
    }
    
    return (avgRowSize * data.length) + 1024; // Add 1KB for headers/metadata
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate filename with timestamp
   */
  static generateFilename(baseName: string, format: string, includeTimestamp: boolean = true): string {
    let filename = baseName;
    
    if (includeTimestamp) {
      const timestamp = new Date().toISOString()
        .replace(/[:.]/g, '-')
        .split('T')[0]; // YYYY-MM-DD format
      filename += `_${timestamp}`;
    }
    
    const extension = format === 'excel' ? 'xlsx' : format;
    return `${filename}.${extension}`;
  }

  /**
   * Sanitize filename for different operating systems
   */
  static sanitizeFilename(filename: string): string {
    // Remove or replace invalid characters
    return filename
      .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid chars with underscore
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .trim();
  }

  /**
   * Group data by field for analysis
   */
  static groupDataByField(data: any[], groupByField: string): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    data.forEach(record => {
      const key = record[groupByField] || 'Unknown';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(record);
    });
    
    return grouped;
  }

  /**
   * Calculate basic statistics for export data
   */
  static calculateStatistics(data: any[], numericalFields: string[] = []): any {
    const stats = {
      totalRecords: data.length,
      fieldStatistics: {} as Record<string, any>
    };
    
    // Calculate statistics for each field
    const fields = data.length > 0 ? Object.keys(data[0]) : [];
    
    fields.forEach(field => {
      const values = data.map(record => record[field]).filter(v => v !== null && v !== undefined);
      const uniqueValues = new Set(values);
      
      stats.fieldStatistics[field] = {
        totalValues: values.length,
        uniqueValues: uniqueValues.size,
        nullValues: data.length - values.length,
        completeness: (values.length / data.length) * 100
      };
      
      // Add numerical statistics if it's a numerical field
      if (numericalFields.includes(field)) {
        const numericalValues = values
          .map(v => parseFloat(v))
          .filter(v => !isNaN(v));
        
        if (numericalValues.length > 0) {
          stats.fieldStatistics[field].min = Math.min(...numericalValues);
          stats.fieldStatistics[field].max = Math.max(...numericalValues);
          stats.fieldStatistics[field].average = numericalValues.reduce((a, b) => a + b, 0) / numericalValues.length;
        }
      }
    });
    
    return stats;
  }

  /**
   * Sort data by multiple fields
   */
  static sortData(data: any[], sortBy: Array<{ field: string; direction: 'asc' | 'desc' }>): any[] {
    return [...data].sort((a, b) => {
      for (const sort of sortBy) {
        const aValue = a[sort.field];
        const bValue = b[sort.field];
        
        let comparison = 0;
        
        if (aValue < bValue) comparison = -1;
        else if (aValue > bValue) comparison = 1;
        
        if (comparison !== 0) {
          return sort.direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  /**
   * Filter data based on criteria
   */
  static filterData(data: any[], filters: Record<string, any>): any[] {
    return data.filter(record => {
      return Object.entries(filters).every(([field, filterValue]) => {
        const recordValue = record[field];
        
        if (filterValue === null || filterValue === undefined) {
          return true; // No filter applied
        }
        
        if (Array.isArray(filterValue)) {
          return filterValue.includes(recordValue);
        }
        
        if (typeof filterValue === 'string' && filterValue.includes('*')) {
          // Wildcard matching
          const regex = new RegExp(filterValue.replace(/\*/g, '.*'), 'i');
          return regex.test(String(recordValue));
        }
        
        return recordValue === filterValue;
      });
    });
  }

  /**
   * Prepare data for export by applying transformations
   */
  static prepareExportData(
    data: any[], 
    options: {
      fields?: ExportField[];
      filters?: Record<string, any>;
      sortBy?: Array<{ field: string; direction: 'asc' | 'desc' }>;
      groupBy?: string;
    }
  ): any[] {
    let processedData = [...data];
    
    // Apply filters
    if (options.filters) {
      processedData = this.filterData(processedData, options.filters);
    }
    
    // Apply sorting
    if (options.sortBy && options.sortBy.length > 0) {
      processedData = this.sortData(processedData, options.sortBy);
    }
    
    // Apply field selection
    if (options.fields) {
      const enabledFields = options.fields.filter(f => f.enabled);
      const fieldKeys = enabledFields.map(f => f.key);
      
      processedData = processedData.map(record => {
        const filteredRecord: any = {};
        fieldKeys.forEach(key => {
          filteredRecord[key] = record[key];
        });
        return filteredRecord;
      });
    }
    
    return processedData;
  }
}