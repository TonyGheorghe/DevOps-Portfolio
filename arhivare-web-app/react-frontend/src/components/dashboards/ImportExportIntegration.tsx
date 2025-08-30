// src/components/dashboards/ImportExportIntegration.tsx
import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  FileText, 
  BarChart3,
  Users,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { ExportWizard } from '../export/ExportWizard';
import { ImportWizard } from '../import/ImportWizard';
import { ExportResult, ExportOptions } from '../../types/exportTypes';
import { ImportResult } from '../../types/importTypes';

interface ImportExportControlsProps {
  userRole: string;
  userId?: number;
  onImportComplete?: (result: ImportResult) => void;
  onExportComplete?: (result: ExportResult) => void;
  className?: string;
}

export const ImportExportControls: React.FC<ImportExportControlsProps> = ({
  userRole,
  userId,
  onImportComplete,
  onExportComplete,
  className = ''
}) => {
  const [showExportWizard, setShowExportWizard] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [recentActivity, setRecentActivity] = useState<Array<{
    type: 'import' | 'export';
    timestamp: Date;
    result: ImportResult | ExportResult;
  }>>([]);

  const handleImportComplete = (result: ImportResult) => {
    setRecentActivity(prev => [...prev, {
      type: 'import',
      timestamp: new Date(),
      result
    }].slice(-5)); // Keep last 5 activities
    
    if (onImportComplete) {
      onImportComplete(result);
    }
  };

  const handleExportComplete = (result: ExportResult) => {
    setRecentActivity(prev => [...prev, {
      type: 'export', 
      timestamp: new Date(),
      result
    }].slice(-5));
    
    if (onExportComplete) {
      onExportComplete(result);
    }
  };

  // Role-based permissions
  const canImport = ['admin', 'client'].includes(userRole);
  const canExportAll = ['admin', 'audit'].includes(userRole);
  const canExportOwn = userRole === 'client';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Import & Export
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage your data imports and exports
        </p>
      </div>

      {/* Action Buttons */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Export Section */}
          {(canExportAll || canExportOwn) && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </h4>
              
              <div className="space-y-2">
                <button
                  onClick={() => setShowExportWizard(true)}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Funds
                </button>
                
                {canExportAll && (
                  <>
                    <button
                      onClick={() => {/* Quick CSV export */}}
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center text-sm"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Quick CSV Export
                    </button>
                    
                    <button
                      onClick={() => {/* Export statistics */}}
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center text-sm"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Export Statistics
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Import Section */}
          {canImport && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                Import Data
              </h4>
              
              <div className="space-y-2">
                <button
                  onClick={() => setShowImportWizard(true)}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Funds
                </button>
                
                <button
                  onClick={() => {/* Download template */}}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Recent Activity
            </h4>
            
            <div className="space-y-2">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                  <div className="flex items-center">
                    {activity.type === 'import' ? (
                      <Upload className="w-4 h-4 text-green-500 mr-2" />
                    ) : (
                      <Download className="w-4 h-4 text-blue-500 mr-2" />
                    )}
                    <span className="text-gray-900 dark:text-white">
                      {activity.type === 'import' ? 'Import' : 'Export'} completed
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      {activity.type === 'import' 
                        ? `${(activity.result as ImportResult).imported} records`
                        : `${(activity.result as ExportResult).recordCount} records`
                      }
                    </span>
                    {activity.result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Role-specific Information */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {userRole === 'admin' && (
              <>
                <p>• Can import and export all funds</p>
                <p>• Can assign imported funds to users</p>
                <p>• Access to system statistics and reports</p>
              </>
            )}
            {userRole === 'audit' && (
              <>
                <p>• Can export all funds (read-only)</p>
                <p>• Access to compliance reports and statistics</p>
                <p>• Cannot import or modify data</p>
              </>
            )}
            {userRole === 'client' && (
              <>
                <p>• Can import and export your assigned funds</p>
                <p>• Imported funds are automatically assigned to you</p>
                <p>• Cannot access other users' data</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Wizards */}
      <ExportWizard
        isOpen={showExportWizard}
        onClose={() => setShowExportWizard(false)}
        userRole={userRole}
        userId={userId}
        onExportComplete={handleExportComplete}
      />

      <ImportWizard
        isOpen={showImportWizard}
        onClose={() => setShowImportWizard(false)}
        userRole={userRole}
        userId={userId}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};

// Enhanced Admin Dashboard Integration
export const AdminDashboardWithImportExport: React.FC<{
  originalDashboard: React.ComponentType<any>;
  [key: string]: any;
}> = ({ originalDashboard: OriginalDashboard, ...props }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Import/Export Controls */}
      <ImportExportControls
        userRole="admin"
        userId={props.userId}
        onImportComplete={handleDataChange}
        onExportComplete={() => {}}
      />
      
      {/* Original Dashboard with refresh */}
      <OriginalDashboard key={refreshKey} {...props} />
    </div>
  );
};

// Enhanced Client Dashboard Integration  
export const ClientDashboardWithImportExport: React.FC<{
  originalDashboard: React.ComponentType<any>;
  [key: string]: any;
}> = ({ originalDashboard: OriginalDashboard, ...props }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Import/Export Controls */}
      <ImportExportControls
        userRole="client"
        userId={props.userId}
        onImportComplete={handleDataChange}
        onExportComplete={() => {}}
        className="mb-6"
      />
      
      {/* Original Dashboard with refresh */}
      <OriginalDashboard key={refreshKey} {...props} />
    </div>
  );
};

// Enhanced Audit Dashboard Integration
export const AuditDashboardWithExport: React.FC<{
  originalDashboard: React.ComponentType<any>;
  [key: string]: any;
}> = ({ originalDashboard: OriginalDashboard, ...props }) => {
  return (
    <div className="space-y-6">
      {/* Export-only Controls */}
      <ImportExportControls
        userRole="audit"
        userId={props.userId}
        onExportComplete={() => {}}
        className="mb-6"
      />
      
      {/* Original Dashboard */}
      <OriginalDashboard {...props} />
    </div>
  );
};

// Quick Action Components for existing dashboards
export const QuickExportButton: React.FC<{
  userRole: string;
  filters?: any;
  className?: string;
}> = ({ userRole, filters, className = '' }) => {
  const [showWizard, setShowWizard] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowWizard(true)}
        className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center ${className}`}
      >
        <Download className="w-4 h-4 mr-2" />
        Export
      </button>

      <ExportWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        userRole={userRole}
        preFilters={filters}
      />
    </>
  );
};

export const QuickImportButton: React.FC<{
  userRole: string;
  userId?: number;
  onImportComplete?: () => void;
  className?: string;
}> = ({ userRole, userId, onImportComplete, className = '' }) => {
  const [showWizard, setShowWizard] = useState(false);

  if (!['admin', 'client'].includes(userRole)) return null;

  return (
    <>
      <button
        onClick={() => setShowWizard(true)}
        className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center ${className}`}
      >
        <Upload className="w-4 h-4 mr-2" />
        Import
      </button>

      <ImportWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        userRole={userRole}
        userId={userId}
        onImportComplete={() => {
          if (onImportComplete) onImportComplete();
        }}
      />
    </>
  );
};

// Statistics and Reporting Panel
export const ImportExportStats: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const [stats, setStats] = useState({
    totalImports: 0,
    totalExports: 0,
    lastImport: null as Date | null,
    lastExport: null as Date | null,
    recordsImported: 0,
    recordsExported: 0
  });

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <h4 className="font-medium text-gray-900 dark:text-white mb-4">Import/Export Statistics</h4>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalExports}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Total Exports</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.totalImports}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Total Imports</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.recordsExported}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Records Exported</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.recordsImported}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Records Imported</div>
        </div>
      </div>
    </div>
  );
};