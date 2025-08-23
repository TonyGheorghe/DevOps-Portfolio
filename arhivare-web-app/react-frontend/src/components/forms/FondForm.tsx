// src/components/forms/FondForm.tsx - Enhanced with Owner Assignment
import React, { useState, useEffect, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  Building2, User, MapPin, Mail, Phone, FileText, 
  Link, Save, X, AlertCircle, AlertTriangle, Lightbulb, Users
} from 'lucide-react';

// Types
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
  owner_id?: number; // ADDED: owner assignment field
}

// NEW: User type for dropdown
interface UserOption {
  id: number;
  username: string;
  role: string;
  company_name?: string;
}

// Form data type that includes owner_id
interface FondFormData {
  company_name: string;
  holder_name: string;
  address: string;
  email: string;
  phone: string;
  notes: string;
  source_url: string;
  active: boolean;
  owner_id?: number; // ADDED: owner assignment field
}

interface FondFormProps {
  fond?: Fond;
  existingFonds?: Fond[];
  availableUsers?: UserOption[]; // NEW: list of users for assignment
  currentUserRole?: string; // NEW: current user role to control visibility
  onSave: (fondData: FondFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Utility function pentru normalizarea numelor companiilor
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

// Funcție pentru calcularea similarității între două string-uri
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

// Enhanced validation schema with owner_id
const createFondSchema = (existingFonds: Fond[] = [], currentFondId?: number) => 
  yup.object({
    company_name: yup
      .string()
      .required('Numele companiei este obligatoriu')
      .min(2, 'Numele trebuie să aibă cel puțin 2 caractere')
      .max(255, 'Numele poate avea maxim 255 caractere')
      .test('duplicate-check', 'Această companie poate să existe deja în baza de date', function(value) {
        if (!value) return true;
        
        const duplicates = existingFonds.filter(fond => {
          if (currentFondId && fond.id === currentFondId) return false;
          const similarity = calculateSimilarity(value, fond.company_name);
          return similarity >= 0.8;
        });
        
        if (duplicates.length > 0) {
          return this.createError({
            message: `Companii similare găsite: ${duplicates.map(f => f.company_name).join(', ')}`
          });
        }
        
        return true;
      }),
    
    holder_name: yup
      .string()
      .required('Deținătorul arhivei este obligatoriu')
      .min(2, 'Numele deținătorului trebuie să aibă cel puțin 2 caractere')
      .max(255, 'Numele poate avea maxim 255 caractere'),
    
    address: yup.string().default('').max(500, 'Adresa poate avea maxim 500 caractere'),
    email: yup
      .string()
      .default('')
      .test('email', 'Adresa de email nu este validă', function(value) {
        if (!value || value === '') return true;
        return yup.string().email().isValidSync(value);
      })
      .max(100, 'Email-ul poate avea maxim 100 caractere'),
    
    phone: yup
      .string()
      .default('')
      .test('phone', 'Numărul de telefon conține caractere invalide', function(value) {
        if (!value || value === '') return true;
        return /^[\+]?[\d\s\-\(\)]+$/.test(value);
      })
      .max(20, 'Numărul poate avea maxim 20 caractere'),
    
    notes: yup.string().default('').max(1000, 'Notele pot avea maxim 1000 caractere'),
    source_url: yup
      .string()
      .default('')
      .test('url', 'URL-ul nu este valid', function(value) {
        if (!value || value === '') return true;
        return yup.string().url().isValidSync(value);
      })
      .max(500, 'URL-ul poate avea maxim 500 caractere'),
    
    active: yup.boolean().default(true).required(),
    
    // NEW: Owner assignment validation
    owner_id: yup
      .number()
      .nullable()
      .transform((value, originalValue) => {
        if (originalValue === '' || originalValue === 'unassigned') return null;
        return value;
      })
      .typeError('Selectați un utilizator valid')
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<UserOption[]>(availableUsers);
  
  // Determină modul formularului
  const isEditMode = !!fond;
  const formTitle = isEditMode ? 'Editare Fond' : 'Fond Nou';
  const submitButtonText = isEditMode ? 'Actualizează' : 'Creează';
  
  // Check if current user is admin (only admins can assign owners)
  const canAssignOwner = currentUserRole === 'admin';

  // Get auth headers
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
          // Filter only client users for assignment
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

  // Creează schema dinamică cu fondurile existente
  const fondSchema = useMemo(() => 
    createFondSchema(existingFonds, fond?.id), 
    [existingFonds, fond?.id]
  );

  // Configurare React Hook Form cu schema dinamică
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm<FondFormData>({
    resolver: yupResolver(fondSchema),
    defaultValues: {
      company_name: fond?.company_name || '',
      holder_name: fond?.holder_name || '',
      address: fond?.address || '',
      email: fond?.email || '',
      phone: fond?.phone || '',
      notes: fond?.notes || '',
      source_url: fond?.source_url || '',
      active: fond?.active ?? true,
      owner_id: fond?.owner_id || undefined // NEW: set owner_id from fond
    }
  });

  // Watch pentru company_name pentru detectarea duplicatelor în timp real
  const watchedCompanyName = watch('company_name');
  const watchedOwnerId = watch('owner_id');

  // Detectarea duplicatelor în timp real
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

  // Efect pentru afișarea warning-ului
  useEffect(() => {
    setShowDuplicateWarning(potentialDuplicates.length > 0);
  }, [potentialDuplicates]);

  // Handler pentru submit cu type safety
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
          : 'A apărut o eroare la salvarea fondului'
      );
    }
  };

