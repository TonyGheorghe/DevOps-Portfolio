// src/App.tsx - FIXED Dark Mode Integration
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { 
  AuthProvider, 
  ProtectedRoute, 
  LoginPage, 
  useAuth 
} from './components/AuthSystem';

// Page components
import HomePage from './components/HomePage';
import AdminDashboard from './components/AdminDashboard';
import AuditDashboard from './components/AuditDashboard';
import ClientDashboard from './components/ClientDashboard';
import UsersPage from './components/pages/UsersPage';
import UserProfile from './components/pages/UserProfile';

// Critical Systems
import { 
  RouteErrorBoundary, 
  DashboardErrorBoundary, 
  FormErrorBoundary 
} from './components/common/ErrorBoundary';
import { 
  AccessibilityProvider, 
  AccessibilitySettings, 
  SkipLink 
} from './components/common/AccessibilitySystem';
import { 
  NetworkProvider, 
  NetworkStatusIndicator, 
  OfflineNotice, 
  NetworkRequestsMonitor 
} from './components/common/NetworkHandling';

// 🔴 FIXED: Clean Dark Mode Provider
import { 
  DarkModeProvider, 
  ThemeDebugger 
} from './components/common/DarkModeSystem';

// Demo pages (can be removed in production)
import { ErrorBoundaryDemo } from './components/common/ErrorBoundary';
import { AccessibilityDemo } from './components/common/AccessibilitySystem';
import { NetworkHandlingDemo } from './components/common/NetworkHandling';
import LoadingStatesDemo from './components/common/LoadingStates';

import './App.css';

