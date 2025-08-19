// src/App.tsx - Updated with User Management Integration
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, LoginPage } from './components/AuthSystem';
import HomePage from './components/HomePage';
import AdminDashboard from './components/AdminDashboard';
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
            
            {/* Protected Admin Routes */}
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
            
            {/* Protected User Management Routes - WITH READ-ONLY ACCESS */}
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requiredRole="admin" allowReadOnly={true}>
                  <UsersPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Fonds Management Routes */}
            <Route 
              path="/admin/fonds" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Profile Routes - Available to all authenticated users */}
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
            
            {/* Settings and other protected routes */}
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Setări</h2>
                      <p className="text-gray-600 mb-4">Această funcționalitate va fi implementată în următoarea versiune.</p>
                      <button 
                        onClick={() => window.history.back()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Înapoi
                      </button>
                    </div>
                  </div>
                </ProtectedRoute>
              } 
            />
            
            {/* Legacy redirects */}
            <Route path="/arhivare" element={<Navigate to="/" replace />} />
            <Route path="/fonduri" element={<Navigate to="/" replace />} />
            <Route path="/users" element={<Navigate to="/admin/users" replace />} />
            
            {/* 404 - Redirect unknown routes to homepage */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
