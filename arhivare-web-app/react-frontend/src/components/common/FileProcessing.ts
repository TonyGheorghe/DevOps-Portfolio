// src/components/common/FileProcessing.ts
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ImportData, ImportError, FieldMapping, DEFAULT_FIELD_MAPPINGS, ImportValidation } from '../../types/importTypes';

export class FileProcessor {
  /**
   * Main entry point for processing uploaded files
   */
  static async processFile(file: File): Promise<ImportData[]> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'csv':
        return this.processCSV(file);
      case 'xlsx':
      case 'xls':
        return this.processExcel(file);
      case 'json':
        return this.processJSON(file);

      default:
        throw new Error(`Unsupported file format: ${extension}. Supported formats: CSV, XLSX, XLS`);
    }
  }

  /**
   * Process CSV files using PapaParse
   */
  private static async processCSV(file: File): Promise<ImportData[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => this.normalizeHeader(header),
        complete: (results) => {
          try {
            console.log('CSV Parse Results:', results);

            if (results.errors.length > 0) {
              console.warn('CSV Parse Errors:', results.errors);
            }

            const data = results.data.map((row: any, index: number) => {
              try {
                return this.normalizeRowData(row, index + 1);
              } catch (error) {
                console.error(`Error processing row ${index + 1}:`, error, row);
                return null;
              }
            }).filter((row): row is ImportData => row !== null);

            console.log('Processed CSV data:', data);
            resolve(data);
          } catch (error) {
            console.error('Error in CSV processing:', error);
            reject(error);
          }
        },
        error: (error) => {
          console.error('PapaParse error:', error);
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });


  }

  private static async processJSON(file: File): Promise<ImportData[]> {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('JSON root must be an array');
      return parsed.map((row, idx) => this.normalizeRowData(row, idx + 1));
    } catch (error) {
      console.error('JSON processing error:', error);
      throw new Error(`JSON processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process Excel files using SheetJS
   */
  private static async processExcel(file: File): Promise<ImportData[]> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { cellDates: true, cellText: false });

      // Get first worksheet
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('Excel file contains no worksheets');
      }

      const worksheet = workbook.Sheets[firstSheetName];

      // Convert to JSON with headers
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        raw: false // Get formatted strings instead of raw values
      });

      if (jsonData.length < 2) {
        throw new Error('Excel file must contain at least a header row and one data row');
      }

      // Extract headers and normalize them
      const headers = (jsonData[0] as string[]).map(header =>
        this.normalizeHeader(String(header || ''))
      );

      // Process data rows
      const dataRows = jsonData.slice(1) as any[][];

      const processedData = dataRows.map((row, index) => {
        try {
          // Convert row array to object using headers
          const rowObject: any = {};
          headers.forEach((header, headerIndex) => {
            if (header && row[headerIndex] !== undefined && row[headerIndex] !== '') {
              rowObject[header] = row[headerIndex];
            }
          });

          return this.normalizeRowData(rowObject, index + 2); // +2 because we skip header and start from 1
        } catch (error) {
          console.error(`Error processing Excel row ${index + 2}:`, error, row);
          return null;
        }
      }).filter((row): row is ImportData => row !== null);

      console.log('Processed Excel data:', processedData);
      return processedData;

    } catch (error) {
      console.error('Excel processing error:', error);
      throw new Error(`Excel processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Normalize CSV/Excel headers to match ImportData fields
   */
  private static normalizeHeader(header: string): string {
    if (!header) return '';

    const normalizedHeader = header
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_'); // Replace spaces with underscores

    // Try to map using predefined mappings
    for (const mapping of DEFAULT_FIELD_MAPPINGS) {
      if (mapping[normalizedHeader]) {
        return mapping[normalizedHeader];
      }
    }

    // Return normalized header if no mapping found
    return normalizedHeader;
  }

  /**
   * Convert raw row data to ImportData format
   */
  private static normalizeRowData(row: any, rowNumber: number): ImportData {
    // Skip completely empty rows
    const hasData = Object.values(row).some(value =>
      value !== null && value !== undefined && String(value).trim() !== ''
    );

    if (!hasData) {
      throw new Error('Empty row');
    }

    return {
      company_name: this.normalizeStringField(row.company_name),
      holder_name: this.normalizeStringField(row.holder_name),
      address: this.normalizeOptionalStringField(row.address),
      email: this.normalizeOptionalStringField(row.email),
      phone: this.normalizeOptionalStringField(row.phone),
      notes: this.normalizeOptionalStringField(row.notes),
      source_url: this.normalizeOptionalStringField(row.source_url),
      active: this.normalizeBooleanField(row.active, true) // Default to true
    };
  }

  /**
   * Normalize required string fields
   */
  private static normalizeStringField(value: any): string {
    if (value === null || value === undefined) {
      throw new Error('Required field is missing');
    }

    const normalized = String(value).trim();
    if (normalized === '') {
      throw new Error('Required field is empty');
    }

    return normalized;
  }

  /**
   * Normalize optional string fields
   */
  private static normalizeOptionalStringField(value: any): string | undefined {
    if (value === null || value === undefined || String(value).trim() === '') {
      return undefined;
    }

    return String(value).trim();
  }

  /**
   * Normalize boolean fields
   */
  private static normalizeBooleanField(value: any, defaultValue: boolean = false): boolean {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }

    const stringValue = String(value).toLowerCase().trim();

    // True values
    if (['true', '1', 'yes', 'da', 'activ', 'active', 'y'].includes(stringValue)) {
      return true;
    }

    // False values
    if (['false', '0', 'no', 'nu', 'inactiv', 'inactive', 'n'].includes(stringValue)) {
      return false;
    }

    return defaultValue;
  }

  /**
   * Validate processed import data
   */
  static validateImportData(data: ImportData[]): ImportValidation {
    const errors: ImportError[] = [];
    const warnings: ImportError[] = [];
    let validRows = 0;

    data.forEach((row, index) => {
      const rowNumber = index + 1;
      const rowErrors = this.validateRowData(row, rowNumber);

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        validRows++;
      }

      // Check for duplicates based on company_name and holder_name
      const seen = new Map<string, number[]>();
      data.forEach((row, idx) => {
        const key = `${row.company_name?.toLowerCase() || ''}-${row.holder_name?.toLowerCase() || ''}`;
        if (!seen.has(key)) {
          seen.set(key, [idx + 1]);
        } else {
          seen.get(key)!.push(idx + 1);
        }
      });

      const duplicateRows = Array.from(seen.values()).filter(rows => rows.length > 1);
      const duplicates = duplicateRows.map(rows => `Duplicate entries found at rows: ${rows.join(', ')}`);


      // Check for warnings
      const rowWarnings = this.checkRowWarnings(row, rowNumber);
      if (rowWarnings.length > 0) {
        warnings.push(...rowWarnings);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      duplicates: [], // Will be populated by service
      stats: { 
        totalRows: data.length,
        validRows,
        errorRows: data.length - validRows,
        duplicateRows: 0 // Will be updated by service
      }
    };
  }

  /**
   * Validate individual row data
   */
  static validateRowData(data: ImportData, rowNumber: number): ImportError[] {
    const errors: ImportError[] = [];

    // Required fields validation
    if (!data.company_name || data.company_name.length < 2) {
      errors.push({
        row: rowNumber,
        field: 'company_name',
        message: 'Company name is required and must be at least 2 characters',
        data
      });
    } else if (data.company_name.length > 255) {
      errors.push({
        row: rowNumber,
        field: 'company_name',
        message: 'Company name cannot exceed 255 characters',
        data
      });
    }

    if (!data.holder_name || data.holder_name.length < 2) {
      errors.push({
        row: rowNumber,
        field: 'holder_name',
        message: 'Archive holder name is required and must be at least 2 characters',
        data
      });
    } else if (data.holder_name.length > 255) {
      errors.push({
        row: rowNumber,
        field: 'holder_name',
        message: 'Archive holder name cannot exceed 255 characters',
        data
      });
    }

    // Optional fields validation
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push({
        row: rowNumber,
        field: 'email',
        message: 'Invalid email format',
        data
      });
    }

    if (data.source_url && !this.isValidUrl(data.source_url)) {
      errors.push({
        row: rowNumber,
        field: 'source_url',
        message: 'Invalid URL format',
        data
      });
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push({
        row: rowNumber,
        field: 'phone',
        message: 'Invalid phone number format',
        data
      });
    }

    return errors;
  }

  /**
   * Check for row warnings (non-blocking issues)
   */
  static checkRowWarnings(data: ImportData, rowNumber: number): ImportError[] {
    const warnings: ImportError[] = [];

    // Missing optional but recommended fields
    if (!data.address) {
      warnings.push({
        row: rowNumber,
        field: 'address',
        message: 'Address is recommended for better data completeness',
        data
      });
    }

    if (!data.email && !data.phone) {
      warnings.push({
        row: rowNumber,
        field: 'contact',
        message: 'Either email or phone is recommended for contact information',
        data
      });
    }

    return warnings;
  }

  /**
   * Email validation
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * URL validation
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Phone validation (basic)
   */
  private static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[+]?[\d\s\-().]{7,20}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Generate CSV template for download
   */
  static generateCSVTemplate(withExamples: boolean = true): string {
    const headers = [
      'company_name',
      'holder_name',
      'address',
      'email',
      'phone',
      'notes',
      'source_url',
      'active'
    ];

    const sampleData = [
      [
        'Tractorul Brașov SA',
        'Arhiva Națională Brașov',
        'Str. Industriei 15, Brașov, 500269',
        'contact@arhivabrasov.ro',
        '+40 268 123 456',
        'Fond industrial important din perioada comunistă',
        'https://arhivabrasov.ro/fonduri/tractorul',
        'true'
      ],
      [
        'Steagul Roșu Cluj SA',
        'Arhiva Județeană Cluj',
        'Str. Memorandumului 21, Cluj-Napoca, 400114',
        'arhiva@cjcluj.ro',
        '+40 264 591 968',
        'Companie textilă cu activitate între 1949-1998',
        'https://arhivacluj.ro/fonduri/steagul-rosu',
        'true'
      ]
    ];

    let csv = headers.join(',') + '\n';
    if (withExamples) {
      csv += sampleData.map(row => row.join(',')).join('\n') + '\n';
    } 
    
    return Papa.unparse({
      fields: headers,
      data: sampleData
    });
  }

  /**
   * Download CSV template
   */
  static downloadCSVTemplate(filename: string = 'import_template.csv'): void {
    const csvContent = this.generateCSVTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
}