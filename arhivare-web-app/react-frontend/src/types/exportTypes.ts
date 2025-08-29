// src/types/exportTypes.ts
export type ExportFormat = 'csv' | 'excel' | 'json' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  filters: ExportFilters;
  fields: ExportField[];
  groupBy?: string[];
  sortBy?: ExportSort[];
  includeStatistics?: boolean;
}

export interface ExportFilters {
  userIds?: number[];
  active?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
  companyNames?: string[];
  holderNames?: string[];
}

export interface ExportField {
  key: string;
  label: string;
  enabled: boolean;
  width?: number; // for Excel
}

export interface ExportSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ExportResult {
  success: boolean;
  filename: string;
  downloadUrl: string;
  recordCount: number;
  fileSize: number;
  expiresAt: Date;
  error?: string;
}

export interface ExportProgress {
  stage: 'preparing' | 'processing' | 'generating' | 'complete' | 'error';
  processed: number;
  total: number;
  message: string;
  estimatedTimeRemaining?: number;
}

// Export templates for different user roles
export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  userRoles: string[];
  defaultFields: ExportField[];
  defaultFilters: Partial<ExportFilters>;
  format: ExportFormat;
}

export const EXPORT_TEMPLATES: ExportTemplate[] = [
  // Admin templates
  {
    id: 'admin_all_funds',
    name: 'All Funds Report',
    description: 'Complete list of all funds with full details',
    userRoles: ['admin'],
    format: 'excel',
    defaultFields: [
      { key: 'company_name', label: 'Company Name', enabled: true, width: 30 },
      { key: 'holder_name', label: 'Archive Holder', enabled: true, width: 30 },
      { key: 'owner_username', label: 'Assigned To', enabled: true, width: 15 },
      { key: 'address', label: 'Address', enabled: true, width: 40 },
      { key: 'email', label: 'Email', enabled: true, width: 25 },
      { key: 'phone', label: 'Phone', enabled: true, width: 15 },
      { key: 'active', label: 'Active', enabled: true, width: 10 },
      { key: 'created_at', label: 'Created', enabled: true, width: 15 },
      { key: 'updated_at', label: 'Last Updated', enabled: true, width: 15 }
    ],
    defaultFilters: {}
  },
  {
    id: 'admin_user_assignments',
    name: 'User Assignments Report',
    description: 'Report showing fund assignments by user',
    userRoles: ['admin'],
    format: 'excel',
    defaultFields: [
      { key: 'owner_username', label: 'User', enabled: true, width: 15 },
      { key: 'owner_company_name', label: 'User Company', enabled: true, width: 25 },
      { key: 'company_name', label: 'Fund Company', enabled: true, width: 30 },
      { key: 'holder_name', label: 'Archive Holder', enabled: true, width: 30 },
      { key: 'active', label: 'Active', enabled: true, width: 10 },
      { key: 'assigned_at', label: 'Assigned Date', enabled: true, width: 15 }
    ],
    defaultFilters: {}
  },
  {
    id: 'admin_statistics',
    name: 'System Statistics Report',
    description: 'Comprehensive system statistics and metrics',
    userRoles: ['admin'],
    format: 'pdf',
    defaultFields: [],
    defaultFilters: {}
  },

  // Audit templates
  {
    id: 'audit_overview',
    name: 'System Overview Report',
    description: 'High-level system overview for audit purposes',
    userRoles: ['audit'],
    format: 'excel',
    defaultFields: [
      { key: 'company_name', label: 'Company Name', enabled: true, width: 30 },
      { key: 'holder_name', label: 'Archive Holder', enabled: true, width: 30 },
      { key: 'owner_username', label: 'Assigned To', enabled: true, width: 15 },
      { key: 'active', label: 'Active', enabled: true, width: 10 },
      { key: 'created_at', label: 'Created', enabled: true, width: 15 }
    ],
    defaultFilters: {}
  },
  {
    id: 'audit_compliance',
    name: 'Compliance Report', 
    description: 'Data completeness and compliance metrics',
    userRoles: ['audit'],
    format: 'pdf',
    defaultFields: [],
    defaultFilters: {}
  },

  // Client templates
  {
    id: 'client_my_funds',
    name: 'My Funds Export',
    description: 'Export of all funds assigned to current user',
    userRoles: ['client'],
    format: 'excel',
    defaultFields: [
      { key: 'company_name', label: 'Company Name', enabled: true, width: 30 },
      { key: 'holder_name', label: 'Archive Holder', enabled: true, width: 30 },
      { key: 'address', label: 'Address', enabled: true, width: 40 },
      { key: 'email', label: 'Email', enabled: true, width: 25 },
      { key: 'phone', label: 'Phone', enabled: true, width: 15 },
      { key: 'notes', label: 'Notes', enabled: true, width: 50 },
      { key: 'active', label: 'Active', enabled: true, width: 10 },
      { key: 'updated_at', label: 'Last Updated', enabled: true, width: 15 }
    ],
    defaultFilters: {}
  },
  {
    id: 'client_summary',
    name: 'My Funds Summary',
    description: 'Summary report of assigned funds',
    userRoles: ['client'],
    format: 'csv',
    defaultFields: [
      { key: 'company_name', label: 'Company Name', enabled: true },
      { key: 'holder_name', label: 'Archive Holder', enabled: true },
      { key: 'contact_info', label: 'Contact Info', enabled: true },
      { key: 'active', label: 'Status', enabled: true }
    ],
    defaultFilters: {}
  }
];

// Available fields for export
export const AVAILABLE_EXPORT_FIELDS: ExportField[] = [
  { key: 'id', label: 'ID', enabled: false, width: 10 },
  { key: 'company_name', label: 'Company Name', enabled: true, width: 30 },
  { key: 'holder_name', label: 'Archive Holder', enabled: true, width: 30 },
  { key: 'address', label: 'Address', enabled: false, width: 40 },
  { key: 'email', label: 'Email', enabled: false, width: 25 },
  { key: 'phone', label: 'Phone', enabled: false, width: 15 },
  { key: 'notes', label: 'Notes', enabled: false, width: 50 },
  { key: 'source_url', label: 'Source URL', enabled: false, width: 35 },
  { key: 'active', label: 'Active', enabled: true, width: 10 },
  { key: 'owner_username', label: 'Assigned To', enabled: false, width: 15 },
  { key: 'owner_company_name', label: 'User Company', enabled: false, width: 25 },
  { key: 'created_at', label: 'Created Date', enabled: false, width: 15 },
  { key: 'updated_at', label: 'Last Updated', enabled: false, width: 15 },
  { key: 'assigned_at', label: 'Assigned Date', enabled: false, width: 15 }
];

// Statistics export structure
export interface ExportStatistics {
  generatedAt: Date;
  userRole: string;
  filters: ExportFilters;
  summary: {
    totalFunds: number;
    activeFunds: number;
    inactiveFunds: number;
    assignedFunds: number;
    unassignedFunds: number;
  };
  byHolder?: {
    holderName: string;
    fundCount: number;
    percentage: number;
  }[];
  byUser?: {
    username: string;
    companyName?: string;
    fundCount: number;
    percentage: number;
  }[];
  recentActivity?: {
    date: Date;
    action: string;
    count: number;
  }[];
}