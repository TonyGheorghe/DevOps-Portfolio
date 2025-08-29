// src/components/ReassignmentModal.tsx - UPDATED with Complete i18n Support
import React, { useState } from 'react';
import { 
  AlertTriangle, CheckCircle, X, Users, Building2, 
  ArrowRight, User, Lightbulb, Shield, Target, Info
} from 'lucide-react';
import { useLanguage } from './common/LanguageSystem'; // Import language system

// Types remain unchanged
interface ReassignmentSuggestion {
  user_id: number;
  username: string;
  company_name: string;
  similarity: number;
  match_type: string;
  confidence: string;
}

interface CurrentOwner {
  id: number;
  username: string;
  company_name: string;
}

interface ReassignmentData {
  fond_id: number;
  fond_name: string;
  old_holder_name: string;
  new_holder_name: string;
  current_owner?: CurrentOwner;
  suggestions: ReassignmentSuggestion[];
  best_match: ReassignmentSuggestion;
  requires_confirmation: boolean;
}

interface ReassignmentModalProps {
  reassignmentData: ReassignmentData;
  onConfirm: (fondId: number, newOwnerId: number | null) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ReassignmentModal: React.FC<ReassignmentModalProps> = ({
  reassignmentData,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  const { t } = useLanguage(); // Add translation hook
  
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(
    reassignmentData.best_match.user_id
  );
  const [confirmationType, setConfirmationType] = useState<'assign' | 'unassign' | 'keep'>('assign');

  // Get confidence color
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  };

  // Get confidence label
  const getConfidenceLabel = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return t('reassignment.confidence.high');
      case 'medium':
        return t('reassignment.confidence.medium');
      default:
        return confidence;
    }
  };

  // Get similarity percentage
  const getSimilarityPercentage = (similarity: number) => {
    return Math.round(similarity * 100);
  };

  // Handle confirmation
  const handleConfirm = async () => {
    try {
      if (confirmationType === 'assign' && selectedOwnerId) {
        await onConfirm(reassignmentData.fond_id, selectedOwnerId);
      } else if (confirmationType === 'unassign') {
        await onConfirm(reassignmentData.fond_id, null);
      } else {
        // Keep current owner - cancel modal
        onCancel();
      }
    } catch (error) {
      console.error('Error confirming reassignment:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('reassignment.title')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('reassignment.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Fund Information */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100">{t('reassignment.fond.info')}</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-blue-800 dark:text-blue-200">{t('admin.table.company')}:</span>
                <span className="ml-2 text-blue-700 dark:text-blue-300">{reassignmentData.fond_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-blue-800 dark:text-blue-200">{t('results.holder')}:</span>
                <span className="text-blue-700 dark:text-blue-300">{reassignmentData.old_holder_name}</span>
                <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-900 dark:text-blue-100 font-medium">{reassignmentData.new_holder_name}</span>
              </div>
            </div>
          </div>

          {/* Current Owner */}
          {reassignmentData.current_owner && (
            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{t('reassignment.current.owner')}</h4>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <span className="font-medium">{t('users.table.user')}:</span>
                  <span className="ml-2">{reassignmentData.current_owner.username}</span>
                </div>
                {reassignmentData.current_owner.company_name && (
                  <div>
                    <span className="font-medium">{t('users.table.company')}:</span>
                    <span className="ml-2">{reassignmentData.current_owner.company_name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Best Match */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h4 className="font-medium text-green-900 dark:text-green-100">{t('reassignment.best.match')}</h4>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getConfidenceColor(reassignmentData.best_match.confidence)}`}>
                  {getConfidenceLabel(reassignmentData.best_match.confidence)}
                </span>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {getSimilarityPercentage(reassignmentData.best_match.similarity)}% {t('common.active')}
                </span>
              </div>
            </div>
            <div className="text-sm text-green-800 dark:text-green-200">
              <div>
                <span className="font-medium">{t('users.table.user')}:</span>
                <span className="ml-2">{reassignmentData.best_match.username}</span>
              </div>
              <div>
                <span className="font-medium">{t('users.table.company')}:</span>
                <span className="ml-2">{reassignmentData.best_match.company_name}</span>
              </div>
            </div>
          </div>

          {/* Additional Suggestions */}
          {reassignmentData.suggestions.length > 1 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                  {t('reassignment.other.suggestions')} ({reassignmentData.suggestions.length - 1})
                </h4>
              </div>
              <div className="space-y-2">
                {reassignmentData.suggestions.slice(1, 4).map((suggestion) => (
                  <label
                    key={suggestion.user_id}
                    className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="selectedOwner"
                        value={suggestion.user_id}
                        checked={selectedOwnerId === suggestion.user_id && confirmationType === 'assign'}
                        onChange={() => {
                          setSelectedOwnerId(suggestion.user_id);
                          setConfirmationType('assign');
                        }}
                        className="text-yellow-600 focus:ring-yellow-500"
                      />
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{suggestion.username}</div>
                        <div className="text-gray-600 dark:text-gray-400">{suggestion.company_name}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {getSimilarityPercentage(suggestion.similarity)}%
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Action Selection */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">{t('reassignment.action.choose')}</h4>
            </div>
            
            <div className="space-y-3">
              {/* Assign to best match */}
              <label className="flex items-center space-x-3 p-3 border dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name="confirmationType"
                  value="assign"
                  checked={confirmationType === 'assign'}
                  onChange={() => setConfirmationType('assign')}
                  className="text-green-600 focus:ring-green-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-900 dark:text-green-100">{t('reassignment.action.assign')}</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {t('reassignment.action.assign.description')} {reassignmentData.best_match.username} 
                    ({getSimilarityPercentage(reassignmentData.best_match.similarity)}% match)
                  </p>
                </div>
              </label>

              {/* Remove assignment */}
              <label className="flex items-center space-x-3 p-3 border dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name="confirmationType"
                  value="unassign"
                  checked={confirmationType === 'unassign'}
                  onChange={() => {
                    setConfirmationType('unassign');
                    setSelectedOwnerId(null);
                  }}
                  className="text-orange-600 focus:ring-orange-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="font-medium text-orange-900 dark:text-orange-100">{t('reassignment.action.remove')}</span>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    {t('reassignment.action.remove.description')}
                  </p>
                </div>
              </label>

              {/* Keep current assignment */}
              <label className="flex items-center space-x-3 p-3 border dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name="confirmationType"
                  value="keep"
                  checked={confirmationType === 'keep'}
                  onChange={() => setConfirmationType('keep')}
                  className="text-gray-600 focus:ring-gray-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{t('reassignment.action.keep')}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {t('reassignment.action.keep.description')}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">{t('reassignment.warning')}</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {t('reassignment.warning.text')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('reassignment.cancel')}
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
              confirmationType === 'assign' 
                ? 'bg-green-600 hover:bg-green-700' 
                : confirmationType === 'unassign'
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{t('reassignment.processing')}</span>
              </>
            ) : (
              <>
                {confirmationType === 'assign' && <CheckCircle className="h-4 w-4" />}
                {confirmationType === 'unassign' && <AlertTriangle className="h-4 w-4" />}
                {confirmationType === 'keep' && <X className="h-4 w-4" />}
                <span>
                  {confirmationType === 'assign' && t('reassignment.confirm.assign')}
                  {confirmationType === 'unassign' && t('reassignment.confirm.remove')}
                  {confirmationType === 'keep' && t('reassignment.confirm.keep')}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReassignmentModal;
