// src/components/pages/UserProfile.tsx - UPDATED with i18n Integration
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, ArrowLeft, Eye, EyeOff, 
  AlertCircle, CheckCircle, Key, Clock, Calendar, Building2, Mail
} from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../AuthSystem';
import { useLanguage } from '../common/LanguageSystem'; // ADD i18n import
import { LanguageToggle } from '../common/LanguageSystem';
import { DarkModeToggle } from '../common/DarkModeSystem';

// Types (unchanged)
interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileUpdateData {
  company_name: string;
  contact_email: string;
  notes: string;
}

interface ProfileData {
  username: string;
  role: string;
  company_name?: string;
  contact_email?: string;
  notes?: string;
  created_at: string;
  id: number;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// UPDATED: Password change validation schema with i18n
const createPasswordChangeSchema = (t: (key: string) => string) => 
  yup.object({
    currentPassword: yup
      .string()
      .required(t('user.validation.password.required')),
    
    newPassword: yup
      .string()
      .required(t('user.validation.password.required'))
      .min(8, t('user.validation.password.min'))
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        t('user.validation.password.pattern')
      )
      .test('different-from-current', t('user.validation.password.different'), function(value) {
        return value !== this.parent.currentPassword;
      }),
    
    confirmPassword: yup
      .string()
      .required(t('user.validation.password.required'))
      .oneOf([yup.ref('newPassword')], t('user.validation.password.match'))
  });

// UPDATED: Profile update validation schema with i18n
const createProfileUpdateSchema = (t: (key: string) => string) => 
  yup.object({
    company_name: yup
      .string()
      .required(t('user.validation.company.required.client'))
      .min(2, t('fond.validation.company.min'))
      .max(255, t('user.validation.company.max')),
    
    contact_email: yup
      .string()
      .default('')
      .test('email', t('user.validation.email.invalid'), function(value) {
        if (!value || value === '') return true;
        return yup.string().email().isValidSync(value);
      })
      .max(100, 'Email-ul poate avea maxim 100 caractere'),
    
    notes: yup
      .string()
      .default('')
      .max(1000, 'Notele pot avea maxim 1000 caractere')
  });

