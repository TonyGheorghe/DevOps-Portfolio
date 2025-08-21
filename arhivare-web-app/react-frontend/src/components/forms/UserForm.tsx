// src/components/forms/UserForm.tsx - FINAL FIXED VERSION with Correct Roles
import React, { useState } from 'react';
import { 
  User, Lock, Shield, Save, X, AlertCircle, 
  Eye, EyeOff, UserCheck, AlertTriangle, Key, Building2, Mail
} from 'lucide-react';

// Types
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

// CORRECT ROLES - Updated to match backend
const VALID_ROLES = [
  { value: 'admin', label: 'Administrator', description: 'Acces complet la sistem', color: 'purple' },
  { value: 'audit', label: 'Audit', description: 'Vizualizare și rapoarte (read-only)', color: 'orange' },
  { value: 'client', label: 'Client', description: 'Management fonduri proprii', color: 'green' }
];

// Password strength calculator
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
  
  // Form mode
  const isEditMode = !!user;
  const formTitle = isEditMode ? 'Editare Utilizator' : 'Utilizator Nou';
  const submitButtonText = isEditMode ? 'Actualizează' : 'Creează';

  // Password strength
  const passwordStrength = getPasswordStrength(formData.password);

  // Check if client role is selected
  const isClientRole = formData.role === 'client';

  // Validation functions
  const validateUsername = (username: string): string | null => {
    if (!username.trim()) return 'Username-ul este obligatoriu';
    if (username.length < 3) return 'Username-ul trebuie să aibă cel puțin 3 caractere';
    if (username.length > 64) return 'Username-ul poate avea maxim 64 caractere';
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return 'Username-ul poate conține doar litere, cifre, underscore, cratimă și punct';
    }
    
    // Check for duplicates
    const duplicate = existingUsers.find(u => 
      u.id !== user?.id && u.username.toLowerCase() === username.toLowerCase()
    );
    if (duplicate) return 'Acest username este deja folosit';
    
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!isEditMode && !password) return 'Parola este obligatorie';
    if (password && password.length < 8) return 'Parola trebuie să aibă cel puțin 8 caractere';
    if (password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'Parola trebuie să conțină cel puțin o literă mică, o literă mare și o cifră';
    }
    return null;
  };

  const validateRole = (role: string): string | null => {
    if (!role) return 'Rolul este obligatoriu';
    const validRoles = VALID_ROLES.map(r => r.value);
    if (!validRoles.includes(role)) return 'Rolul selectat nu este valid';
    return null;
  };

  const validateCompanyName = (companyName: string, role: string): string | null => {
    if (role === 'client' && !companyName.trim()) {
      return 'Numele companiei este obligatoriu pentru clienți';
    }
    if (companyName && companyName.length > 255) {
      return 'Numele companiei poate avea maxim 255 caractere';
    }
    return null;
  };

  const validateContactEmail = (email: string): string | null => {
    if (email && email.trim()) {
      const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
      if (!emailRegex.test(email)) {
        return 'Adresa de email nu este validă';
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
    
    // Ensure at least one of each required character type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill remaining length with random characters
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
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
          : 'A apărut o eroare la salvarea utilizatorului'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form disabled state
  const formDisabled = isLoading || isSubmitting;

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <User className="h-6 w-6 text-blue-600" />
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
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Error message */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Eroare la salvare</h4>
              <p className="text-sm text-red-700 mt-1">{submitError}</p>
            </div>
          </div>
        )}

        {/* Edit mode info */}
        {isEditMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <UserCheck className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Editare utilizator</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Lasă parola goală pentru a păstra parola actuală
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Username field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="h-4 w-4 inline mr-1" />
            Username *
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            placeholder="ex: admin, john.doe"
            disabled={formDisabled}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 ${
              errors.username ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.username && (
            <p className="text-red-600 text-sm mt-1">{errors.username}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Doar litere, cifre, underscore, cratimă și punct
          </p>
        </div>

        {/* Role field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Shield className="h-4 w-4 inline mr-1" />
            Rol *
          </label>
          <select
            value={formData.role}
            onChange={(e) => handleInputChange('role', e.target.value)}
            disabled={formDisabled}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 ${
              errors.role ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            {VALID_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="text-red-600 text-sm mt-1">{errors.role}</p>
          )}
          
          {/* Role descriptions */}
          <div className="mt-2 space-y-1 text-xs text-gray-500">
            {VALID_ROLES.map((role) => (
              <div key={role.value} className="flex items-center">
                {role.value === 'admin' && <Shield className="h-3 w-3 mr-1 text-purple-600" />}
                {role.value === 'audit' && <Eye className="h-3 w-3 mr-1 text-orange-600" />}
                {role.value === 'client' && <Building2 className="h-3 w-3 mr-1 text-green-600" />}
                <span><strong>{role.label}:</strong> {role.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Company Name field - Only for clients */}
        {isClientRole && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="h-4 w-4 inline mr-1" />
              Numele Companiei *
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              placeholder="ex: Tractorul Brașov Heritage SRL"
              disabled={formDisabled}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 ${
                errors.company_name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.company_name && (
              <p className="text-red-600 text-sm mt-1">{errors.company_name}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Numele companiei pentru care gestionează fondurile
            </p>
          </div>
        )}

        {/* Contact Email field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="h-4 w-4 inline mr-1" />
            Email Contact {isClientRole && '(recomandat)'}
          </label>
          <input
            type="email"
            value={formData.contact_email}
            onChange={(e) => handleInputChange('contact_email', e.target.value)}
            placeholder="ex: contact@companie.ro"
            disabled={formDisabled}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 ${
              errors.contact_email ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.contact_email && (
            <p className="text-red-600 text-sm mt-1">{errors.contact_email}</p>
          )}
        </div>

        {/* Password field */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              <Lock className="h-4 w-4 inline mr-1" />
              Parolă {!isEditMode && '*'}
            </label>
            {!isEditMode && (
              <button
                type="button"
                onClick={generatePassword}
                disabled={formDisabled}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1 disabled:opacity-50"
              >
                <Key className="h-3 w-3" />
                <span>Generează</span>
              </button>
            )}
          </div>
          
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder={isEditMode ? 'Lasă gol pentru a păstra parola actuală' : 'Minim 8 caractere'}
              disabled={formDisabled}
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 ${
                errors.password ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={formDisabled}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          
          {errors.password && (
            <p className="text-red-600 text-sm mt-1">{errors.password}</p>
          )}
          
          {/* Password strength indicator */}
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Puterea parolei:</span>
                <span className={`font-medium text-${passwordStrength.color}-600`}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 bg-${passwordStrength.color}-500`}
                  style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Trebuie să conțină: literă mică, literă mare, cifră (min. 8 caractere)
              </p>
            </div>
          )}
        </div>

        {/* Notes field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note Administrative
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Note despre utilizator..."
            rows={3}
            disabled={formDisabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-50 disabled:opacity-60 resize-none"
          />
        </div>

        {/* Security warning for admin role */}
        {formData.role === 'admin' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">Atenție: Rol Administrator</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Administratorii au acces complet la toate datele și funcționalitățile aplicației, 
                  inclusiv managementul utilizatorilor și fondurilor.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Client role info */}
        {formData.role === 'client' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Building2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-green-800">Client Information</h4>
                <p className="text-sm text-green-700 mt-1">
                  Clienții pot gestiona doar fondurile care le sunt assignate de administrator. 
                  Numele companiei este obligatoriu pentru identificarea fondurilor.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form buttons */}
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

export default UserForm;
