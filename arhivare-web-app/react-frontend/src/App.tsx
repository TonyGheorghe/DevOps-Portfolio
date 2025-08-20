// src/App.tsx - Updated with Role-Based Dashboard Routing
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, LoginPage, useAuth } from './components/AuthSystem';
import HomePage from './components/HomePage';
import AdminDashboard from './components/AdminDashboard';
import AuditDashboard from './components/AuditDashboard';
import ClientDashboard from './components/ClientDashboard';
import UsersPage from './components/pages/UsersPage';
import UserProfile from './components/pages/UserProfile';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* ROLE-BASED DASHBOARD ROUTES */}
            
            {/* Admin Dashboard */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Audit Dashboard */}
            <Route 
              path="/audit" 
              element={
                <ProtectedRoute requiredRole="audit">
                  <AuditDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/audit/dashboard" 
              element={
                <ProtectedRoute requiredRole="audit">
                  <AuditDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Client Dashboard */}
            <Route 
              path="/client" 
              element={
                <ProtectedRoute requiredRole="client">
                  <ClientDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/client/dashboard" 
              element={
                <ProtectedRoute requiredRole="client">
                  <ClientDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-fonds" 
              element={
                <ProtectedRoute requiredRole="client">
                  <ClientDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* AUTO-REDIRECT based on user role */}
            <Route 
              path="/dashboard-auto" 
              element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              } 
            />
            
            {/* USER MANAGEMENT ROUTES */}
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requiredRole="admin" allowReadOnly={true}>
                  <UsersPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute requiredRole="admin" allowReadOnly={true}>
                  <UsersPage />
                </ProtectedRoute>
              } 
            />
            
            {/* PROFILE ROUTES - Available to all authenticated users */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } // src/App.tsx - Updated with Role-Based Dashboard Routing
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, LoginPage } from './components/AuthSystem';
import HomePage from './components/HomePage';
import AdminDashboard from './components/AdminDashboard';
import AuditDashboard from './components/AuditDashboard';
import ClientDashboard from './components/ClientDashboard';
import UsersPage from './components/pages/UsersPage';
import UserProfile from './components/pages/UserProfile';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* ROLE-BASED DASHBOARD ROUTES */}
            
            {/* Admin Dashboard */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Audit Dashboard */}
            <Route 
              path="/audit" 
              element={
                <ProtectedRoute requiredRole="audit">
                  <AuditDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/audit/dashboard" 
              element={
                <ProtectedRoute requiredRole="audit">
                  <AuditDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Client Dashboard */}
            <Route 
              path="/client" 
              element={
                <ProtectedRoute requiredRole="client">
                  <ClientDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/client/dashboard" 
              element={
                <ProtectedRoute requiredRole="client">
                  <ClientDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-fonds" 
              element={
                <ProtectedRoute requiredRole="client">
                  <ClientDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* AUTO-REDIRECT based on user role */}
            <Route 
              path="/dashboard-auto" 
              element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              } 
            />
            
            {/* USER MANAGEMENT ROUTES */}
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requiredRole="admin" allowReadOnly={true}>
                  <UsersPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute requiredRole="admin" allowReadOnly={true}>
                  <UsersPage />
                </ProtectedRoute>
              } 
            />
            
            {/* PROFILE ROUTES - Available to all authenticated users */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user/profile" 
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } 
            />
            
            {/* SETTINGS AND OTHER PROTECTED ROUTES */}
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <SettingsPlaceholder />
                </ProtectedRoute>
              } 
            />
            
            {/* ADMIN-SPECIFIC ROUTES */}
            <Route 
              path="/admin/fonds" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/audit" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AuditDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/reports" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <ReportsPlaceholder />
                </ProtectedRoute>
              } 
            />
            
            {/* AUDIT-SPECIFIC ROUTES */}
            <Route 
              path="/audit/reports" 
              element={
                <ProtectedRoute requiredRole="audit">
                  <AuditDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* LEGACY REDIRECTS */}
            <Route path="/arhivare" element={<Navigate to="/" replace />} />
            <Route path="/fonduri" element={<Navigate to="/dashboard-auto" replace />} />
            
            {/* 404 - Redirect to appropriate page based on auth status */}
            <Route path="*" element={<NotFoundRedirect />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Helper component for role-based redirect
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Te redirectăm către dashboard-ul tău...</p>
      </div>
    </div>
  );
};

// 404 Handler with smart redirects
const NotFoundRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect to appropriate dashboard
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
      // Redirect unauthenticated users to homepage
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagina nu a fost găsită</h2>
        <p className="text-gray-600 mb-6">
          Pagina pe care o cauți nu există. Te redirectăm către pagina principală.
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
};

