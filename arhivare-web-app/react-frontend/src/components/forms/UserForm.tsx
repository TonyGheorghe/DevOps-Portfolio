// src/components/forms/UserForm.tsx - UPDATED WITH i18n INTEGRATION
import React, { useState } from 'react';
import { 
  User, Lock, Shield, Save, X, AlertCircle, 
  Eye, EyeOff, UserCheck, AlertTriangle, Key, Building2, Mail
} from 'lucide-react';
import { useLanguage } from '../common/LanguageSystem';

// Types (unchanged)
interface UserData {
  id: number;
  username: string;
  role: string;
  company_name?: string;
  contact_email?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

interface UserFormData {
  username: string;
  password: string;
  role: string;
  company_name: string;
  contact_email: string;
  notes: string;
}

interface UserFormProps {
  user?: UserData;
  existingUsers?: UserData[];
  onSave: (userData: UserFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// UPDATED: Valid roles with i18n
const getValidRoles = (t: (key: string) => string) => [
  { value: 'admin', label: t('user.role.admin'), description: t('user.role.admin.desc'), color: 'purple' },
  { value: 'audit', label: t('user.role.audit'), description: t('user.role.audit.desc'), color: 'orange' },
  { value: 'client', label: t('user.role.client'), description: t('user.role.client.desc'), color: 'green' }
];

// Password strength calculator (unchanged)
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  if (!password) return { score: 0, label: 'Nicio parolă', color: 'gray' };
  
  let score = 0;
  
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z\d]/.test(password)) score += 1;
  
  if (score <= 2) return { score, label: 'Slabă', color: 'red' };
  if (score <= 4) return { score, label: 'Medie', color: 'yellow' };
  return { score, label: 'Puternică', color: 'green' };
};

