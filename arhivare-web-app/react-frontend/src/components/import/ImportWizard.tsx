// src/components/import/ImportWizard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Upload,
  FileText,
  Table,
  Code,
  AlertCircle,
  CheckCircle,
  Info,
  Download,
  Eye,
  Users,
  Settings,
  ChevronRight,
  ChevronLeft,
  Check,
  Clock,
  AlertTriangle,
  RefreshCw,
  Trash2,
  FileCheck
} from 'lucide-react';
import {
  ImportData,
  ImportOptions,
  ImportResult,
  ImportValidation,
  ImportProgress,
  ImportError,
  ImportDuplicate
} from '../../types/importTypes';
import { ImportService } from '../../services/importService';
import { FileProcessor } from '../common/FileProcessing';

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  userId?: number;
  onImportComplete?: (result: ImportResult) => void;
}

type WizardStep = 'upload' | 'validate' | 'configure' | 'preview' | 'import' | 'complete';

export const ImportWizard: React.FC<ImportWizardProps> = ({
  isOpen,
  onClose,
  userRole,
  userId,
  onImportComplete
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportData[]>([]);
  const [validation, setValidation] = useState<ImportValidation | null>(null);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    assignToUser: userId,
    skipDuplicates: true,
    updateExisting: false,
    validateOnly: false,
    dryRun: false
  });
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: number; username: string; company_name?: string; role: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);

  const importService = ImportService.getInstance();

  // Steps configuration
  const steps: Array<{ id: WizardStep; title: string; icon: React.ReactNode }> = [
    { id: 'upload', title: 'Upload', icon: <Upload className="w-4 h-4" /> },
    { id: 'validate', title: 'Validate', icon: <FileCheck className="w-4 h-4" /> },
    { id: 'configure', title: 'Configure', icon: <Settings className="w-4 h-4" /> },
    { id: 'preview', title: 'Preview', icon: <Eye className="w-4 h-4" /> },
    { id: 'import', title: 'Import', icon: <Download className="w-4 h-4" /> }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  // Progress callback setup
  useEffect(() => {
    importService.setProgressCallback(setProgress);
    return () => importService.setProgressCallback(() => { });
  }, []);

  // Load available users for admin assignment
  useEffect(() => {
    if (isOpen && userRole === 'admin') {
      importService.getAvailableUsers().then(setAvailableUsers);
    }
  }, [isOpen, userRole]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('upload');
      setSelectedFile(null);
      setParsedData([]);
      setValidation(null);
      setProgress(null);
      setImportResult(null);
      setError('');
      setImportOptions({
        assignToUser: userId,
        skipDuplicates: true,
        updateExisting: false,
        validateOnly: false,
        dryRun: false
      });
    }
  }, [isOpen, userId]);

  // Navigation handlers
  const goToNext = () => {
    const nextIndex = Math.min(currentStepIndex + 1, steps.length - 1);
    setCurrentStep(steps[nextIndex].id);
  };

  const goToPrevious = () => {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStep(steps[prevIndex].id);
  };

  // File handling
  const handleFileSelect = async (file: File) => {
    const validation = ImportService.validateFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    setError('');

    try {
      setIsLoading(true);
      const data = await importService.parseFile(file);
      setParsedData(data);
      goToNext();
    } catch (err) {
      setError(`File parsing failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // Validation
  const validateData = async () => {
    if (parsedData.length === 0) return;

    setIsLoading(true);
    try {
      const validationResult = await importService.validateData(parsedData);
      setValidation(validationResult);
      if (validationResult.isValid || validationResult.warnings.length > 0) {
        goToNext();
      }
    } catch (err) {
      setError(`Validation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Import execution
  const executeImport = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await importService.importData(parsedData, importOptions);
      setImportResult(result);
      setCurrentStep('complete');

      if (onImportComplete) {
        onImportComplete(result);
      }
    } catch (err) {
      setError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Download template
  const downloadTemplate = () => {
    importService.downloadTemplate('sample');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Import Data</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Import archival funds data from CSV, Excel, or JSON files
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
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${index < currentStepIndex
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
                <span className={`ml-2 text-sm font-medium ${index <= currentStepIndex
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

          {/* Step 1: File Upload */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Upload Import File
                </h3>

                {/* Template Download */}
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-1">Need a template?</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        Download our CSV template with examples to get started quickly.
                      </p>
                    </div>
                    <button
                      onClick={downloadTemplate}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Template
                    </button>
                  </div>
                </div>

                {/* File Drop Zone */}
                <div
                  onDrop={handleFileDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragOver
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                    }`}
                >
                  <div className="flex flex-col items-center">
                    <Upload className={`w-12 h-12 mb-4 ${isDragOver ? 'text-blue-500' : 'text-gray-400'
                      }`} />

                    {selectedFile ? (
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedFile(null)}
                            className="text-sm text-red-600 dark:text-red-400 hover:underline flex items-center"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          Drop your file here or click to browse
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Supports CSV, XLSX, XLS files up to 50MB
                        </p>
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                {/* Supported Formats */}
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Supported formats:</p>
                  <div className="flex space-x-4">
                    {[
                      { ext: 'CSV', icon: <Table className="w-4 h-4" />, desc: 'Comma-separated values' },
                      { ext: 'XLSX', icon: <FileText className="w-4 h-4" />, desc: 'Excel spreadsheet' },
                      { ext: 'JSON', icon: <Code className="w-4 h-4" />, desc: 'JSON array format' }
                    ].map(format => (
                      <div key={format.ext} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        {format.icon}
                        <span className="font-medium">{format.ext}</span>
                        <span>-</span>
                        <span>{format.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Validation */}
          {currentStep === 'validate' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Data Validation
                  </h3>
                  <button
                    onClick={validateData}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileCheck className="w-4 h-4 mr-2" />
                    )}
                    {isLoading ? 'Validating...' : 'Validate Data'}
                  </button>
                </div>

                {/* Parsed Data Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="w-8 h-8 text-blue-500 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{parsedData.length}</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Total Records</p>
                      </div>
                    </div>
                  </div>

                  {validation && (
                    <>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center">
                          <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
                          <div>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{validation.stats.validRows}</p>
                            <p className="text-sm text-green-600 dark:text-green-400">Valid Records</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center">
                          <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
                          <div>
                            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{validation.errors.length}</p>
                            <p className="text-sm text-red-600 dark:text-red-400">Errors Found</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Validation Results */}
                {validation && (
                  <div className="space-y-4">
                    {/* Errors */}
                    {validation.errors.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-700 dark:text-red-300 mb-2 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Errors ({validation.errors.length})
                        </h4>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {validation.errors.slice(0, 10).map((error, index) => (
                            <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm">
                              <span className="font-medium">Row {error.row}</span>
                              {error.field && <span className="text-red-600 dark:text-red-400"> ({error.field})</span>}:
                              <span className="ml-1">{error.message}</span>
                            </div>
                          ))}
                          {validation.errors.length > 10 && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                              ... and {validation.errors.length - 10} more errors
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Warnings */}
                    {validation.warnings.length > 0 && (
                      <div>
                        <h4 className="font-medium text-yellow-700 dark:text-yellow-300 mb-2 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Warnings ({validation.warnings.length})
                        </h4>
                        <div className="max-h-32 overflow-y-auto space-y-2">
                          {validation.warnings.slice(0, 5).map((warning, index) => (
                            <div key={index} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm">
                              <span className="font-medium">Row {warning.row}</span>: {warning.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Duplicates */}
                    {validation.duplicates.length > 0 && (
                      <div>
                        <h4 className="font-medium text-orange-700 dark:text-orange-300 mb-2 flex items-center">
                          <Info className="w-4 h-4 mr-2" />
                          Potential Duplicates ({validation.duplicates.length})
                        </h4>
                        <div className="max-h-32 overflow-y-auto space-y-2">
                          {validation.duplicates.slice(0, 5).map((duplicate, index) => (
                            <div key={index} className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded text-sm">
                              <span className="font-medium">Row {duplicate.row}</span>:
                              {duplicate.data.company_name} - Similar to existing record ({Math.round(duplicate.similarity * 100)}% match)
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Configure Options */}
          {currentStep === 'configure' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Import Configuration
                </h3>

                <div className="space-y-6">
                  {/* User Assignment (Admin only) */}
                  {userRole === 'admin' && availableUsers.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Assign imported funds to user (optional)
                      </label>
                      <select
                        value={importOptions.assignToUser || ''}
                        onChange={(e) => setImportOptions(prev => ({
                          ...prev,
                          assignToUser: e.target.value ? Number(e.target.value) : undefined
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">No assignment (admin only)</option>
                        {availableUsers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.username} {user.company_name && `(${user.company_name})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Duplicate Handling */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Duplicate Handling</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="duplicateHandling"
                          checked={importOptions.skipDuplicates && !importOptions.updateExisting}
                          onChange={() => setImportOptions(prev => ({
                            ...prev,
                            skipDuplicates: true,
                            updateExisting: false
                          }))}
                          className="mr-3 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">Skip duplicates</span>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Don't import records that already exist</p>
                        </div>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="duplicateHandling"
                          checked={importOptions.updateExisting}
                          onChange={() => setImportOptions(prev => ({
                            ...prev,
                            skipDuplicates: false,
                            updateExisting: true
                          }))}
                          className="mr-3 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">Update existing</span>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Update existing records with new data</p>
                        </div>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="duplicateHandling"
                          checked={!importOptions.skipDuplicates && !importOptions.updateExisting}
                          onChange={() => setImportOptions(prev => ({
                            ...prev,
                            skipDuplicates: false,
                            updateExisting: false
                          }))}
                          className="mr-3 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">Import all</span>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Import all records, including duplicates</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Import Mode */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Import Mode</h4>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={importOptions.dryRun}
                        onChange={(e) => setImportOptions(prev => ({
                          ...prev,
                          dryRun: e.target.checked
                        }))}
                        className="mr-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Dry run (preview only)</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Test the import without making actual changes</p>
                      </div>
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Import Preview
                </h3>

                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{parsedData.length}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Total Records</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">
                      {validation?.stats.validRows || 0}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">Valid</p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                    <p className="text-lg font-bold text-red-700 dark:text-red-300">
                      {validation?.errors.length || 0}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">Errors</p>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                    <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                      {validation?.duplicates.length || 0}
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">Duplicates</p>
                  </div>
                </div>

                {/* Data Preview Table */}
                {parsedData.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Company Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Archive Holder
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Validation
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {parsedData.slice(0, 10).map((row, index) => {
                          const hasError = validation?.errors.some(e => e.row === index + 1);
                          const hasWarning = validation?.warnings.some(w => w.row === index + 1);
                          const isDuplicate = validation?.duplicates.some(d => d.row === index + 1);

                          return (
                            <tr key={index} className={`${hasError ? 'bg-red-50 dark:bg-red-900/10' :
                                hasWarning ? 'bg-yellow-50 dark:bg-yellow-900/10' :
                                  isDuplicate ? 'bg-orange-50 dark:bg-orange-900/10' : ''
                              }`}>
                              <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                {row.company_name}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                {row.holder_name}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                {row.email || row.phone || '-'}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.active
                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                  }`}>
                                  {row.active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {hasError && (
                                  <div title="Has errors">
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                  </div>
                                )}
                                {hasWarning && !hasError && (
                                  <div title="Has warnings">
                                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                  </div>
                                )}
                                {isDuplicate && !hasError && !hasWarning && (
                                  <div title="Potential duplicate">
                                    <Info className="w-4 h-4 text-orange-500" />
                                  </div>
                                )}
                                {!hasError && !hasWarning && !isDuplicate && (
                                  <div title="Valid">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {parsedData.length > 10 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-2">
                        Showing first 10 of {parsedData.length} records
                      </p>
                    )}
                  </div>
                )}

                {/* Import Configuration Summary */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Import Configuration:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Assignment:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {importOptions.assignToUser
                          ? availableUsers.find(u => u.id === importOptions.assignToUser)?.username || 'Unknown User'
                          : 'No assignment'
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Duplicate Handling:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {importOptions.updateExisting ? 'Update existing' :
                          importOptions.skipDuplicates ? 'Skip duplicates' :
                            'Import all'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Mode:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {importOptions.dryRun ? 'Dry run (preview)' : 'Live import'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Import Progress */}
          {currentStep === 'import' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {importOptions.dryRun ? 'Dry Run in Progress' : 'Import in Progress'}
                </h3>

                {progress && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>{progress.message}</span>
                        <span>{progress.processed} / {progress.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress.total ? (progress.processed / progress.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {progress.currentRow && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Processing row: {progress.currentRow}
                      </div>
                    )}
                  </div>
                )}

                {!progress && !isLoading && (
                  <div className="text-center">
                    <button
                      onClick={executeImport}
                      className={`px-6 py-3 rounded-lg text-white flex items-center mx-auto ${importOptions.dryRun
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-green-600 hover:bg-green-700'
                        }`}
                    >
                      {importOptions.dryRun ? (
                        <>
                          <Eye className="w-5 h-5 mr-2" />
                          Start Dry Run
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5 mr-2" />
                          Start Import
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Complete */}
          {currentStep === 'complete' && importResult && (
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {importOptions.dryRun ? 'Dry Run Complete!' : 'Import Complete!'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {importOptions.dryRun
                    ? `Validated ${importResult.imported} records successfully`
                    : `Successfully imported ${importResult.imported} records`
                  }
                </p>

                {/* Results Summary */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Imported:</span>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {importResult.imported}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Errors:</span>
                      <div className="text-lg font-bold text-red-600 dark:text-red-400">
                        {importResult.errors.length}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Duplicates:</span>
                      <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        {importResult.duplicates.length}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Warnings:</span>
                      <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                        {importResult.warnings.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Details */}
                {importResult.errors.length > 0 && (
                  <div className="text-left">
                    <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
                      Import Errors ({importResult.errors.length})
                    </h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResult.errors.slice(0, 5).map((error, index) => (
                        <div key={index} className="text-sm p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                          Row {error.row}: {error.message}
                        </div>
                      ))}
                      {importResult.errors.length > 5 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                          ... and {importResult.errors.length - 5} more errors
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4">
                  {importOptions.dryRun && importResult.success && (
                    <button
                      onClick={() => {
                        setImportOptions(prev => ({ ...prev, dryRun: false }));
                        setCurrentStep('import');
                        setImportResult(null);
                      }}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Execute Real Import
                    </button>
                  )}

                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {currentStep !== 'complete' && currentStep !== 'import' && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={goToPrevious}
              disabled={currentStepIndex === 0 || isLoading}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={goToNext}
                disabled={
                  isLoading ||
                  (currentStep === 'upload' && !selectedFile) ||
                  (currentStep === 'validate' && (!validation || validation.errors.length > 0)) ||
                  (currentStep === 'configure' && false) // Always allow configuration step
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {currentStep === 'upload' && selectedFile && !parsedData.length ? (
                  isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};