function App() {
  return (
    // 🔴 FIXED: Dark Mode Provider as outermost wrapper
    <DarkModeProvider>
      <NetworkProvider>
        <AccessibilityProvider>
          <AuthProvider>
            <Router>
              <RouteErrorBoundary>
                {/* 🔴 FIXED: Simplified wrapper with proper Tailwind classes */}
                <div className="App min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 theme-transition">
                  {/* Skip link for accessibility */}
                  <SkipLink />
                  
                  {/* Network status indicator */}
                  <NetworkStatusIndicator />
                  
                  {/* Global offline notice */}
                  <OfflineNotice />
                  
                  <Routes>
                    {/* ========== PUBLIC ROUTES ========== */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/search" element={<HomePage />} />
                    <Route path="/home" element={<HomePage />} />
                    
                    {/* ========== AUTH ROUTES ========== */}
                    <Route path="/login" element={<LoginPage />} />
                    
                    {/* ========== ADMIN ROUTES ========== */}
                    <Route 
                      path="/admin" 
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <DashboardErrorBoundary>
                            <AdminDashboard />
                          </DashboardErrorBoundary>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/dashboard" 
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <DashboardErrorBoundary>
                            <AdminDashboard />
                          </DashboardErrorBoundary>
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* ========== AUDIT ROUTES ========== */}
                    <Route 
                      path="/audit" 
                      element={
                        <ProtectedRoute requiredRole="audit">
                          <DashboardErrorBoundary>
                            <AuditDashboard />
                          </DashboardErrorBoundary>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/audit/dashboard" 
                      element={
                        <ProtectedRoute requiredRole="audit">
                          <DashboardErrorBoundary>
                            <AuditDashboard />
                          </DashboardErrorBoundary>
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* ========== CLIENT ROUTES ========== */}
                    <Route 
                      path="/client" 
                      element={
                        <ProtectedRoute requiredRole="client">
                          <DashboardErrorBoundary>
                            <ClientDashboard />
                          </DashboardErrorBoundary>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/client/dashboard" 
                      element={
                        <ProtectedRoute requiredRole="client">
                          <DashboardErrorBoundary>
                            <ClientDashboard />
                          </DashboardErrorBoundary>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/my-fonds" 
                      element={
                        <ProtectedRoute requiredRole="client">
                          <DashboardErrorBoundary>
                            <ClientDashboard />
                          </DashboardErrorBoundary>
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* ========== AUTO-REDIRECT BASED ON ROLE ========== */}
                    <Route 
                      path="/dashboard-auto" 
                      element={
                        <ProtectedRoute>
                          <RoleBasedRedirect />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* ========== USER MANAGEMENT ROUTES ========== */}
                    <Route 
                      path="/admin/users" 
                      element={
                        <ProtectedRoute requiredRole="admin" allowReadOnly={true}>
                          <DashboardErrorBoundary>
                            <UsersPage />
                          </DashboardErrorBoundary>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/users" 
                      element={
                        <ProtectedRoute requiredRole="admin" allowReadOnly={true}>
                          <DashboardErrorBoundary>
                            <UsersPage />
                          </DashboardErrorBoundary>
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* ========== PROFILE ROUTES ========== */}
                    <Route 
                      path="/profile" 
                      element={
                        <ProtectedRoute>
                          <FormErrorBoundary>
                            <UserProfile />
                          </FormErrorBoundary>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/user/profile" 
                      element={
                        <ProtectedRoute>
                          <FormErrorBoundary>
                            <UserProfile />
                          </FormErrorBoundary>
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* ========== SETTINGS AND OTHER PROTECTED ROUTES ========== */}
                    <Route 
                      path="/settings" 
                      element={
                        <ProtectedRoute>
                          <SettingsPlaceholder />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* ========== DEMO ROUTES (Development Only) ========== */}
                    {process.env.NODE_ENV === 'development' && (
                      <>
                        <Route path="/demo/error-boundary" element={<ErrorBoundaryDemo />} />
                        <Route path="/demo/accessibility" element={<AccessibilityDemo />} />
                        <Route path="/demo/network" element={<NetworkHandlingDemo />} />
                        <Route path="/demo/loading" element={<LoadingStatesDemo />} />
                      </>
                    )}
                    
                    {/* ========== LEGACY REDIRECTS ========== */}
                    <Route path="/arhivare" element={<Navigate to="/" replace />} />
                    <Route path="/fonduri" element={<Navigate to="/dashboard-auto" replace />} />
                    
                    {/* ========== 404 - NOT FOUND ========== */}
                    <Route path="*" element={<NotFoundRedirect />} />
                  </Routes>
                  
                  {/* Global accessibility settings panel */}
                  <AccessibilitySettings />
                  
                  {/* 🔴 FIXED: Theme debugger for development */}
                  {process.env.NODE_ENV === 'development' && <ThemeDebugger />}
                  
                  {/* Network requests monitor (development only) */}
                  {process.env.NODE_ENV === 'development' && <NetworkRequestsMonitor />}
                </div>
              </RouteErrorBoundary>
            </Router>
          </AuthProvider>
        </AccessibilityProvider>
      </NetworkProvider>
    </DarkModeProvider>
  );
}

// ========================================
// HELPER COMPONENTS - FIXED with proper Tailwind classes
// ========================================

// 🔴 FIXED: Role-based redirect component
const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (user?.role === 'audit') {
      navigate('/audit', { replace: true });
    } else if (user?.role === 'client') {
      navigate('/client', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-300 mt-4">Te redirectăm către dashboard-ul tău...</p>
      </div>
    </div>
  );
};

// 🔴 FIXED: 404 Handler
const NotFoundRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'audit') {
        navigate('/audit', { replace: true });
      } else if (user.role === 'client') {
        navigate('/client', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } else {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Pagina nu a fost găsită</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Pagina pe care o cauți nu există. Te redirectăm către pagina principală.
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
      </div>
    </div>
  );
};

// 🔴 FIXED: Settings placeholder
const SettingsPlaceholder: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'audit') return '/audit';
    if (user?.role === 'client') return '/client';
    return '/';
  };

  const handleNavigateProfile = () => {
    navigate('/profile');
  };

  const handleNavigateDashboard = () => {
    navigate(getDashboardLink());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Setări</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Această funcționalitate va fi implementată în următoarea versiune.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
          Pentru moment poți accesa profilul tău pentru setări de bază, sau panoul de accesibilitate.
        </p>
        
        <div className="space-y-3">
          <button 
            onClick={handleNavigateProfile}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Accesează Profilul
          </button>
          
          <button 
            onClick={handleNavigateDashboard}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Înapoi la Dashboard
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            💡 <strong>Sfat:</strong> Folosește butonul de accesibilitate din colțul din dreapta jos pentru setări avansate de afișare.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
