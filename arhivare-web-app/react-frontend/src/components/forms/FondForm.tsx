// src/components/forms/FondForm.tsx - UPDATED WITH i18n INTEGRATION
import React, { useState, useEffect, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  Building2, User, MapPin, Mail, Phone, FileText, 
  Link, Save, X, AlertCircle, AlertTriangle, Lightbulb, Users
} from 'lucide-react';
import { useLanguage } from '../common/LanguageSystem';

// Types (unchanged)
interface Fond {
  id: number;
  company_name: string;
  holder_name: string;
  address?: string;
  email?: string;
  phone?: string;
  notes?: string;
  source_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  owner_id?: number;
}

interface UserOption {
  id: number;
  username: string;
  role: string;
  company_name?: string;
}

interface FondFormData {
  company_name: string;
  holder_name: string;
  address: string;
  email: string;
  phone: string;
  notes: string;
  source_url: string;
  active: boolean;
  owner_id?: number;
}

interface FondFormProps {
  fond?: Fond;
  existingFonds?: Fond[];
  availableUsers?: UserOption[];
  currentUserRole?: string;
  onSave: (fondData: FondFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Utility functions (unchanged)
const normalizeCompanyName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/^(sc|sa|srl|sra|ltd|llc|inc|corp|corporation)\s+/i, '')
    .replace(/\s+(sc|sa|srl|sra|ltd|llc|inc|corp|corporation)$/i, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const calculateSimilarity = (str1: string, str2: string): number => {
  const norm1 = normalizeCompanyName(str1);
  const norm2 = normalizeCompanyName(str2);
  
  if (norm1 === norm2) return 1.0;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;
  
  const words1 = norm1.split(' ');
  const words2 = norm2.split(' ');
  
  let commonWords = 0;
  words1.forEach(word1 => {
    if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
      commonWords++;
    }
  });
  
  return commonWords / Math.max(words1.length, words2.length);
};

// UPDATED: Validation schema with i18n
const createFondSchema = (
      existingFonds: Fond[] = [],
      t: (key: string, options?: Record<string, any>) => string, 
      currentFondId?: number 
    ) => 
  yup.object().shape({
    company_name: yup
      .string()
      .required(t('fond.validation.company.required'))
      .min(2, t('fond.validation.company.min'))
      .max(255, t('fond.validation.company.max'))
      .test('duplicate-check', t('fond.validation.company.duplicate'), function(value) {
        if (!value) return true;
        
        const duplicates = existingFonds.filter(fond => {
          if (currentFondId && fond.id === currentFondId) return false;
          const similarity = calculateSimilarity(value, fond.company_name);
          return similarity >= 0.8;
        });
        
        if (duplicates.length > 0) {
          return this.createError({
            message: t('fond.duplicate.suggestions', { 
              companies: duplicates.map(f => f.company_name).join(', ') 
            })
          });
        }
        
        return true;
      }),
    
    holder_name: yup
      .string()
      .required(t('fond.validation.holder.required'))
      .min(2, t('fond.validation.holder.min'))
      .max(255, t('fond.validation.holder.max')),
    
    address: yup.string().default('').max(500, 'Adresa poate avea maxim 500 caractere'),
    
    email: yup
      .string()
      .default('')
      .test('email', t('fond.validation.email.invalid'), function(value) {
        if (!value || value === '') return true;
        return yup.string().email().isValidSync(value);
      })
      .max(100, 'Email-ul poate avea maxim 100 caractere'),
    
    phone: yup
      .string()
      .default('')
      .test('phone', t('fond.validation.phone.invalid'), function(value) {
        if (!value || value === '') return true;
        return /^[+]?[\d\s\-()]+$/.test(value);
      })
      .max(20, 'Numărul poate avea maxim 20 caractere'),
    
    notes: yup.string().default('').max(1000, 'Notele pot avea maxim 1000 caractere'),
    
    source_url: yup
      .string()
      .default('')
      .test('url', t('fond.validation.url.invalid'), function(value) {
        if (!value || value === '') return true;
        return yup.string().url().isValidSync(value);
      })
      .max(500, 'URL-ul poate avea maxim 500 caractere'),
    
    active: yup.boolean().default(true).required(),
    
    owner_id: yup
      .number()
      .transform((value, originalValue) => {
        if (originalValue === '' || originalValue === 'unassigned' || originalValue === undefined || originalValue === null) {
          return undefined;
        }
        return value;
      })
      .typeError('Selectați un utilizator valid')
      .optional()
  });

export const FondForm: React.FC<FondFormProps> = ({
  fond,
  existingFonds = [],
  availableUsers = [],
  currentUserRole,
  onSave,
  onCancel,
  isLoading = false
}) => {
  // ADDED: i18n hook
  const { t } = useLanguage();
  
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<UserOption[]>(availableUsers);
  
  // Determine form mode with i18n
  const isEditMode = !!fond;
  const formTitle = isEditMode ? t('fond.form.edit') : t('fond.form.create');
  const submitButtonText = isEditMode ? t('fond.form.update.button') : t('fond.form.create.button');
  
  const canAssignOwner = currentUserRole === 'admin';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Load users if not provided and user is admin
  useEffect(() => {
    const loadUsers = async () => {
      if (!canAssignOwner || availableUsers.length > 0) return;
      
      setLoadingUsers(true);
      try {
        const response = await fetch(`${API_BASE_URL}/users/?skip=0&limit=100`, {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const usersData = await response.json();
          const clientUsers = usersData.filter((user: UserOption) => user.role === 'client');
          setUsers(clientUsers);
        }
      } catch (err) {
        console.error('Error loading users:', err);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, [canAssignOwner, availableUsers.length]);

  // UPDATED: Create schema with i18n
  const fondSchema = useMemo(() => 
    createFondSchema(existingFonds,t, fond?.id), 
    [existingFonds,t , fond?.id]
  );

  // Form setup with validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm<FondFormData>({
    resolver: yupResolver(fondSchema) as any,
    defaultValues: {
      company_name: fond?.company_name || '',
      holder_name: fond?.holder_name || '',
      address: fond?.address || '',
      email: fond?.email || '',
      phone: fond?.phone || '',
      notes: fond?.notes || '',
      source_url: fond?.source_url || '',
      active: fond?.active ?? true,
      owner_id: fond?.owner_id
    }
  });

  const watchedCompanyName = watch('company_name');
  const watchedOwnerId = watch('owner_id');

  // Duplicate detection
  const potentialDuplicates = useMemo(() => {
    if (!watchedCompanyName || watchedCompanyName.length < 3) return [];
    
    return existingFonds
      .filter(f => {
        if (isEditMode && f.id === fond?.id) return false;
        const similarity = calculateSimilarity(watchedCompanyName, f.company_name);
        return similarity >= 0.6;
      })
      .sort((a, b) => {
        const simA = calculateSimilarity(watchedCompanyName, a.company_name);
        const simB = calculateSimilarity(watchedCompanyName, b.company_name);
        return simB - simA;
      })
      .slice(0, 3);
  }, [watchedCompanyName, existingFonds, isEditMode, fond?.id]);

  useEffect(() => {
    setShowDuplicateWarning(potentialDuplicates.length > 0);
  }, [potentialDuplicates]);

  // Form submission
  const onSubmit: SubmitHandler<FondFormData> = async (data) => {
    try {
      setSubmitError(null);
      await onSave(data);
      
      if (!isEditMode) {
        reset();
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : t('fond.error.create')
      );
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: Fond) => {
    setValue('company_name', suggestion.company_name);
    setValue('holder_name', suggestion.holder_name);
    setValue('address', suggestion.address || '');
    setValue('email', suggestion.email || '');
    setValue('phone', suggestion.phone || '');
    setShowDuplicateWarning(false);
  };

  const selectedUser = users.find(user => user.id === watchedOwnerId);
  const formDisabled = isLoading || isSubmitting;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formTitle}</h3>
        </div>
        <button
          onClick={onCancel}
          disabled={formDisabled}
          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          title={t('common.close')}
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Error message */}
        {submitError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">{t('error.generic')}</h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{submitError}</p>
            </div>
          </div>
        )}

        {/* Duplicate Warning */}
        {showDuplicateWarning && potentialDuplicates.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {t('fond.duplicate.warning')}
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {t('fond.duplicate.message')}
                </p>
                <div className="mt-3 space-y-2">
                  {potentialDuplicates.map((duplicate) => (
                    <button
                      key={duplicate.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(duplicate)}
                      className="block w-full text-left p-2 text-sm bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 rounded border transition-colors"
                    >
                      <div className="font-medium text-yellow-900 dark:text-yellow-100">
                        {duplicate.company_name}
                      </div>
                      <div className="text-yellow-700 dark:text-yellow-300">
                        {t('fond.holder.name')}: {duplicate.holder_name}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center text-xs text-yellow-600 dark:text-yellow-400">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  <span>{t('fond.duplicate.select.tip')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Company Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Building2 className="h-4 w-4 inline mr-1" />
            {t('fond.company.name')} *
          </label>
          <input
            {...register('company_name')}
            type="text"
            placeholder={t('fond.company.name.placeholder')}
            disabled={formDisabled}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
              errors.company_name ? 'border-red-300 dark:border-red-600' : 
              showDuplicateWarning ? 'border-yellow-300 dark:border-yellow-600' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.company_name && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.company_name.message}</p>
          )}
        </div>

        {/* Archive Holder Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <User className="h-4 w-4 inline mr-1" />
            {t('fond.holder.name')} *
          </label>
          <input
            {...register('holder_name')}
            type="text"
            placeholder={t('fond.holder.name.placeholder')}
            disabled={formDisabled}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
              errors.holder_name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.holder_name && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.holder_name.message}</p>
          )}
        </div>

        {/* Owner Assignment Section - Only for Admins */}
        {canAssignOwner && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100">{t('fond.owner.assignment')}</h4>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('fond.owner.assign.to')}
              </label>
              <select
                {...register('owner_id')}
                disabled={formDisabled || loadingUsers}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  errors.owner_id ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">{t('fond.owner.unassigned')}</option>
                {loadingUsers ? (
                  <option disabled>{t('common.loading')}</option>
                ) : (
                  users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} {user.company_name ? `(${user.company_name})` : ''}
                    </option>
                  ))
                )}
              </select>
              
