// src/components/AuthSystem.tsx - UPDATED with Complete i18n Support
import React, { useState, useContext, createContext, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, User, LogOut, Shield, ArrowLeft, Home } from 'lucide-react';
import { useLanguage } from './common/LanguageSystem'; // Import language system

// ===== TYPES & INTERFACES =====
interface UserData {
  id: number;
  username: string;
  role: string;
  // Extended fields for client information
  company_name?: string;
  contact_email?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserData;
}

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  allowReadOnly?: boolean;
}

// ===== AUTH CONTEXT =====
const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ===== AUTH PROVIDER =====
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const checkExistingAuth = () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading stored auth:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data: LoginResponse = await response.json();

      setToken(data.access_token);
      setUser(data.user);
      
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ===== LOGIN PAGE COMPONENT - UPDATED with i18n =====
export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const { t } = useLanguage(); // Add translation hook
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      console.log('User is authenticated, redirecting to:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError(t('auth.error.required'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await login(username.trim(), password);
      
      if (success) {
        console.log('Login successful, redirecting to:', from);
        navigate(from, { replace: true });
      } else {
        setError(t('auth.error.invalid'));
      }
    } catch (err) {
      setError(t('auth.error.connection'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // Handle back to homepage
  const handleBackToHome = () => {
    navigate('/', { replace: true });
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('auth.success.connected')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{t('auth.success.redirecting')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Back to Home Button */}
        <div className="flex justify-start">
          <button
            onClick={handleBackToHome}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-2 rounded-md hover:bg-white/50 dark:hover:bg-gray-700/50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">{t('auth.back.search')}</span>
          </button>
        </div>

        <div className="text-center">
          <Lock className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('auth.title')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('auth.subtitle')}
          </p>
          {from !== '/' && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              {t('auth.redirect.info')} {from}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg px-8 py-8 border dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.username')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('auth.username.placeholder')}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  disabled={isLoading}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('auth.password.placeholder')}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !username.trim() || !password.trim()}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {t('auth.login.loading')}
                </div>
              ) : (
                t('auth.login.button')
              )}
            </button>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center mb-2">
                <strong>{t('auth.demo.accounts')}</strong>
              </p>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Admin:</span>
                  <span>{t('auth.demo.admin')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Client:</span>
                  <span>{t('auth.demo.client')}</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {t('footer.copyright')}
          </p>
          <button
            onClick={handleBackToHome}
            className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            <Home className="h-3 w-3" />
            <span>{t('auth.back.search')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== USER PROFILE COMPONENT - UPDATED with i18n =====
export const UserProfile: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useLanguage(); // Add translation hook
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-600">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {user.username}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {user.role}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex-shrink-0 p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title={t('auth.logout')}
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

// ===== PROTECTED ROUTE COMPONENT - UPDATED with i18n =====
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  allowReadOnly = false
}) => {
  const { isAuthenticated, user, isLoading, logout } = useAuth();
  const { t } = useLanguage(); // Add translation hook
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { 
        state: { from: location },
        replace: true 
      });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleGoHome = () => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-4">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    if (allowReadOnly && isAuthenticated) {
      return <>{children}</>;
    }
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Shield className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('error.forbidden')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('error.unauthorized')}
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>{t('users.table.role')}:</strong> {user?.role || t('admin.unknown_user')}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>{t('common.required')}:</strong> {requiredRole}
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleGoHome}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {user?.role === 'admin' ? t('nav.admin.dashboard') : t('search.button')}
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>{t('auth.logout')}</span>
            </button>
          </div>
          
          {user?.role === 'user' && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>{t('profile.security.tips')}:</strong> {t('users.readonly.description')}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