export const UserForm: React.FC<UserFormProps> = ({
  user,
  existingUsers = [],
  onSave,
  onCancel,
  isLoading = false
}) => {
  // ADDED: i18n hook
  const { t } = useLanguage();
  
  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    username: user?.username || '',
    password: '',
    role: user?.role || 'client',
    company_name: user?.company_name || '',
    contact_email: user?.contact_email || '',
    notes: user?.notes || ''
  });
  
  // UI state
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form mode with i18n
  const isEditMode = !!user;
  const formTitle = isEditMode ? t('user.form.edit') : t('user.form.create');
  const submitButtonText = isEditMode ? t('user.form.update.button') : t('user.form.create.button');

  // Get password strength with i18n
  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = {
    'Slabă': t('user.password.strength.weak'),
    'Medie': t('user.password.strength.medium'), 
    'Puternică': t('user.password.strength.strong')
  };
  const translatedStrength = {
    ...passwordStrength,
    label: strengthLabels[passwordStrength.label as keyof typeof strengthLabels] || passwordStrength.label
  };

  const isClientRole = formData.role === 'client';
  const validRoles = getValidRoles(t);

  // UPDATED: Validation functions with i18n
  const validateUsername = (username: string): string | null => {
    if (!username.trim()) return t('user.validation.username.required');
    if (username.length < 3) return t('user.validation.username.min');
    if (username.length > 64) return t('user.validation.username.max');
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return t('user.validation.username.pattern');
    }
    
    const duplicate = existingUsers.find(u => 
      u.id !== user?.id && u.username.toLowerCase() === username.toLowerCase()
    );
    if (duplicate) return t('user.validation.username.exists');
    
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!isEditMode && !password) return t('user.validation.password.required');
    if (password && password.length < 8) return t('user.validation.password.min');
    if (password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return t('user.validation.password.pattern');
    }
    return null;
  };

  const validateRole = (role: string): string | null => {
    if (!role) return t('user.validation.role.required');
    const validRoleValues = validRoles.map(r => r.value);
    if (!validRoleValues.includes(role)) return t('user.validation.role.invalid');
    return null;
  };

  const validateCompanyName = (companyName: string, role: string): string | null => {
    if (role === 'client' && !companyName.trim()) {
      return t('user.validation.company.required.client');
    }
    if (companyName && companyName.length > 255) {
      return t('user.validation.company.max');
    }
    return null;
  };

  const validateContactEmail = (email: string): string | null => {
    if (email && email.trim()) {
      const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
      if (!emailRegex.test(email)) {
        return t('user.validation.email.invalid');
      }
    }
    return null;
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    const usernameError = validateUsername(formData.username);
    if (usernameError) newErrors.username = usernameError;
    
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;
    
    const roleError = validateRole(formData.role);
    if (roleError) newErrors.role = roleError;

    const companyError = validateCompanyName(formData.company_name, formData.role);
    if (companyError) newErrors.company_name = companyError;

    const emailError = validateContactEmail(formData.contact_email);
    if (emailError) newErrors.contact_email = emailError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Clear company name if role changes from client to something else
    if (field === 'role' && value !== 'client') {
      setFormData(prev => ({ ...prev, company_name: '' }));
    }
  };

  // Generate secure password
  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let password = '';
    
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    const shuffled = password.split('').sort(() => Math.random() - 0.5).join('');
    handleInputChange('password', shuffled);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      await onSave(formData);
    } catch (error) {
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : t('user.error.create')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formDisabled = isLoading || isSubmitting;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

        {/* Edit mode info */}
        {isEditMode && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center">
              <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">{t('user.edit.info')}</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {t('user.edit.password.tip')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Username field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <User className="h-4 w-4 inline mr-1" />
            {t('user.username')} *
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            placeholder={t('user.username.placeholder')}
            disabled={formDisabled}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
              errors.username ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.username && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.username}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('user.username.help')}
          </p>
        </div>

        {/* Role field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Shield className="h-4 w-4 inline mr-1" />
            {t('user.role')} *
          </label>
          <select
            value={formData.role}
            onChange={(e) => handleInputChange('role', e.target.value)}
            disabled={formDisabled}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
              errors.role ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            {validRoles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.role}</p>
          )}
          
          {/* Role descriptions */}
          <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
            {validRoles.map((role) => (
              <div key={role.value} className="flex items-center">
                {role.value === 'admin' && <Shield className="h-3 w-3 mr-1 text-purple-600 dark:text-purple-400" />}
                {role.value === 'audit' && <Eye className="h-3 w-3 mr-1 text-orange-600 dark:text-orange-400" />}
                {role.value === 'client' && <Building2 className="h-3 w-3 mr-1 text-green-600 dark:text-green-400" />}
                <span><strong>{role.label}:</strong> {role.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Company Name field - Only for clients */}
        {isClientRole && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Building2 className="h-4 w-4 inline mr-1" />
              {t('user.company.name')} *
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              placeholder={t('user.company.name.placeholder')}
              disabled={formDisabled}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                errors.company_name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.company_name && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.company_name}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('user.company.name.help')}
            </p>
          </div>
        )}

        {/* Contact Email field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Mail className="h-4 w-4 inline mr-1" />
            {t('user.contact.email')} {isClientRole && t('user.contact.email.recommended')}
          </label>
          <input
            type="email"
            value={formData.contact_email}
            onChange={(e) => handleInputChange('contact_email', e.target.value)}
            placeholder={t('user.contact.email.placeholder')}
            disabled={formDisabled}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
              errors.contact_email ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.contact_email && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.contact_email}</p>
          )}
        </div>

        {/* Password field */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <Lock className="h-4 w-4 inline mr-1" />
              {t('user.password')} {!isEditMode && '*'}
            </label>
            {!isEditMode && (
              <button
                type="button"
                onClick={generatePassword}
                disabled={formDisabled}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center space-x-1 disabled:opacity-50"
              >
                <Key className="h-3 w-3" />
                <span>{t('user.password.generate')}</span>
              </button>
            )}
          </div>
          
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder={isEditMode ? t('user.password.placeholder.keep') : t('user.password.placeholder.new')}
              disabled={formDisabled}
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                errors.password ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={formDisabled}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          
          {errors.password && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.password}</p>
          )}
          
          {/* Password strength indicator */}
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">{t('user.password')} strength:</span>
                <span className={`font-medium text-${translatedStrength.color}-600 dark:text-${translatedStrength.color}-400`}>
                  {translatedStrength.label}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 bg-${translatedStrength.color}-500`}
                  style={{ width: `${(translatedStrength.score / 6) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('user.validation.password.pattern')}
              </p>
            </div>
          )}
        </div>

        {/* Notes field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('user.notes')}
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder={t('user.notes.placeholder')}
            rows={3}
            disabled={formDisabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* Security warning for admin role */}
        {formData.role === 'admin' && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">{t('user.role.admin.warning')}</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {t('user.role.admin.warning.desc')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Client role info */}
        {formData.role === 'client' && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Building2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-green-800 dark:text-green-200">{t('user.role.client.info')}</h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {t('user.role.client.info.desc')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Password security tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            {t('user.password.security.title')}
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>{t('user.password.security.length')}</li>
            <li>{t('user.password.security.mix')}</li>
            <li>{t('user.password.security.personal')}</li>
            <li>{t('user.password.security.reuse')}</li>
          </ul>
        </div>

        {/* Form buttons */}
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
                <span>{t('user.form.saving')}</span>
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

export default UserForm;
