// src/types/importTypes.ts
export interface ImportData {
  company_name: string;
  holder_name: string;
  address?: string;
  email?: string;
  phone?: string;
  notes?: string;
  source_url?: string;
  active: boolean;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: ImportError[];
  duplicates: ImportData[];
  warnings: ImportWarning[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data: Partial<ImportData>;
}

export interface ImportWarning {
  row: number;
  field?: string;
  message: string;
  data: Partial<ImportData>;
}

export interface ImportOptions {
  assignToUser?: number;
  skipDuplicates: boolean;
  updateExisting: boolean;
  validateOnly: boolean;
  dryRun: boolean;
}

export interface ImportValidation {
  isValid: boolean;
  errors: ImportError[];
  warnings: ImportWarning[];
  duplicates: ImportDuplicate[];
  stats: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    duplicateRows: number;
  };
}

export interface ImportDuplicate {
  row: number;
  data: ImportData;
  existingData: ImportData;
  similarity: number;
}

export interface ImportProgress {
  stage: 'parsing' | 'validating' | 'importing' | 'complete' | 'error';
  processed: number;
  total: number;
  message: string;
  currentRow?: number;
}

// Field mapping for different CSV formats
export interface FieldMapping {
  [key: string]: string; // CSV header -> ImportData field
}

export const DEFAULT_FIELD_MAPPINGS: FieldMapping[] = [
  // Romanian mappings
  {
    'companie': 'company_name',
    'nume_companie': 'company_name',
    'detinator': 'holder_name',
    'detinator_arhiva': 'holder_name',
    'adresa': 'address',
    'email': 'email',
    'telefon': 'phone',
    'note': 'notes',
    'observatii': 'notes',
    'url': 'source_url',
    'sursa': 'source_url',
    'activ': 'active'
  },
  // English mappings
  {
    'company': 'company_name',
    'company_name': 'company_name',
    'holder': 'holder_name',
    'archive_holder': 'holder_name',
    'holder_name': 'holder_name',
    'address': 'address',
    'email': 'email',
    'phone': 'phone',
    'telephone': 'phone',
    'notes': 'notes',
    'comments': 'notes',
    'url': 'source_url',
    'source': 'source_url',
    'source_url': 'source_url',
    'active': 'active'
  }
];

// Template for CSV export
export const CSV_TEMPLATE_HEADERS = [
  'company_name',
  'holder_name', 
  'address',
  'email',
  'phone',
  'notes',
  'source_url',
  'active'
];

export const CSV_TEMPLATE_SAMPLE_DATA = [
  {
    company_name: 'Tractorul Brașov SA',
    holder_name: 'Arhiva Națională Brașov',
    address: 'Str. Industriei 15, Brașov, 500269',
    email: 'contact@arhivabrasov.ro',
    phone: '+40 268 123 456',
    notes: 'Fond industrial important din perioada comunistă',
    source_url: 'https://arhivabrasov.ro/fonduri/tractorul',
    active: true
  },
  {
    company_name: 'Steagul Roșu Cluj SA',
    holder_name: 'Arhiva Județeană Cluj',
    address: 'Str. Memorandumului 21, Cluj-Napoca, 400114',
    email: 'arhiva@cjcluj.ro',
    phone: '+40 264 591 968',
    notes: 'Companie textilă cu activitate între 1949-1998',
    source_url: 'https://arhivacluj.ro/fonduri/steagul-rosu',
    active: true
  }
];