// Settings placeholder
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Setări</h2>
        <p className="text-gray-600 mb-4">
          Această funcționalitate va fi implementată în următoarea versiune.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Pentru moment poți accesa profilul tău pentru setări de bază.
        </p>
        
        <div className="space-y-3">
          <button 
            onClick={handleNavigateProfile}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Accesează Profilul
          </button>
          
          <button 
            onClick={handleNavigateDashboard}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Înapoi la Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

// Reports placeholder
const ReportsPlaceholder: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigateAudit = () => {
    navigate('/audit');
  };

  const handleNavigateAdmin = () => {
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Rapoarte Avansate</h2>
        <p className="text-gray-600 mb-4">
          Sistemul de rapoarte avansate va fi implementat în următoarea versiune.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Pentru moment poți accesa funcționalitățile de export din dashboard-ul Audit.
        </p>
        
        <div className="space-y-3">
          <button 
            onClick={handleNavigateAudit}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Accesează Dashboard Audit
          </button>
          
          <button 
            onClick={handleNavigateAdmin}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Înapoi la Dashboard Admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
            />
            
            {/* SETTINGS AND OTHER PROTECTED ROUTES */}
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <SettingsPlaceholder />
                </ProtectedRoute>
              } 
            />
            
            {/* ADMIN-SPECIFIC ROUTES */}
            <Route 
              path="/admin/fonds" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/audit" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AuditDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/reports" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <ReportsPlaceholder />
                </ProtectedRoute>
              } 
            />
            
            {/* AUDIT-SPECIFIC ROUTES */}
            <Route 
              path="/audit/reports" 
              element={
                <ProtectedRoute requiredRole="audit">
                  <AuditDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* LEGACY REDIRECTS */}
            <Route path="/arhivare" element={<Navigate to="/" replace />} />
            <Route path="/fonduri" element={<Navigate to="/dashboard-auto" replace />} />
            
            {/* 404 - Redirect to appropriate page based on auth status */}
            <Route path="*" element={<NotFoundRedirect />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Helper component for role-based redirect
const RoleBasedRedirect: React.FC = () => {
  const { user } = React.useContext(AuthProvider) || {};
  
  React.useEffect(() => {
    if (user?.role === 'admin') {
      window.location.replace('/admin');
    } else if (user?.role === 'audit') {
      window.location.replace('/audit');
    } else if (user?.role === 'client') {
      window.location.replace('/client');
    } else {
      window.location.replace('/');
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Te redirectăm către dashboard-ul tău...</p>
      </div>
    </div>
  );
};

// 404 Handler with smart redirects
const NotFoundRedirect: React.FC = () => {
  const { isAuthenticated, user } = React.useContext(AuthProvider) || {};
  
  React.useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect to appropriate dashboard
      if (user.role === 'admin') {
        window.location.replace('/admin');
      } else if (user.role === 'audit') {
        window.location.replace('/audit');
      } else if (user.role === 'client') {
        window.location.replace('/client');
      } else {
        window.location.replace('/');
      }
    } else {
      // Redirect unauthenticated users to homepage
      window.location.replace('/');
    }
  }, [isAuthenticated, user]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagina nu a fost găsită</h2>
        <p className="text-gray-600 mb-6">
          Pagina pe care o cauți nu există. Te redirectăm către pagina principală.
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
};

// Settings placeholder
const SettingsPlaceholder: React.FC = () => {
  const { user } = React.useContext(AuthProvider) || {};
  
  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'audit') return '/audit';
    if (user?.role === 'client') return '/client';
    return '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Setări</h2>
        <p className="text-gray-600 mb-4">
          Această funcționalitate va fi implementată în următoarea versiune.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Pentru moment poți accesa profilul tău pentru setări de bază.
        </p>
        
        <div className="space-y-3">
          <button 
            onClick={() => window.location.href = '/profile'}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Accesează Profilul
          </button>
          
          <button 
            onClick={() => window.location.href = getDashboardLink()}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Înapoi la Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

// Reports placeholder
const ReportsPlaceholder: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Rapoarte Avansate</h2>
        <p className="text-gray-600 mb-4">
          Sistemul de rapoarte avansate va fi implementat în următoarea versiune.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Pentru moment poți accesa funcționalitățile de export din dashboard-ul Audit.
        </p>
        
        <div className="space-y-3">
          <button 
            onClick={() => window.location.href = '/audit'}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Accesează Dashboard Audit
          </button>
          
          <button 
            onClick={() => window.location.href = '/admin'}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Înapoi la Dashboard Admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
