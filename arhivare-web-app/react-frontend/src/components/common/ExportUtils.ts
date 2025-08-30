// src/components/common/ExportUtils.ts
// Versiune îmbunătățită, cu typing generic, opțiuni CSV (BOM, delimiter),
// clarificări pentru SheetJS (styles nu sunt aplicate în varianta community),
// utilitare pentru estimare dimensiune și pregătire date.

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ExportField } from '../../types/exportTypes';

export type ExportFormat = 'csv' | 'excel' | 'json';

export interface CsvOptions {
  delimiter?: string; // default: ',' (recomand ';' pentru Excel în unele locale)
  addUtf8Bom?: boolean; // default: true, ca Excel să detecteze corect UTF-8
  alwaysQuote?: boolean; // default: true
}

export interface ExcelOptions {
  sheetName?: string; // default: 'Export Data'
  infoSheet?: boolean; // default: true → include foaie cu metadata
}

export interface JsonOptions {
  pretty?: boolean; // default: true
}

export class ExportUtils {
  /**
   * Generează fișier Excel pe client
   * Notă: SheetJS (xlsx) community **nu aplică stiluri** (cell.s). Pentru styling real
   * e nevoie de alte pachete sau de varianta Pro. Lăsăm capul de tabel ca text simplu.
   */
  static generateExcel<T extends Record<string, any>>(
    data: T[],
    fields: ExportField[],
    filename: string,
    options: ExcelOptions = {}
  ): void {
    try {
      const sheetName = options.sheetName ?? 'Export Data';
      const enabledFields = fields.filter(f => f.enabled);
      const headers = enabledFields.map(f => f.label);
      const keys = enabledFields.map(f => f.key as keyof T);

      // Pregătim matricea [ [header...], [row...], ... ]
      const worksheetData: (string | number | boolean | null)[][] = [
        headers,
        ...data.map(row => keys.map(key => this.formatCellValue(row[key])))
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);

      // Lățimi coloane (opțional, suportat)
      const columnWidths = enabledFields.map(field => ({ wch: field.width || 20 }));
      (ws as any)['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      if (options.infoSheet !== false) {
        this.addMetadataSheet(wb, {
          exportedAt: new Date(),
          recordCount: data.length,
          fields: enabledFields.map(f => f.label)
        });
      }

      const safe = this.sanitizeFilename(filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
      XLSX.writeFile(wb, safe);
    } catch (error) {
      console.error('Excel export error:', error);
      throw new Error('Failed to generate Excel file');
    }
  }

  /**
   * Generează fișier CSV pe client
   */
  static generateCSV<T extends Record<string, any>>(
    data: T[],
    fields: ExportField[],
    filename: string,
    opts: CsvOptions = {}
  ): void {
    try {
      const enabledFields = fields.filter(f => f.enabled);
      const headers = enabledFields.map(f => f.label);
      const keys = enabledFields.map(f => f.key as keyof T);

      const csvData = data.map(row => {
        const csvRow: Record<string, string | number | boolean | null> = {};
        enabledFields.forEach((field, index) => {
          csvRow[headers[index]] = this.formatCellValue(row[keys[index]]);
        });
        return csvRow;
      });

      const delimiter = opts.delimiter ?? ',';
      const alwaysQuote = opts.alwaysQuote ?? true;
      const addUtf8Bom = opts.addUtf8Bom ?? true; // Excel friendly

      const csvContent = Papa.unparse(csvData, {
        header: true,
        delimiter,
        quotes: alwaysQuote
      });

      const mime = 'text/csv;charset=utf-8;';
      const safe = this.ensureExtension(filename, 'csv');
      this.downloadBlob(csvContent, safe, mime, { addUtf8Bom });
    } catch (error) {
      console.error('CSV export error:', error);
      throw new Error('Failed to generate CSV file');
    }
  }

  /**
   * Generează fișier JSON pe client
   */
  static generateJSON<T extends Record<string, any>>(
    data: T[],
    fields: ExportField[],
    filename: string,
    options: JsonOptions = {}
  ): void {
    try {
      const enabledFields = fields.filter(f => f.enabled);
      const keys = enabledFields.map(f => f.key as keyof T);

      const jsonData = data.map(row => {
        const obj: Record<string, any> = {};
        keys.forEach(key => {
          obj[String(key)] = row[key];
        });
        return obj;
      });

      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          recordCount: jsonData.length,
          fields: enabledFields.map(f => ({ key: f.key, label: f.label }))
        },
        data: jsonData
      };

      const pretty = options.pretty ?? true;
      const jsonContent = JSON.stringify(exportData, null, pretty ? 2 : 0);
      const safe = this.ensureExtension(filename, 'json');
      this.downloadBlob(jsonContent, safe, 'application/json;charset=utf-8;');
    } catch (error) {
      console.error('JSON export error:', error);
      throw new Error('Failed to generate JSON file');
    }
  }

  /**
   * Foaie cu metadata pentru Excel
   */
  private static addMetadataSheet(workbook: XLSX.WorkBook, metadata: any): void {
    const metadataData = [
      ['Export Metadata', ''],
      ['Generated At', metadata.exportedAt.toISOString()],
      ['Record Count', metadata.recordCount],
      ['Fields Exported', Array.isArray(metadata.fields) ? metadata.fields.join(', ') : ''],
      ['', ''],
      ['Field List', ''],
      ...(Array.isArray(metadata.fields)
        ? metadata.fields.map((field: string, index: number) => [
            `Field ${index + 1}`,
            field
          ])
        : [])
    ];

    const metadataWs = XLSX.utils.aoa_to_sheet(metadataData);
    (metadataWs as any)['!cols'] = [{ wch: 20 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(workbook, metadataWs, 'Export Info');
  }

  /**
   * Formatare valori pentru export (string-friendly)
   */
  private static formatCellValue(value: any): string | number | boolean | null {
    if (value === null || value === undefined) return '';

    if (typeof value === 'boolean' || typeof value === 'number') return value;

    if (value instanceof Date) return value.toISOString().split('T')[0]; // YYYY-MM-DD

    if (typeof value === 'object') {
      try { return JSON.stringify(value); } catch { return String(value); }
    }

    return String(value);
  }

  /**
   * Descărcare blob ca fișier (CSV poate include BOM pentru Excel)
   */
  private static downloadBlob(
    content: string,
    filename: string,
    mimeType: string,
    opts: { addUtf8Bom?: boolean } = {}
  ): void {
    const { addUtf8Bom } = opts;
    const blobParts: (string | Uint8Array)[] = [];

    if (addUtf8Bom) {
      // EF BB BF - BOM UTF-8
      blobParts.push(new Uint8Array([0xEF, 0xBB, 0xBF]));
    }
    blobParts.push(content);

    const blob = new Blob(blobParts, { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = this.sanitizeFilename(filename);
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Validare date pentru export
   */
  static validateExportData<T extends Record<string, any>>(
    data: T[],
    fields: ExportField[]
  ): { isValid: boolean; errors: string[] } {
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

    // Verificăm dacă toate cheile există în primul record (heuristică)
    const sampleRecord = data[0] ?? {} as T;
    const missingFields = enabledFields.filter(field => !(field.key in sampleRecord));
    if (missingFields.length > 0) {
      errors.push(`Missing fields in data: ${missingFields.map(f => String(f.key)).join(', ')}`);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Estimare mărime fișier
   */
  static estimateFileSize<T extends Record<string, any>>(
    data: T[],
    fields: ExportField[],
    format: ExportFormat
  ): number {
    if (!data.length) return 0;

    const enabledFields = fields.filter(f => f.enabled);
    const sampleRecord = data[0];

    let avgRowSize = 0;
    enabledFields.forEach(field => {
      const value = sampleRecord[field.key as keyof T];
      if (value !== null && value !== undefined) {
        const s = typeof value === 'object' ? JSON.stringify(value) : String(value);
        avgRowSize += s.length;
      }
    });

    switch (format) {
      case 'csv':
        avgRowSize += enabledFields.length * 2; // separatori+ghilimele
        break;
      case 'excel':
        avgRowSize *= 2; // overhead aproximativ
        break;
      case 'json':
        avgRowSize += enabledFields.length * 10; // chei+ghilimele+virgule
        break;
    }

    return Math.max((avgRowSize * data.length) + 1024, 0);
  }

  /**
   * Afișare mărime fișier în unități umane
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Generează nume fișier cu timestamp
   */
  static generateFilename(baseName: string, format: ExportFormat, includeTimestamp = true): string {
    let filename = baseName;
    if (includeTimestamp) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      filename += `_${timestamp}`;
    }
    const extension = format === 'excel' ? 'xlsx' : format;
    return `${filename}.${extension}`;
  }

  /**
   * Normalizează nume fișier
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .trim();
  }

  /**
   * Asigură extensia corectă
   */
  private static ensureExtension(filename: string, ext: string): string {
    if (filename.toLowerCase().endsWith(`.${ext}`)) return filename;
    return `${filename}.${ext}`;
  }

  /**
   * Grupare după câmp
   */
  static groupDataByField<T extends Record<string, any>>(data: T[], groupByField: keyof T): Record<string, T[]> {
    const grouped: Record<string, T[]> = {};
    data.forEach(record => {
      const keyVal = record[groupByField];
      const key = keyVal === null || keyVal === undefined ? 'Unknown' : String(keyVal);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(record);
    });
    return grouped;
  }

  /**
   * Statistici de bază
   */
  static calculateStatistics<T extends Record<string, any>>(
    data: T[],
    numericalFields: (keyof T)[] = []
  ): any {
    const stats: any = {
      totalRecords: data.length,
      fieldStatistics: {} as Record<string, any>
    };

    const fields = data.length > 0 ? Object.keys(data[0]) as (keyof T)[] : [];

    fields.forEach(field => {
      const values = data.map(r => r[field]).filter(v => v !== null && v !== undefined);
      const uniqueValues = new Set(values.map(v => (typeof v === 'object' ? JSON.stringify(v) : v)));

      const record: any = {
        totalValues: values.length,
        uniqueValues: uniqueValues.size,
        nullValues: data.length - values.length,
        completeness: data.length ? (values.length / data.length) * 100 : 0
      };

      if (numericalFields.includes(field)) {
        const nums = values.map(v => typeof v === 'number' ? v : parseFloat(String(v))).filter(v => !isNaN(v));
        if (nums.length > 0) {
          record.min = Math.min(...nums);
          record.max = Math.max(...nums);
          record.average = nums.reduce((a, b) => a + b, 0) / nums.length;
        }
      }

      stats.fieldStatistics[String(field)] = record;
    });

    return stats;
  }

  /**
   * Sortare multiplă
   */
  static sortData<T extends Record<string, any>>(
    data: T[],
    sortBy: Array<{ field: keyof T; direction: 'asc' | 'desc' }>
  ): T[] {
    return [...data].sort((a, b) => {
      for (const sort of sortBy) {
        const aValue = a[sort.field];
        const bValue = b[sort.field];
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        else if (aValue > bValue) comparison = 1;
        if (comparison !== 0) return sort.direction === 'desc' ? -comparison : comparison;
      }
      return 0;
    });
  }

  /**
   * Filtrare după criterii simple (egalitate, listă, wildcard cu '*')
   */
  static filterData<T extends Record<string, any>>(data: T[], filters: Partial<Record<keyof T, any>>): T[] {
    return data.filter(record => {
      return (Object.entries(filters) as [keyof T, any][]).every(([field, filterValue]) => {
        const recordValue = record[field];
        if (filterValue === null || filterValue === undefined) return true;
        if (Array.isArray(filterValue)) return filterValue.includes(recordValue);
        if (typeof filterValue === 'string' && filterValue.includes('*')) {
          const regex = new RegExp(filterValue.replace(/\*/g, '.*'), 'i');
          return regex.test(String(recordValue));
        }
        return recordValue === filterValue;
      });
    });
  }

  /**
   * Pregătire date pentru export
   */
  static prepareExportData<T extends Record<string, any>>(
    data: T[],
    options: {
      fields?: ExportField[];
      filters?: Partial<Record<keyof T, any>>;
      sortBy?: Array<{ field: keyof T; direction: 'asc' | 'desc' }>;
      groupBy?: keyof T; // (nefolosit la materializare aici, dar util pentru rapoarte)
    }
  ): Partial<T>[] {
    let processed: T[] = [...data];

    if (options.filters) processed = this.filterData(processed, options.filters);
    if (options.sortBy && options.sortBy.length > 0) processed = this.sortData(processed, options.sortBy);

    if (options.fields) {
      const enabled = options.fields.filter(f => f.enabled);
      const fieldKeys = enabled.map(f => f.key as keyof T);
      return processed.map(rec => {
        const out: Partial<T> = {};
        fieldKeys.forEach(k => { (out as any)[k] = rec[k]; });
        return out;
      });
    }

    return processed;
  }
}