              {errors.owner_id && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.owner_id.message}</p>
              )}
              
              {selectedUser && (
                <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-sm text-blue-800 dark:text-blue-200">
                  <strong>{t('fond.owner.selected', { username: selectedUser.username })}</strong>
                  {selectedUser.company_name && ` - ${selectedUser.company_name}`}
                </div>
              )}
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('fond.owner.info')}
              </p>
            </div>
          </div>
        )}

        {/* Address Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <MapPin className="h-4 w-4 inline mr-1" />
            {t('fond.address')}
          </label>
          <input
            {...register('address')}
            type="text"
            placeholder={t('fond.address.placeholder')}
            disabled={formDisabled}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
              errors.address ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.address && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.address.message}</p>
          )}
        </div>

        {/* Contact Info - Grid with 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Mail className="h-4 w-4 inline mr-1" />
              {t('fond.email')}
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder={t('fond.email.placeholder')}
              disabled={formDisabled}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                errors.email ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.email && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Phone className="h-4 w-4 inline mr-1" />
              {t('fond.phone')}
            </label>
            <input
              {...register('phone')}
              type="tel"
              placeholder={t('fond.phone.placeholder')}
              disabled={formDisabled}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                errors.phone ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.phone && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>
        </div>

        {/* Source URL Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Link className="h-4 w-4 inline mr-1" />
            {t('fond.source.url')}
          </label>
          <input
            {...register('source_url')}
            type="url"
            placeholder={t('fond.source.url.placeholder')}
            disabled={formDisabled}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
              errors.source_url ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.source_url && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.source_url.message}</p>
          )}
        </div>

        {/* Notes Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <FileText className="h-4 w-4 inline mr-1" />
            {t('fond.notes')}
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder={t('fond.notes.placeholder')}
            disabled={formDisabled}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
              errors.notes ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.notes && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.notes.message}</p>
          )}
        </div>

        {/* Active Status Checkbox */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              {...register('active')}
              type="checkbox"
              disabled={formDisabled}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 disabled:opacity-60 dark:bg-gray-700"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('fond.status.active')}
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={formDisabled}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={formDisabled}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{t('fond.form.saving')}</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{submitButtonText}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FondForm;
