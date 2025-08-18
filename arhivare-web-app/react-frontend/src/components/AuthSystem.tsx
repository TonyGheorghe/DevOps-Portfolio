import React, { useState, useContext, createContext, useEffect, ReactNode } from 'react';
import { Lock, Eye, EyeOff, User, LogOut, Shield } from 'lucide-react';

// ===== TYPES & INTERFACES =====
interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ===== AUTH CONTEXT =====
const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook pentru folosirea contextului de auth
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
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // Check for existing auth on mount
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
        // Clear invalid stored data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingAuth();
  }, []);

  // Login function
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

      // Store auth data
      setToken(data.access_token);
      setUser(data.user);
      
      // Persist to localStorage
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Logout function
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

// ===== LOGIN PAGE COMPONENT =====
export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // In a real app, you'd use React Router here
      console.log('User already authenticated, should redirect to dashboard');
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Username și parola sunt obligatorii');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await login(username.trim(), password);
      
      if (!success) {
        setError('Username sau parolă greșite');
      } else {
        // Success - user will be redirected by useEffect
        console.log('Login successful');
      }
    } catch (err) {
      setError('A apărut o eroare la conectare');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Conectat cu succes!</h2>
          <p className="text-gray-600 mt-2">Vei fi redirecționat către dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Lock className="h-12 w-12 text-blue-600 mx-auto" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Conectare Admin
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Introdu datele de conectare pentru accesul la dashboard
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white shadow-lg rounded-lg px-8 py-8">
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Introdu username-ul"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Parolă
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Introdu parola"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading || !username.trim() || !password.trim()}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Se conectează...
                </div>
              ) : (
                'Conectare'
              )}
            </button>

            {/* Demo Credentials Info */}
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-xs text-gray-600 text-center">
                <strong>Demo:</strong> username: admin, parolă: admin123
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2025 Arhivare Web App - Tony Gheorghe
          </p>
        </div>
      </div>
    </div>
  );
};

// ===== USER PROFILE COMPONENT =====
export const UserProfile: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center space-x-3 bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.username}
          </p>
          <p className="text-xs text-gray-500 capitalize">
            {user.role}
          </p>
        </div>

        <button
          onClick={logout}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors"
          title="Deconectare"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

// ===== PROTECTED ROUTE COMPONENT =====
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = 'admin' 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Se verifică autentificarea...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Acces interzis</h2>
          <p className="text-gray-600 mt-2">
            Nu ai permisiunile necesare pentru a accesa această secțiune.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Rol necesar: {requiredRole}, rolul tău: {user?.role}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// ===== DEMO APP COMPONENT =====
const AuthDemo: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with user profile */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard Admin
            </h1>
            <UserProfile />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Bun venit, {user?.username}!
          </h2>
          <p className="text-gray-600">
            Ești conectat cu rolul de <span className="font-medium">{user?.role}</span>.
          </p>
          <p className="text-gray-600 mt-2">
            Aici va fi dashboard-ul pentru managementul fondurilor arhivistice.
          </p>
        </div>
      </main>
    </div>
  );
};

// ===== MAIN APP COMPONENT =====
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthDemo />
    </AuthProvider>
  );
};

export default App;
