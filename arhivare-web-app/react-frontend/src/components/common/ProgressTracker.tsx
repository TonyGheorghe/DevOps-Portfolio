// src/components/common/ProgressTracker.tsx
import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  X,
  Pause,
  Play,
  Square,
  Download,
  Eye,
  Info
} from 'lucide-react';

export interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'active' | 'completed' | 'error' | 'skipped';
  progress?: number; // 0-100
  message?: string;
  duration?: number; // in seconds
  error?: string;
}

export interface ProgressTrackerProps {
  steps: ProgressStep[];
  currentStep?: string;
  overallProgress?: number;
  estimatedTimeRemaining?: number;
  canCancel?: boolean;
  canPause?: boolean;
  isPaused?: boolean;
  showDetails?: boolean;
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onRetry?: (stepId: string) => void;
  className?: string;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  steps,
  currentStep,
  overallProgress,
  estimatedTimeRemaining,
  canCancel = true,
  canPause = false,
  isPaused = false,
  showDetails = true,
  onCancel,
  onPause,
  onResume,
  onRetry,
  className = ''
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [startTime] = useState<Date>(new Date());
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // Update elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, startTime]);

  const toggleStepDetails = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'active':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'skipped':
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700" />;
    }
  };

  const getStepBarColor = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return 'bg-green-500';
      case 'active':
        return 'bg-blue-500';
      case 'error':
        return 'bg-red-500';
      case 'skipped':
        return 'bg-gray-300 dark:bg-gray-600';
      default:
        return 'bg-gray-200 dark:bg-gray-700';
    }
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const overallProgressPercent = overallProgress ?? (totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isPaused ? (
              <Pause className="w-6 h-6 text-yellow-500" />
            ) : (
              <RefreshCw className={`w-6 h-6 ${overallProgressPercent === 100 ? 'text-green-500' : 'text-blue-500 animate-spin'}`} />
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isPaused ? 'Paused' : overallProgressPercent === 100 ? 'Completed' : 'In Progress'}
            </h3>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {completedSteps} of {totalSteps} steps completed
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {canPause && overallProgressPercent < 100 && (
            <button
              onClick={isPaused ? onResume : onPause}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
          )}
          
          {canCancel && overallProgressPercent < 100 && (
            <button
              onClick={onCancel}
              className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Overall Progress</span>
          <span>{Math.round(overallProgressPercent)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgressPercent}%` }}
          />
        </div>
      </div>

      {/* Time Information */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>Elapsed: {formatTime(elapsedTime)}</span>
          </div>
          {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>Remaining: {formatTime(estimatedTimeRemaining)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Steps */}
      {showDetails && (
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-2.5 top-8 w-0.5 h-6 bg-gray-200 dark:bg-gray-600" />
              )}

              {/* Step Item */}
              <div className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                step.status === 'active' 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                  : step.status === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  : step.status === 'completed'
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'border border-transparent'
              }`}>
                
                {/* Step Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getStepIcon(step)}
                </div>

                {/* Step Content */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-grow">
                      <h4 className={`font-medium ${
                        step.status === 'active' 
                          ? 'text-blue-900 dark:text-blue-300'
                          : step.status === 'error'
                          ? 'text-red-900 dark:text-red-300'
                          : step.status === 'completed'
                          ? 'text-green-900 dark:text-green-300'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {step.title}
                      </h4>
                      
                      {step.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {step.description}
                        </p>
                      )}
                    </div>

                    {/* Step Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {step.duration && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(step.duration)}
                        </span>
                      )}
                      
                      {step.status === 'error' && onRetry && (
                        <button
                          onClick={() => onRetry(step.id)}
                          className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
                        >
                          Retry
                        </button>
                      )}
                      
                      {(step.message || step.error) && (
                        <button
                          onClick={() => toggleStepDetails(step.id)}
                          className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline"
                        >
                          {expandedSteps.has(step.id) ? 'Hide' : 'Details'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Step Progress Bar (for active steps) */}
                  {step.status === 'active' && step.progress !== undefined && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>{step.message || 'Processing...'}</span>
                        <span>{step.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div
                          className={`${getStepBarColor(step)} h-1.5 rounded-full transition-all duration-300`}
                          style={{ width: `${step.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Expanded Details */}
                  {expandedSteps.has(step.id) && (step.message || step.error) && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded border">
                      {step.error ? (
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Error:</p>
                            <p className="text-sm text-red-600 dark:text-red-400">{step.error}</p>
                          </div>
                        </div>
                      ) : step.message ? (
                        <div className="flex items-start space-x-2">
                          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Details:</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{step.message}</p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary (when completed) */}
      {overallProgressPercent === 100 && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="font-medium text-green-900 dark:text-green-300">
              Process completed successfully in {formatTime(elapsedTime)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Simplified version for inline use
export const SimpleProgressBar: React.FC<{
  progress: number;
  message?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'red' | 'yellow';
  className?: string;
}> = ({
  progress,
  message,
  showPercentage = true,
  size = 'md',
  color = 'blue',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <div className={className}>
      {(message || showPercentage) && (
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>{message || ''}</span>
          {showPercentage && <span>{Math.round(progress)}%</span>}
        </div>
      )}
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

// Circular progress indicator
export const CircularProgress: React.FC<{
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  className?: string;
}> = ({
  progress,
  size = 80,
  strokeWidth = 8,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  showPercentage = true,
  className = ''
}) => {
  const normalizedRadius = (size - strokeWidth) / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        height={size}
        width={size}
        className="transform -rotate-90"
      >
        <circle
          stroke={backgroundColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
          className="transition-all duration-300"
        />
      </svg>
      {showPercentage && (
        <span className="absolute text-sm font-medium text-gray-900 dark:text-white">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
};

// Progress step builder utility
export const createProgressStep = (
  id: string,
  title: string,
  options: Partial<ProgressStep> = {}
): ProgressStep => ({
  id,
  title,
  status: 'pending',
  ...options
});

// Common progress step templates
export const COMMON_PROGRESS_STEPS = {
  UPLOAD: createProgressStep('upload', 'Upload File', {
    description: 'Uploading and parsing file content'
  }),
  VALIDATE: createProgressStep('validate', 'Validate Data', {
    description: 'Checking data format and integrity'
  }),
  PROCESS: createProgressStep('process', 'Process Data', {
    description: 'Processing and transforming data'
  }),
  SAVE: createProgressStep('save', 'Save Data', {
    description: 'Saving data to database'
  }),
  COMPLETE: createProgressStep('complete', 'Complete', {
    description: 'Operation completed successfully'
  })
};

// Hook for managing progress state
export const useProgressTracker = (initialSteps: ProgressStep[]) => {
  const [steps, setSteps] = useState<ProgressStep[]>(initialSteps);
  const [currentStep, setCurrentStep] = useState<string | undefined>(
    initialSteps.find(step => step.status === 'active')?.id
  );

  const updateStep = (stepId: string, updates: Partial<ProgressStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const startStep = (stepId: string, message?: string) => {
    updateStep(stepId, { status: 'active', message, progress: 0 });
    setCurrentStep(stepId);
  };

  const updateStepProgress = (stepId: string, progress: number, message?: string) => {
    updateStep(stepId, { progress, message });
  };

  const completeStep = (stepId: string, message?: string) => {
    updateStep(stepId, { status: 'completed', progress: 100, message });
  };

  const failStep = (stepId: string, error: string) => {
    updateStep(stepId, { status: 'error', error });
  };

  const skipStep = (stepId: string, message?: string) => {
    updateStep(stepId, { status: 'skipped', message });
  };

  const resetSteps = () => {
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending', progress: 0, message: undefined, error: undefined })));
    setCurrentStep(undefined);
  };

  const getOverallProgress = () => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
  };

  return {
    steps,
    currentStep,
    updateStep,
    startStep,
    updateStepProgress,
    completeStep,
    failStep,
    skipStep,
    resetSteps,
    getOverallProgress
  };
};