// UPDATED: Password strength calculator with i18n
const getPasswordStrength = (password: string, t: (key: string) => string): { score: number; label: string; color: string } => {
  if (!password) return { score: 0, label: 'Nicio parolă', color: 'gray' };
  
  let score = 0;
  
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z\d]/.test(password)) score += 1;
  
  if (score <= 2) return { score, label: t('user.password.strength.weak'), color: 'red' };
  if (score <= 4) return { score, label: t('user.password.strength.medium'), color: 'yellow' };
  return { score, label: t('user.password.strength.strong'), color: 'green' };
};

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage(); // ADD i18n hook
  const navigate = useNavigate();
  
  // Role checks
  const isAdmin = user?.role === 'admin';
  const isAudit = user?.role === 'audit';
  const isClient = user?.role === 'client';
  
  // State management
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UPDATED: Password change form with i18n
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    watch: watchPassword,
    reset: resetPassword
  } = useForm<PasswordChangeData>({
    resolver: yupResolver(createPasswordChangeSchema(t))
  });

  // UPDATED: Profile update form with i18n
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
    setValue: setProfileValue
  } = useForm<ProfileUpdateData>({
    resolver: yupResolver(createProfileUpdateSchema(t)),
    defaultValues: {
      company_name: '',
      contact_email: '',
      notes: ''
    }
  });

  const watchedNewPassword = watchPassword('newPassword');
  const passwordStrength = getPasswordStrength(watchedNewPassword || '', t);

  // Auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          if (response.status === 401) {
            logout();
            navigate('/login');
            return;
          }
          throw new Error('Failed to load profile');
        }

        const data = await response.json();
        setProfileData({
          id: data.id,
          username: data.username,
          role: data.role,
          company_name: data.company_name,
          contact_email: data.contact_email,
          notes: data.notes,
          created_at: data.created_at || new Date().toISOString()
        });

        // Set profile form values for clients
        if (data.role === 'client') {
          setProfileValue('company_name', data.company_name || '');
          setProfileValue('contact_email', data.contact_email || '');
          setProfileValue('notes', data.notes || '');
        }

      } catch (err) {
        setError(t('profile.error.load_failed'));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, logout, navigate, setProfileValue, t]);

  // Clear messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle password change
  const onSubmitPasswordChange: SubmitHandler<PasswordChangeData> = async (data) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/users/${profileData?.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          username: profileData?.username,
          password: data.newPassword,
          role: profileData?.role,
          company_name: profileData?.company_name,
          contact_email: profileData?.contact_email,
          notes: profileData?.notes
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError(t('user.error.password.current.wrong'));
          return;
        }
        throw new Error('Failed to change password');
      }

      setSuccessMessage(t('user.success.password.changed'));
      resetPassword();
      
    } catch (err) {
      setError(t('user.error.password.change'));
    }
  };

  // Handle profile update (clients only)
  const onSubmitProfileUpdate: SubmitHandler<ProfileUpdateData> = async (data) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/users/${profileData?.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          username: profileData?.username,
          role: profileData?.role,
          company_name: data.company_name,
          contact_email: data.contact_email,
          notes: data.notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update profile');
      }

      const updatedData = await response.json();
      setProfileData(prev => prev ? {
        ...prev,
        company_name: updatedData.company_name,
        contact_email: updatedData.contact_email,
        notes: updatedData.notes
      } : null);

      setSuccessMessage(t('profile.success.updated'));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.error.update_failed'));
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (isAdmin) {
      navigate('/admin');
    } else if (isAudit) {
      navigate('/audit');
    } else if (isClient) {
      navigate('/client');
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-4">{t('profile.loading')}</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('error.generic')}</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">{t('profile.error.load_failed')}</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {t('profile.back_to_dashboard')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* UPDATED Header with i18n */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBack}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                title={t('common.back')}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('profile.title')}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('profile.subtitle')}</p>
              </div>
            </div>
            
            {/* ADD Language and Dark Mode toggles */}
            <div className="flex items-center space-x-3">
              <LanguageToggle size="sm" />
              <DarkModeToggle size="sm" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* UPDATED Messages with i18n */}
        {successMessage && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
              <p className="text-green-800 dark:text-green-200">{successMessage}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* UPDATED Profile Information with i18n */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('profile.info.title')}</h2>
              
              <div className="space-y-4">
                {/* Avatar */}
                <div className="flex justify-center">
                  <div className={`h-20 w-20 rounded-full flex items-center justify-center text-white text-2xl font-bold ${
                    isAdmin ? 'bg-blue-600' : isAudit ? 'bg-purple-600' : 'bg-green-600'
                  }`}>
                    {profileData.username.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* UPDATED User Details with i18n */}
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{profileData.username}</h3>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    isAdmin ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' : 
                    isAudit ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                    'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                  }`}>
                    {isAdmin ? t('user.role.admin') : isAudit ? t('user.role.audit') : t('user.role.client')}
                  </span>
                </div>

                {/* UPDATED Account Details with i18n */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4 space-y-3">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <User className="h-4 w-4 mr-2" />
                    <span>ID: {profileData.id}</span>
                  </div>
                  
                  {isClient && profileData.company_name && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Building2 className="h-4 w-4 mr-2" />
                      <span>{t('profile.company')}: {profileData.company_name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{t('profile.registered')}: {new Date(profileData.created_at).toLocaleDateString(t('profile.date_locale'))}</span>
                  </div>
                </div>

                {/* UPDATED Role Permissions with i18n */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{t('profile.permissions')}</h4>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1 text-green-500 dark:text-green-400" />
                      <span>{t('profile.permissions.public_search')}</span>
                    </div>
                    {isAdmin && (
                      <>
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500 dark:text-green-400" />
                          <span>{t('profile.permissions.fund_management')}</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500 dark:text-green-400" />
                          <span>{t('profile.permissions.user_management')}</span>
                        </div>
                      </>
                    )}
                    {isAudit && (
                      <>
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500 dark:text-green-400" />
                          <span>{t('profile.permissions.view_all_funds')}</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500 dark:text-green-400" />
                          <span>{t('profile.permissions.export_reports')}</span>
                        </div>
                      </>
                    )}
                    {isClient && (
                      <>
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500 dark:text-green-400" />
                          <span>{t('profile.permissions.own_funds')}</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500 dark:text-green-400" />
                          <span>{t('profile.permissions.add_new_funds')}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* UPDATED Forms Column with i18n */}
          <div className="lg:col-span-2 space-y-6">
            {/* UPDATED Client Profile Update Form with i18n */}
            {isClient && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-6">
                  <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('profile.update_profile')}</h2>
                </div>

                <form onSubmit={handleProfileSubmit(onSubmitProfileUpdate)} className="space-y-6">
                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Building2 className="h-4 w-4 inline mr-1" />
                      {t('user.company.name')} *
                    </label>
                    <input
                      {...registerProfile('company_name')}
                      type="text"
                      placeholder={t('user.company.name.placeholder')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                        profileErrors.company_name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {profileErrors.company_name && (
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">{profileErrors.company_name.message}</p>
                    )}
                  </div>

                  {/* Contact Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Mail className="h-4 w-4 inline mr-1" />
                      {t('user.contact.email')}
                    </label>
                    <input
                      {...registerProfile('contact_email')}
                      type="email"
                      placeholder={t('user.contact.email.placeholder')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                        profileErrors.contact_email ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {profileErrors.contact_email && (
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">{profileErrors.contact_email.message}</p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('user.notes')}
                    </label>
                    <textarea
                      {...registerProfile('notes')}
                      rows={3}
                      placeholder={t('user.notes.placeholder')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                        profileErrors.notes ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {profileErrors.notes && (
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">{profileErrors.notes.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isProfileSubmitting}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {isProfileSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>{t('profile.updating')}</span>
                        </>
                      ) : (
                        <span>{t('profile.update_profile')}</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* UPDATED Password Change Form with i18n */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <Key className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('profile.change_password')}</h2>
              </div>

              <form onSubmit={handlePasswordSubmit(onSubmitPasswordChange)} className="space-y-6">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('user.password.current')} *
                  </label>
                  <div className="relative">
                    <input
                      {...registerPassword('currentPassword')}
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder={t('user.password.placeholder.current')}
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                        passwordErrors.currentPassword ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{passwordErrors.currentPassword.message}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('user.password.new')} *
                  </label>
                  <div className="relative">
                    <input
                      {...registerPassword('newPassword')}
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder={t('user.password.placeholder.new')}
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                        passwordErrors.newPassword ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {passwordErrors.newPassword && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{passwordErrors.newPassword.message}</p>
                  )}

                  {/* Password strength indicator */}
                  {watchedNewPassword && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-400">{t('profile.password_strength')}:</span>
                        <span className={`font-medium text-${passwordStrength.color}-600 dark:text-${passwordStrength.color}-400`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 bg-${passwordStrength.color}-500`}
                          style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('user.password.confirm')} *
                  </label>
                  <div className="relative">
                    <input
                      {...registerPassword('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder={t('user.password.placeholder.confirm')}
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                        passwordErrors.confirmPassword ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Security Tips */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    💡 {t('user.password.security.title')}
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>{t('user.password.security.length')}</li>
                    <li>{t('user.password.security.mix')}</li>
                    <li>{t('user.password.security.personal')}</li>
                    <li>{t('user.password.security.reuse')}</li>
                  </ul>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isPasswordSubmitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isPasswordSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{t('profile.changing_password')}</span>
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4" />
                        <span>{t('profile.change_password')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* UPDATED Security Information with i18n */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('profile.security_info')}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{t('profile.last_activity')}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('profile.active_session')}: {new Date().toLocaleString(t('profile.date_locale'))}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Key className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{t('profile.authentication')}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('profile.jwt_active')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;