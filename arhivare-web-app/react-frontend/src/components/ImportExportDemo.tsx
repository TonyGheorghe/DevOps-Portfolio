// src/components/demo/ImportExportDemo.tsx
import React, { useState } from 'react';
import { Play, Code, Eye, Settings } from 'lucide-react';
import { ExportWizard } from './export/ExportWizard';
import { ImportWizard } from './import/ImportWizard';
import { ImportExportControls, QuickExportButton, QuickImportButton } from './dashboards/ImportExportIntegration';
import { ProgressTracker, SimpleProgressBar, CircularProgress, useProgressTracker, COMMON_PROGRESS_STEPS } from './common/ProgressTracker';

export const ImportExportDemo: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<string>('overview');
  const [userRole, setUserRole] = useState<'admin' | 'audit' | 'client'>('admin');

  // Progress demo state
  const progressTracker = useProgressTracker([
    COMMON_PROGRESS_STEPS.UPLOAD,
    COMMON_PROGRESS_STEPS.VALIDATE,
    COMMON_PROGRESS_STEPS.PROCESS,
    COMMON_PROGRESS_STEPS.SAVE,
    COMMON_PROGRESS_STEPS.COMPLETE
  ]);

  const [simpleProgress, setSimpleProgress] = useState(45);
  const [circularProgress, setCircularProgress] = useState(75);

  const runProgressDemo = () => {
    progressTracker.resetSteps();
    
    // Simulate step progression
    setTimeout(() => {
      progressTracker.startStep('upload', 'Uploading file...');
    }, 500);
    
    setTimeout(() => {
      progressTracker.updateStepProgress('upload', 100, 'Upload complete');
      progressTracker.completeStep('upload');
      progressTracker.startStep('validate', 'Validating data...');
    }, 2000);
    
    setTimeout(() => {
      progressTracker.updateStepProgress('validate', 100);
      progressTracker.completeStep('validate', 'Validation successful');
      progressTracker.startStep('process', 'Processing records...');
    }, 3500);
    
    setTimeout(() => {
      progressTracker.updateStepProgress('process', 100);
      progressTracker.completeStep('process');
      progressTracker.startStep('save', 'Saving to database...');
    }, 5000);
    
    setTimeout(() => {
      progressTracker.completeStep('save');
      progressTracker.completeStep('complete', 'Import completed successfully!');
    }, 6500);
  };

  const demoSections = [
    { id: 'overview', title: 'Overview', icon: <Eye className="w-4 h-4" /> },
    { id: 'export-wizard', title: 'Export Wizard', icon: <Code className="w-4 h-4" /> },
    { id: 'import-wizard', title: 'Import Wizard', icon: <Code className="w-4 h-4" /> },
    { id: 'progress-tracker', title: 'Progress Tracker', icon: <Settings className="w-4 h-4" /> },
    { id: 'integration', title: 'Dashboard Integration', icon: <Play className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Import/Export System Demo
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Test and preview all Import/Export UI components
              </p>
            </div>
            
            {/* Role Selector */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Test as:
              </label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as 'admin' | 'audit' | 'client')}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="admin">Admin</option>
                <option value="audit">Audit</option>
                <option value="client">Client</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Demo Sections</h3>
              <nav className="space-y-2">
                {demoSections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveDemo(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeDemo === section.id
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {section.icon}
                    <span className="ml-2">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              
              {/* Overview */}
              {activeDemo === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      System Overview
                    </h2>
                    <div className="prose dark:prose-invert max-w-none">
                      <p>
                        The Import/Export system provides comprehensive data management capabilities
                        with role-based access control and advanced validation features.
                      </p>
                    </div>
                  </div>

                  {/* Feature Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Export Features</h3>
                      <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                        <li>• Multi-format support (CSV, Excel, JSON, PDF)</li>
                        <li>• Template-based exports</li>
                        <li>• Field selection and filtering</li>
                        <li>• Progress tracking</li>
                        <li>• Role-based permissions</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <h3 className="font-medium text-green-900 dark:text-green-300 mb-2">Import Features</h3>
                      <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                        <li>• Drag & drop file upload</li>
                        <li>• Multi-format parsing (CSV, XLSX, JSON)</li>
                        <li>• Real-time validation</li>
                        <li>• Duplicate detection</li>
                        <li>• Dry run mode</li>
                      </ul>
                    </div>
                  </div>

                  {/* Current Role Info */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      Current Role: {userRole.toUpperCase()}
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {userRole === 'admin' && (
                        <p>✅ Full access to import/export, user assignment, and system statistics</p>
                      )}
                      {userRole === 'audit' && (
                        <p>👁️ Read-only export access with compliance reporting capabilities</p>
                      )}
                      {userRole === 'client' && (
                        <p>👤 Import/export personal funds with auto-assignment</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Export Wizard Demo */}
              {activeDemo === 'export-wizard' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Export Wizard Demo
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Test the complete export workflow with template selection, field customization,
                      and progress tracking.
                    </p>
                  </div>

                  <div className="flex space-x-4">
                    <QuickExportButton 
                      userRole={userRole}
                      className="px-6 py-3"
                    />
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Export Wizard Steps:</h3>
                    <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                      <li>1. Template Selection - Choose predefined or custom format</li>
                      <li>2. Field Selection - Pick which data fields to include</li>
                      <li>3. Filters - Configure data filtering options</li>
                      <li>4. Preview - Review data before export</li>
                      <li>5. Export - Process and download file</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Import Wizard Demo */}
              {activeDemo === 'import-wizard' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Import Wizard Demo
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Test the complete import workflow with file upload, validation,
                      and configuration options.
                    </p>
                  </div>

                  <div className="flex space-x-4">
                    <QuickImportButton 
                      userRole={userRole}
                      userId={1}
                      className="px-6 py-3"
                    />
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <h3 className="font-medium text-green-900 dark:text-green-300 mb-2">Import Wizard Steps:</h3>
                    <ol className="text-sm text-green-700 dark:text-green-400 space-y-1">
                      <li>1. File Upload - Drag & drop or browse for files</li>
                      <li>2. Data Validation - Parse and validate file content</li>
                      <li>3. Configuration - Set import options and assignments</li>
                      <li>4. Preview - Review data and validation results</li>
                      <li>5. Import - Execute import with progress tracking</li>
                      <li>6. Results - View import summary and any errors</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Progress Tracker Demo */}
              {activeDemo === 'progress-tracker' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Progress Tracker Demo
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Test various progress tracking components used throughout the system.
                    </p>
                  </div>

                  {/* Multi-step Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">Multi-step Progress Tracker</h3>
                      <button
                        onClick={runProgressDemo}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Run Demo
                      </button>
                    </div>
                    <ProgressTracker
                      steps={progressTracker.steps}
                      currentStep={progressTracker.currentStep}
                      overallProgress={progressTracker.getOverallProgress()}
                      canCancel={true}
                      canPause={true}
                    />
                  </div>

                  {/* Simple Progress Bars */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">Simple Progress Bar</h4>
                        <button
                          onClick={() => setSimpleProgress(Math.floor(Math.random() * 100))}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Random Update
                        </button>
                      </div>
                      <SimpleProgressBar
                        progress={simpleProgress}
                        message="Processing data..."
                        color="blue"
                        size="md"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">Circular Progress</h4>
                        <button
                          onClick={() => setCircularProgress(Math.floor(Math.random() * 100))}
                          className="text-sm text-green-600 dark:text-green-400 hover:underline"
                        >
                          Random Update
                        </button>
                      </div>
                      <div className="flex justify-center">
                        <CircularProgress
                          progress={circularProgress}
                          size={80}
                          color="#10b981"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Integration Demo */}
              {activeDemo === 'integration' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Dashboard Integration Demo
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Preview how the Import/Export controls integrate into existing dashboards.
                    </p>
                  </div>

                  <ImportExportControls
                    userRole={userRole}
                    userId={1}
                  />

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <h3 className="font-medium text-yellow-900 dark:text-yellow-300 mb-2">Integration Notes:</h3>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                      <li>• Components are designed to integrate seamlessly into existing dashboards</li>
                      <li>• Role-based access control automatically shows/hides features</li>
                      <li>• Recent activity tracking provides user feedback</li>
                      <li>• Quick action buttons available for toolbar integration</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};