// src/components/AdminDashboard.tsx - Updated with User Management Navigation
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Search, Building2, Archive, 
  Phone, Mail, MapPin, X, LogOut, Users, Home, CheckCircle,
  User, Settings, BarChart3
} from 'lucide-react';
import { useAuth } from './AuthSystem';
import FondForm from './forms/FondForm';

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
}

interface FondFormData {
  company_name: string;
  holder_name: string;
  address: string;
  email: string;
  phone: string;
  notes: string;
  source_url: string;
  active: boolean;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [fonds, setFonds] = useState<Fond[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingFond, setEditingFond] = useState<Fond | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Get auth token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Clear messages after a delay
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

  // Handle logout with navigation
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Navigate to homepage
  const goToHomepage = () => {
    navigate('/', { replace: false });
  };

  // Navigate to users management
  const goToUsersManagement = () => {
    navigate('/admin/users', { replace: false });
  };

  // Navigate to profile
  const goToProfile = () => {
    navigate('/profile', { replace: false });
  };

  // Load fonds (wrapped in useCallback to satisfy dependency array)
  const loadFonds = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/fonds/?skip=0&limit=100&active_only=${!showInactive}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        throw new Error(`Error loading fonds: ${response.status}`);
      }

      const data = await response.json();
      setFonds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading fonds');
      console.error('Error loading fonds:', err);
    } finally {
      setLoading(false);
    }
  }, [showInactive, logout, navigate]);

  useEffect(() => {
    loadFonds();
  }, [loadFonds]);

  // CREATE fond function
  const handleCreateFond = async (fondData: FondFormData) => {
    setFormLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/fonds/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(fondData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error creating fond: ${response.status}`);
      }

      const newFond = await response.json();
      
      setShowForm(false);
      setEditingFond(undefined);
      await loadFonds();
      
      setSuccessMessage(`Fondul "${newFond.company_name}" a fost creat cu succes!`);
      
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating fond');
    } finally {
      setFormLoading(false);
    }
  };

  // UPDATE fond function
  const handleUpdateFond = async (fondData: FondFormData) => {
    if (!editingFond) return;
    
    setFormLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/fonds/${editingFond.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(fondData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error updating fond: ${response.status}`);
      }

      const updatedFond = await response.json();
      
      setShowForm(false);
      setEditingFond(undefined);
      await loadFonds();
      
      setSuccessMessage(`Fondul "${updatedFond.company_name}" a fost actualizat cu succes!`);
      
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating fond');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle form save (CREATE or UPDATE)
  const handleFormSave = async (fondData: FondFormData) => {
    if (editingFond) {
      await handleUpdateFond(fondData);
    } else {
      await handleCreateFond(fondData);
    }
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingFond(undefined);
  };

  // Delete operation with proper confirm
  const handleDeleteFond = async (fond: Fond) => {
    if (!window.confirm(`Ești sigur că vrei să ștergi fondul "${fond.company_name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/fonds/${fond.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        throw new Error(`Error deleting fond: ${response.status}`);
      }

      await loadFonds();
      setSuccessMessage(`Fondul "${fond.company_name}" a fost șters cu succes!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting fond');
    }
  };

  // Filter fonds based on search
  const filteredFonds = fonds.filter(fond => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      fond.company_name.toLowerCase().includes(query) ||
      fond.holder_name.toLowerCase().includes(query) ||
      fond.address?.toLowerCase().includes(query) ||
      fond.email?.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: fonds.length,
    active: fonds.filter(f => f.active).length,
    inactive: fonds.filter(f => !f.active).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Se încarcă dashboard-ul...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Archive className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
                <p className="text-sm text-gray-600">Management fonduri arhivistice</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Navigation Menu */}
              <nav className="hidden md:flex items-center space-x-2">
                <button 
                  onClick={goToHomepage}
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-md hover:bg-gray-50"
                >
                  <Home className="h-4 w-4" />
                  <span>Căutare</span>
                </button>
                
                <button 
                  onClick={goToUsersManagement}
                  className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors px-3 py-2 rounded-md hover:bg-purple-50"
                >
                  <Users className="h-4 w-4" />
                  <span>Utilizatori</span>
                </button>

                <button 
                  onClick={goToProfile}
                  className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors px-3 py-2 rounded-md hover:bg-green-50"
                >
                  <User className="h-4 w-4" />
                  <span>Profil</span>
                </button>
              </nav>
              
              {/* User profile section */}
              <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-4 py-2">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
                  title="Deconectare"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Fonds Stats */}
          <div 
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setShowForm(true)}
          >
            <div className="flex items-center">
              <Archive className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Fonduri</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-blue-600 mt-1">Click pentru adăugare</p>
              </div>
            </div>
          </div>

          {/* Active Fonds */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Fonduri Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-xs text-gray-500 mt-1">Vizibile public</p>
              </div>
            </div>
          </div>

          {/* Users Management */}
          <div 
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={goToUsersManagement}
          >
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Utilizatori</p>
                <p className="text-2xl font-bold text-gray-900">
                  <span className="text-lg">Gestionează</span>
                </p>
                <p className="text-xs text-purple-600 mt-1">Click pentru management</p>
              </div>
            </div>
          </div>

          {/* Profile Access */}
          <div 
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={goToProfile}
          >
            <div className="flex items-center">
              <User className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Profilul Meu</p>
                <p className="text-2xl font-bold text-gray-900">
                  <span className="text-lg">Setări</span>
                </p>
                <p className="text-xs text-orange-600 mt-1">Click pentru profil</p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <p className="text-green-800">{successMessage}</p>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-auto text-green-600 hover:text-green-800 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <p className="text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Caută fonduri..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Arată inactive</span>
                </label>

                <button
                  onClick={() => {
                    setEditingFond(undefined);
                    setShowForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adaugă Fond</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Fonds Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Companie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deținător Arhivă
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acțiuni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFonds.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium">Niciun fond găsit</p>
                      <p className="text-sm">
                        {searchQuery ? 'Încearcă să modifici căutarea' : 'Fondurile se încarcă...'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredFonds.map((fond) => (
                    <tr key={fond.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {fond.company_name}
                          </div>
                          {fond.address && (
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {fond.address}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{fond.holder_name}</div>
                        {fond.notes && (
                          <div className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                            {fond.notes}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {fond.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-3 w-3 mr-2" />
                              <a href={`mailto:${fond.email}`} className="hover:text-blue-600">
                                {fond.email}
                              </a>
                            </div>
                          )}
                          {fond.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-2" />
                              <a href={`tel:${fond.phone}`} className="hover:text-blue-600">
                                {fond.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          fond.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {fond.active ? 'Activ' : 'Inactiv'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => {
                            setEditingFond(fond);
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Editează"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFond(fond)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Șterge"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination info */}
        {filteredFonds.length > 0 && (
          <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
            <p>
              Afișând {filteredFonds.length} din {fonds.length} fonduri
            </p>
            <p>
              {searchQuery && `Filtrate după: "${searchQuery}"`}
            </p>
          </div>
        )}
      </main>

      {/* Form Modal - WITH DUPLICATE DETECTION! */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <FondForm
            fond={editingFond}
            existingFonds={fonds}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
            isLoading={formLoading}
          />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
