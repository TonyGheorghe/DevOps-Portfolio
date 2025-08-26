// src/components/ClientDashboard.tsx - COMPLETE DARK MODE VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Search, Building2, Archive, 
  Phone, Mail, MapPin, X, LogOut, CheckCircle,
  User, Save, Home, FileText, BarChart3, Target
} from 'lucide-react';
import { useAuth } from './AuthSystem';
import FondForm from './forms/FondForm';
import { DarkModeToggle, useDarkMode } from './common/DarkModeSystem';

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

interface ClientStats {
  total_fonds: number;
  active_fonds: number;
  inactive_fonds: number;
  completion_rate: number;
  last_updated?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const ClientDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentTheme } = useDarkMode(); // 🔴 Add dark mode hook
  const navigate = useNavigate();
  
  // State management
  const [fonds, setFonds] = useState<Fond[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
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

  // Get auth headers
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

  // Load client's fonds and stats
  const loadMyData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const headers = getAuthHeaders();
      
      // Load my fonds and stats in parallel
      const [fondsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/fonds/my-fonds?skip=0&limit=100&active_only=${!showInactive}`, { headers }),
        fetch(`${API_BASE_URL}/fonds/my-fonds/stats`, { headers })
      ]);

      if (!fondsRes.ok || !statsRes.ok) {
        if (fondsRes.status === 401 || statsRes.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        throw new Error('Failed to load your data');
      }

      const [fondsData, statsData] = await Promise.all([
        fondsRes.json(),
        statsRes.json()
      ]);

      setFonds(fondsData);
      setStats(statsData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading your fonds');
      console.error('Error loading client data:', err);
    } finally {
      setLoading(false);
    }
  }, [showInactive, logout, navigate]);

  useEffect(() => {
    loadMyData();
  }, [loadMyData]);

  // CREATE fond function
  const handleCreateFond = async (fondData: FondFormData) => {
    setFormLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/fonds/my-fonds`, {
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
      await loadMyData();
      
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
      const response = await fetch(`${API_BASE_URL}/fonds/my-fonds/${editingFond.id}`, {
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
      await loadMyData();
      
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

  // Delete operation
  const handleDeleteFond = async (fond: Fond) => {
    if (!window.confirm(`Ești sigur că vrei să ștergi fondul "${fond.company_name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/fonds/my-fonds/${fond.id}`, {
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

      await loadMyData();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-green-400 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-4">Se încarcă fondurile tale...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fondurile Mele</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Management fonduri assignate</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Navigation Menu */}
              <nav className="hidden md:flex items-center space-x-2">
                <button 
                  onClick={goToHomepage}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Home className="h-4 w-4" />
                  <span>Căutare</span>
                </button>
              </nav>
              
              {/* 🔴 Dark Mode Toggle */}
              <DarkModeToggle size="sm" showLabel={false} />
              
              {/* User profile section */}
              <div className="flex items-center space-x-3 bg-green-50 dark:bg-green-900/20 rounded-lg px-4 py-2">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-green-600 dark:bg-green-500 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.username}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 capitalize">Client</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
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
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
              <p className="text-green-800 dark:text-green-200">{successMessage}</p>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-auto text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div 
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md dark:hover:shadow-xl transition-shadow cursor-pointer border dark:border-gray-700"
              onClick={() => setShowForm(true)}
            >
              <div className="flex items-center">
                <Plus className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fonduri Totale</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_fonds}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">Click pentru adăugare</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md dark:hover:shadow-xl transition-shadow border dark:border-gray-700">
              <div className="flex items-center">
                <Archive className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fonduri Inactive</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.inactive_fonds}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Nu sunt vizibile public</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md dark:hover:shadow-xl transition-shadow border dark:border-gray-700">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completare Date</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.completion_rate}%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Rate de completare</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 border dark:border-gray-700">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Caută în fondurile tale..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500 bg-white dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Arată inactive</span>
                </label>

                <button
                  onClick={() => {
                    setEditingFond(undefined);
                    setShowForm(true);
                  }}
                  className="bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 flex items-center space-x-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adaugă Fond</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Client Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6 border dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
            Informații Client
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Nume utilizator</p>
              <p className="text-lg text-gray-900 dark:text-gray-100">{user?.username}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rol</p>
              <p className="text-lg text-gray-900 dark:text-gray-100">{user?.role}</p>
            </div>
          </div>
          {stats?.last_updated && (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Ultima actualizare: {new Date(stats.last_updated).toLocaleString('ro-RO')}
            </div>
          )}
        </div>

        {/* Fonds Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
              Fondurile Tale ({filteredFonds.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Companie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Deținător Arhivă
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acțiuni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredFonds.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-lg font-medium">
                        {fonds.length === 0 ? 'Nu ai încă fonduri assignate' : 'Niciun fond găsit'}
                      </p>
                      <p className="text-sm mb-4">
                        {fonds.length === 0 
                          ? 'Contactează administratorul pentru a-ți fi assignate fonduri sau adaugă unul nou.'
                          : searchQuery ? 'Încearcă să modifici căutarea' : 'Fondurile se încarcă...'
                        }
                      </p>
                      {fonds.length === 0 && (
                        <button
                          onClick={() => setShowForm(true)}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Adaugă primul fond</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredFonds.map((fond) => (
                    <tr key={fond.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {fond.company_name}
                          </div>
                          {fond.address && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {fond.address}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{fond.holder_name}</div>
                        {fond.notes && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs">
                            {fond.notes}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {fond.email && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Mail className="h-3 w-3 mr-2" />
                              <a href={`mailto:${fond.email}`} className="hover:text-green-600 dark:hover:text-green-400">
                                {fond.email}
                              </a>
                            </div>
                          )}
                          {fond.phone && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Phone className="h-3 w-3 mr-2" />
                              <a href={`tel:${fond.phone}`} className="hover:text-green-600 dark:hover:text-green-400">
                                {fond.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            fond.active 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}>
                            {fond.active ? 'Activ' : 'Inactiv'}
                          </span>
                          
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            ID: {fond.id}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => {
                            setEditingFond(fond);
                            setShowForm(true);
                          }}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                          title="Editează"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFond(fond)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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

        {/* Summary and Help */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Acțiuni Disponibile</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
                <span className="text-gray-900 dark:text-gray-100">Vizualizare și editare fonduri proprii</span>
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
                <span className="text-gray-900 dark:text-gray-100">Adăugare fonduri noi</span>
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
                <span className="text-gray-900 dark:text-gray-100">Ștergere fonduri (proprii)</span>
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
                <span className="text-gray-900 dark:text-gray-100">Căutare în fondurile publice</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Sfaturi pentru Completare</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• <strong className="text-gray-900 dark:text-gray-100">Numele companiei:</strong> Folosește denumirea oficială</p>
              <p>• <strong className="text-gray-900 dark:text-gray-100">Deținător arhivă:</strong> Instituția care păstrează documentele</p>
              <p>• <strong className="text-gray-900 dark:text-gray-100">Contact:</strong> Adaugă email și telefon pentru ușurință în comunicare</p>
              <p>• <strong className="text-gray-900 dark:text-gray-100">Adresa:</strong> Adresa completă ajută la localizare</p>
              <p>• <strong className="text-gray-900 dark:text-gray-100">Note:</strong> Informații suplimentare despre fond</p>
            </div>
          </div>
        </div>

        {/* Pagination info */}
        {filteredFonds.length > 0 && (
          <div className="mt-4 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              Afișând {filteredFonds.length} din {fonds.length} fonduri
            </p>
            <p>
              {searchQuery && `Filtrate după: "${searchQuery}"`}
            </p>
          </div>
        )}
      </main>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
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

export default ClientDashboard;
