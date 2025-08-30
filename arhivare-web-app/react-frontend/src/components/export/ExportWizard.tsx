// src/components/export/ExportWizard.tsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Table, 
  Code, 
  FileImage, 
  Users, 
  Filter, 
  Settings,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Info,
  Eye,
  Clock,
  CheckCircle
} from 'lucide-react';
import { ExportOptions, ExportField, ExportTemplate, ExportResult, ExportProgress } from '../../types/exportTypes';
import { ExportService } from '../../services/exportService';
import { ExportUtils } from '../common/ExportUtils';

interface ExportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  userId?: number;
  preFilters?: any;
  onExportComplete?: (result: ExportResult) => void;
}

type WizardStep = 'template' | 'fields' | 'filters' | 'preview' | 'export' | 'complete';

export const ExportWizard: React.FC<ExportWizardProps> = ({
  isOpen,
  onClose,
  userRole,
  userId,
  preFilters = {},
  onExportComplete
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'excel',
    fields: [],
    filters: { ...preFilters },
    includeStatistics: false
  });
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string>('');

  const exportService = ExportService.getInstance();
  const templates = exportService.getTemplatesForRole(userRole);
  const availableFields = exportService.getAvailableFields();

  // Configurare progres callback
  useEffect(() => {
    exportService.setProgressCallback(setProgress);
    return () => exportService.setProgressCallback(() => {});
  }, []);

  // Reset când se deschide modal-ul
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('template');
      setSelectedTemplate(null);
      setPreviewData([]);
      setProgress(null);
      setExportResult(null);
      setError('');
      setExportOptions({
        format: 'excel',
        fields: [],
        filters: { ...preFilters },
        includeStatistics: false
      });
    }
  }, [isOpen, preFilters]);

  // Pașii wizard-ului
  const steps: Array<{ id: WizardStep; title: string; icon: React.ReactNode }> = [
    { id: 'template', title: 'Template', icon: <FileText className="w-4 h-4" /> },
    { id: 'fields', title: 'Fields', icon: <Settings className="w-4 h-4" /> },
    { id: 'filters', title: 'Filters', icon: <Filter className="w-4 h-4" /> },
    { id: 'preview', title: 'Preview', icon: <Eye className="w-4 h-4" /> },
    { id: 'export', title: 'Export', icon: <Download className="w-4 h-4" /> }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  // Handlers pentru navigație
  const goToNext = () => {
    const nextIndex = Math.min(currentStepIndex + 1, steps.length - 1);
    setCurrentStep(steps[nextIndex].id);
  };

  const goToPrevious = () => {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStep(steps[prevIndex].id);
  };

  // Handler pentru selectarea template-ului
  const handleTemplateSelect = (template: ExportTemplate) => {
    setSelectedTemplate(template);
    setExportOptions(prev => ({
      ...prev,
      format: template.format,
      fields: [...template.defaultFields],
      filters: { ...prev.filters, ...template.defaultFilters }
    }));
    goToNext();
  };

  // Handler pentru format customizat
  const handleCustomFormat = (format: 'csv' | 'excel' | 'json') => {
    setSelectedTemplate(null);
    setExportOptions(prev => ({
      ...prev,
      format,
      fields: availableFields.map(field => ({ ...field, enabled: field.enabled }))
    }));
    goToNext();
  };

  // Handler pentru toggleField
  const toggleField = (fieldKey: string) => {
    setExportOptions(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.key === fieldKey ? { ...field, enabled: !field.enabled } : field
      )
    }));
  };

  // Handler pentru filters
  const updateFilters = (newFilters: any) => {
    setExportOptions(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));
  };

  // Preview data
  const loadPreview = async () => {
    setIsLoading(true);
    try {
      const preview = await exportService.previewExport(exportOptions, 5);
      setPreviewData(preview);
    } catch (err) {
      setError(`Preview failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute export
  const executeExport = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await exportService.exportFunds(exportOptions);
      setExportResult(result);
      setCurrentStep('complete');
      
      if (onExportComplete) {
        onExportComplete(result);
      }
    } catch (err) {
      setError(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Download file
  const handleDownload = async () => {
    if (!exportResult?.downloadUrl) return;
    
    try {
      await exportService.downloadFile(exportResult.downloadUrl, exportResult.filename);
    } catch (err) {
      setError(`Download failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Export Data</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Export archival funds data in your preferred format
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  index < currentStepIndex 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : index === currentStepIndex
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400'
                }`}>
                  {index < currentStepIndex ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  index <= currentStepIndex 
                    ? 'text-gray-900 dark:text-white' 
                    : 'text-gray-400'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-400 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Template Selection */}
          {currentStep === 'template' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Choose Export Template
                </h3>
                
                {/* Predefined Templates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {templates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-colors"
                    >
                      <div className="flex items-center mb-2">
                        <FileText className="w-5 h-5 text-blue-500 mr-2" />
                        <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{template.description}</p>
                      <div className="flex items-center">
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded uppercase">
                          {template.format}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {template.defaultFields.filter(f => f.enabled).length} fields
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom Format Options */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Or choose custom format:</h4>
                  <div className="flex space-x-4">
                    {[
                      { format: 'csv' as const, icon: <Table className="w-5 h-5" />, label: 'CSV' },
                      { format: 'excel' as const, icon: <FileText className="w-5 h-5" />, label: 'Excel' },
                      { format: 'json' as const, icon: <Code className="w-5 h-5" />, label: 'JSON' }
                    ].map(({ format, icon, label }) => (
                      <button
                        key={format}
                        onClick={() => handleCustomFormat(format)}
                        className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        {icon}
                        <span className="ml-2 font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Field Selection */}
          {currentStep === 'fields' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Select Fields to Export
                </h3>
                
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {exportOptions.fields.filter(f => f.enabled).length} of {exportOptions.fields.length} fields selected
                  </p>
                  <div className="space-x-2">
                    <button
                      onClick={() => setExportOptions(prev => ({
                        ...prev,
                        fields: prev.fields.map(f => ({ ...f, enabled: true }))
                      }))}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setExportOptions(prev => ({
                        ...prev,
                        fields: prev.fields.map(f => ({ ...f, enabled: false }))
                      }))}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {exportOptions.fields.map(field => (
                    <label key={field.key} className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.enabled}
                        onChange={() => toggleField(field.key)}
                        className="mr-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{field.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{field.key}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Filters */}
          {currentStep === 'filters' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Configure Filters
                </h3>
                
                <div className="space-y-4">
                  {/* Active Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={exportOptions.filters.active === undefined ? 'all' : exportOptions.filters.active ? 'active' : 'inactive'}
                      onChange={(e) => updateFilters({
                        active: e.target.value === 'all' ? undefined : e.target.value === 'active'
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="all">All Records</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>
                  </div>

                  {/* Search Query */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Search Query (optional)
                    </label>
                    <input
                      type="text"
                      value={exportOptions.filters.searchQuery || ''}
                      onChange={(e) => updateFilters({ searchQuery: e.target.value || undefined })}
                      placeholder="Filter by company or holder name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Include Statistics */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeStats"
                      checked={exportOptions.includeStatistics}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeStatistics: e.target.checked
                      }))}
                      className="mr-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="includeStats" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Include statistics summary
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {currentStep === 'preview' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Export Preview
                  </h3>
                  <button
                    onClick={loadPreview}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {isLoading ? 'Loading...' : 'Refresh Preview'}
                  </button>
                </div>

                {previewData.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          {exportOptions.fields.filter(f => f.enabled).map(field => (
                            <th key={field.key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {field.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {previewData.slice(0, 5).map((row, index) => (
                          <tr key={index}>
                            {exportOptions.fields.filter(f => f.enabled).map(field => (
                              <td key={field.key} className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                {String(row[field.key] || '-')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center">
                    <Info className="w-5 h-5 text-blue-500 mr-2" />
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      This is a preview of the first 5 records. The actual export may contain more data.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Export Progress */}
          {currentStep === 'export' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Export in Progress
                </h3>
                
                {progress && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>{progress.message}</span>
                        <span>{progress.processed}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress.processed}%` }}
                        />
                      </div>
                    </div>
                    
                    {progress.estimatedTimeRemaining && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 mr-1" />
                        Estimated time remaining: {progress.estimatedTimeRemaining}s
                      </div>
                    )}
                  </div>
                )}
                
                {!progress && !isLoading && (
                  <div className="text-center">
                    <button
                      onClick={executeExport}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center mx-auto"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Start Export
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Complete */}
          {currentStep === 'complete' && exportResult && (
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Export Complete!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Successfully exported {exportResult.recordCount} records
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">File:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{exportResult.filename}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Size:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {ExportUtils.formatFileSize(exportResult.fileSize)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {currentStep !== 'complete' && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={goToPrevious}
              disabled={currentStepIndex === 0}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              
              {currentStep !== 'export' && (
                <button
                  onClick={goToNext}
                  disabled={
                    (currentStep === 'template' && !selectedTemplate && !exportOptions.format) ||
                    (currentStep === 'fields' && exportOptions.fields.filter(f => f.enabled).length === 0)
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};