  // Handler pentru selectarea unui duplicat sugerat
  const handleSelectSuggestion = (suggestion: Fond) => {
    setValue('company_name', suggestion.company_name);
    setValue('holder_name', suggestion.holder_name);
    setValue('address', suggestion.address || '');
    setValue('email', suggestion.email || '');
    setValue('phone', suggestion.phone || '');
    setShowDuplicateWarning(false);
  };

  // Get currently selected user for display
  const selectedUser = users.find(user => user.id === watchedOwnerId);

  // Loading state pentru tot formularul
  const formDisabled = isLoading || isSubmitting;

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Building2 className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">{formTitle}</h3>
        </div>
        <button
          onClick={onCancel}
          disabled={formDisabled}
          className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Error message general */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Eroare la salvare</h4>
              <p className="text-sm text-red-700 mt-1">{submitError}</p>
            </div>
          </div>
        )}

        {/* Duplicate Warning */}
        {showDuplicateWarning && potentialDuplicates.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-800">
                  Companii similare detectate
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Am găsit companii cu nume similar. Vrei să selectezi una existentă?
                </p>
                <div className="mt-3 space-y-2">
                  {potentialDuplicates.map((duplicate) => (
                    <button
                      key={duplicate.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(duplicate)}
                      className="block w-full text-left p-2 text-sm bg-yellow-100 hover:bg-yellow-200 rounded border transition-colors"
                    >
                      <div className="font-medium text-yellow-900">
                        {duplicate.company_name}
                      </div>
                      <div className="text-yellow-700">
                        Deținător: {duplicate.holder_name}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center text-xs text-yellow-600">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  Click pe o sugestie pentru a o selecta
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nume companie - Required cu detectarea duplicatelor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building2 className="h-4 w-4 inline mr-1" />
            Numele companiei *
          </label>
          <input
            {...register('company_name')}
            type="text"
            placeholder="ex: Tractorul Brașov SA"
            disabled={formDisabled}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 ${
              errors.company_name ? 'border-red-300' : 
              showDuplicateWarning ? 'border-yellow-300' : 'border-gray-300'
            }`}
          />
          {errors.company_name && (
            <p className="text-red-600 text-sm mt-1">{errors.company_name.message}</p>
          )}
        </div>

        {/* Deținător arhivă - Required */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="h-4 w-4 inline mr-1" />
            Deținător arhivă *
          </label>
          <input
            {...register('holder_name')}
            type="text"
            placeholder="ex: Arhiva Națională Brașov"
            disabled={formDisabled}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 ${
              errors.holder_name ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.holder_name && (
            <p className="text-red-600 text-sm mt-1">{errors.holder_name.message}</p>
          )}
        </div>

        {/* NEW: Owner Assignment Section - Only for Admins */}
        {canAssignOwner && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Users className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-blue-900">Assignment Proprietar</h4>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignează către client
              </label>
              <select
                {...register('owner_id')}
                disabled={formDisabled || loadingUsers}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 ${
                  errors.owner_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">-- Neasignat --</option>
                {loadingUsers ? (
                  <option disabled>Se încarcă utilizatorii...</option>
                ) : (
                  users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} {user.company_name ? `(${user.company_name})` : ''}
                    </option>
                  ))
                )}
              </select>
              
              {errors.owner_id && (
                <p className="text-red-600 text-sm mt-1">{errors.owner_id.message}</p>
              )}
              
              {/* Display selected user info */}
              {selectedUser && (
                <div className="mt-2 p-2 bg-blue-100 rounded text-sm text-blue-800">
                  <strong>Selectat:</strong> {selectedUser.username}
                  {selectedUser.company_name && ` - ${selectedUser.company_name}`}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-1">
                Fondul va fi vizibil și editabil doar de utilizatorul selectat
              </p>
            </div>
          </div>
        )}

        {/* Adresă */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="h-4 w-4 inline mr-1" />
            Adresă
          </label>
          <input
            {...register('address')}
            type="text"
            placeholder="ex: Str. Industriei 15, Brașov, 500269"
            disabled={formDisabled}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 ${
              errors.address ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.address && (
            <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>
          )}
        </div>

        {/* Contact info - row cu 2 coloane */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-1" />
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="contact@arhiva.ro"
              disabled={formDisabled}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Telefon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 inline mr-1" />
              Telefon
            </label>
            <input
              {...register('phone')}
              type="tel"
              placeholder="+40 268 123 456"
              disabled={formDisabled}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>
        </div>

        {/* URL sursă */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Link className="h-4 w-4 inline mr-1" />
            URL sursă
          </label>
          <input
            {...register('source_url')}
            type="url"
            placeholder="https://arhiva.ro/fonduri/tractorul"
            disabled={formDisabled}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 ${
              errors.source_url ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.source_url && (
            <p className="text-red-600 text-sm mt-1">{errors.source_url.message}</p>
          )}
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="h-4 w-4 inline mr-1" />
            Note
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder="Informații suplimentare despre fond..."
            disabled={formDisabled}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 resize-none ${
              errors.notes ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.notes && (
            <p className="text-red-600 text-sm mt-1">{errors.notes.message}</p>
          )}
        </div>

        {/* Status activ - pentru toate modurile */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              {...register('active')}
              type="checkbox"
              disabled={formDisabled}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-60"
            />
            <span className="text-sm font-medium text-gray-700">
              Fond activ (vizibil în căutarea publică)
            </span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={formDisabled}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anulează
          </button>
          <button
            type="submit"
            disabled={formDisabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Se salvează...</span>
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
