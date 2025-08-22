// src/components/pages/UserProfile.tsx - FIXED with Proper TypeScript Types
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

// Types
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

// Password change validation schema
const passwordChangeSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Parola actuală este obligatorie'),
  
  newPassword: yup
    .string()
    .required('Parola nouă este obligatorie')
    .min(8, 'Parola trebuie să aibă cel puțin 8 caractere')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Parola trebuie să conțină cel puțin o literă mică, o literă mare și o cifră'
    )
    .test('different-from-current', 'Parola nouă trebuie să fie diferită de cea actuală', function(value) {
      return value !== this.parent.currentPassword;
    }),
  
  confirmPassword: yup
    .string()
    .required('Confirmarea parolei este obligatorie')
    .oneOf([yup.ref('newPassword')], 'Parolele nu se potrivesc')
});

// Profile update validation schema - FIXED to match TypeScript types
const profileUpdateSchema = yup.object({
  company_name: yup
    .string()
    .required('Numele companiei este obligatoriu pentru clienți')
    .min(2, 'Numele companiei trebuie să aibă cel puțin 2 caractere')
    .max(255, 'Numele companiei poate avea maxim 255 caractere'),
  
  contact_email: yup
    .string()
    .default('')
    .test('email', 'Adresa de email nu este validă', function(value) {
      if (!value || value === '') return true;
      return yup.string().email().isValidSync(value);
    })
    .max(100, 'Email-ul poate avea maxim 100 caractere'),
  
  notes: yup
    .string()
    .default('')
    .max(1000, 'Notele pot avea maxim 1000 caractere')
});

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

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
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

  // Password change form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    watch: watchPassword,
    reset: resetPassword
  } = useForm<PasswordChangeData>({
    resolver: yupResolver(passwordChangeSchema)
  });

  // Profile update form (only for clients) - FIXED types
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
    setValue: setProfileValue
  } = useForm<ProfileUpdateData>({
    resolver: yupResolver(profileUpdateSchema),
    defaultValues: {
      company_name: '',
      contact_email: '',
      notes: ''
    }
  });

  const watchedNewPassword = watchPassword('newPassword');
  const passwordStrength = getPasswordStrength(watchedNewPassword || '');

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
        setError('Nu s-au putut încărca datele profilului');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, logout, navigate, setProfileValue]);

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
          setError('Parola actuală este incorectă');
          return;
        }
        throw new Error('Failed to change password');
      }

      setSuccessMessage('Parola a fost schimbată cu succes!');
      resetPassword();
      
    } catch (err) {
      setError('A apărut o eroare la schimbarea parolei');
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

      setSuccessMessage('Profilul a fost actualizat cu succes!');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'A apărut o eroare la actualizarea profilului');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Se încarcă profilul...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Eroare</h2>
          <p className="text-gray-600 mt-2">Nu s-au putut încărca datele profilului</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Înapoi la Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBack}
                className="text-gray-600 hover:text-blue-600 transition-colors p-2 rounded-md hover:bg-gray-50"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <User className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profilul Meu</h1>
                <p className="text-sm text-gray-600">Gestionează contul și securitatea</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <p className="text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informații Profil</h2>
              
              <div className="space-y-4">
                {/* Avatar */}
                <div className="flex justify-center">
                  <div className={`h-20 w-20 rounded-full flex items-center justify-center text-white text-2xl font-bold ${
                    isAdmin ? 'bg-blue-600' : isAudit ? 'bg-purple-600' : 'bg-green-600'
                  }`}>
                    {profileData.username.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* User Details */}
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">{profileData.username}</h3>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    isAdmin ? 'bg-blue-100 text-blue-800' : 
                    isAudit ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {isAdmin ? 'Administrator' : isAudit ? 'Audit' : 'Client'}
                  </span>
                </div>

                {/* Account Details */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <span>ID: {profileData.id}</span>
                  </div>
                  
                  {isClient && profileData.company_name && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Building2 className="h-4 w-4 mr-2" />
                      <span>Companie: {profileData.company_name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Înregistrat: {new Date(profileData.created_at).toLocaleDateString('ro-RO')}</span>
                  </div>
                </div>

                {/* Role Permissions */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Permisiuni</h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                      <span>Căutare fonduri publice</span>
                    </div>
                    {isAdmin && (
                      <>
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                          <span>Management fonduri</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                          <span>Management utilizatori</span>
                        </div>
                      </>
                    )}
                    {isAudit && (
                      <>
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                          <span>Vizualizare toate fondurile</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                          <span>Export și rapoarte</span>
                        </div>
                      </>
                    )}
                    {isClient && (
                      <>
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                          <span>Management fonduri proprii</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                          <span>Adăugare fonduri noi</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Forms Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Profile Update Form */}
            {isClient && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Building2 className="h-6 w-6 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Actualizează Profilul</h2>
                </div>

                <form onSubmit={handleProfileSubmit(onSubmitProfileUpdate)} className="space-y-6">
                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building2 className="h-4 w-4 inline mr-1" />
                      Numele Companiei *
                    </label>
                    <input
                      {...registerProfile('company_name')}
                      type="text"
                      placeholder="ex: Test Company SRL"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none ${
                        profileErrors.company_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {profileErrors.company_name && (
                      <p className="text-red-600 text-sm mt-1">{profileErrors.company_name.message}</p>
                    )}
                  </div>

                  {/* Contact Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email de Contact
                    </label>
                    <input
                      {...registerProfile('contact_email')}
                      type="email"
                      placeholder="ex: contact@companie.ro"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none ${
                        profileErrors.contact_email ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {profileErrors.contact_email && (
                      <p className="text-red-600 text-sm mt-1">{profileErrors.contact_email.message}</p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note
                    </label>
                    <textarea
                      {...registerProfile('notes')}
                      rows={3}
                      placeholder="Note despre companie..."
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none ${
                        profileErrors.notes ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {profileErrors.notes && (
                      <p className="text-red-600 text-sm mt-1">{profileErrors.notes.message}</p>
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
                          <span>Se actualizează...</span>
                        </>
                      ) : (
                        <>
                          <span>Actualizează Profilul</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Password Change Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Key className="h-6 w-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Schimbă Parola</h2>
              </div>

              <form onSubmit={handlePasswordSubmit(onSubmitPasswordChange)} className="space-y-6">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parola Actuală *
                  </label>
                  <div className="relative">
                    <input
                      {...registerPassword('currentPassword')}
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Introdu parola actuală"
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                        passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-red-600 text-sm mt-1">{passwordErrors.currentPassword.message}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parola Nouă *
                  </label>
                  <div className="relative">
                    <input
                      {...registerPassword('newPassword')}
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Introdu parola nouă"
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                        passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {passwordErrors.newPassword && (
                    <p className="text-red-600 text-sm mt-1">{passwordErrors.newPassword.message}</p>
                  )}

                  {/* Password strength indicator */}
                  {watchedNewPassword && (
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
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmă Parola Nouă *
                  </label>
                  <div className="relative">
                    <input
                      {...registerPassword('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirmă parola nouă"
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                        passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-600 text-sm mt-1">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Security Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    💡 Sfaturi pentru o parolă sigură
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Folosește cel puțin 8 caractere</li>
                    <li>• Combină litere mari și mici, cifre și simboluri</li>
                    <li>• Nu folosi informații personale</li>
                    <li>• Nu reutiliza parole de la alte conturi</li>
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
                        <span>Se schimbă...</span>
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4" />
                        <span>Schimbă Parola</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Security Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Informații Securitate</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <h3 className="font-medium text-gray-900">Ultima Activitate</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Sesiune activă: {new Date().toLocaleString('ro-RO')}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Key className="h-4 w-4 text-gray-600" />
                    <h3 className="font-medium text-gray-900">Autentificare</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Token JWT activ
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
