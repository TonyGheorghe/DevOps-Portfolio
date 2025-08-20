// src/components/AuditDashboard.tsx - Read-Only Dashboard for Audit Users
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, Download, Search, Building2, Archive, 
  Users, Shield, Home, LogOut, CheckCircle, X, 
  AlertCircle, FileText, Calendar, TrendingUp,
  Eye, Filter, RefreshCw
} from 'lucide-react';
import { useAuth } from './AuthSystem';

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
  owner_id?: number;
}

interface OwnershipStats {
  total_fonds: number;
  active_fonds: number;
  assigned_fonds: number;
  unassigned_fonds: number;
  assignment_rate: number;
  clients_with_fonds: number;
  client_distribution: Array<{
    username: string;
    company_name: string;
    fond_count: number;
  }>;
}

interface RecentAssignment {
  fond_id: number;
  company_name: string;
  owner_username: string;
  owner_company: string;
  assigned_at: string;
  active: boolean;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const AuditDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [fonds, setFonds] = useState<Fond[]>([]);
  const [stats, setStats] = useState<OwnershipStats | null>(null);
  const [recentAssignments, setRecentAssignments] = useState<RecentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(7); // days
  
  // UI state
  const [refreshing, setRefreshing] = useState(false);

  // Get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Clear error after delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Navigate to homepage
  const goToHomepage = () => {
    navigate('/', { replace: false });
  };

  // Load all data
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const headers = getAuthHeaders();
      
      // Load fonds, stats, and recent assignments in parallel
      const [fondsRes, statsRes, assignmentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/fonds/?skip=0&limit=100&active_only=${!showInactive}`, { headers }),
        fetch(`${API_BASE_URL}/admin/fonds/statistics`, { headers }),
        fetch(`${API_BASE_URL}/admin/fonds/audit/recent-assignments?days=${selectedPeriod}`, { headers })
      ]);

      if (!fondsRes.ok || !statsRes.ok) {
        if (fondsRes.status === 401 || statsRes.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        throw new Error('Failed to load data');
      }

      const [fondsData, statsData, assignmentsData] = await Promise.all([
        fondsRes.json(),
        statsRes.json(),
        assignmentsRes.ok ? assignmentsRes.json() : { assignments: [] }
      ]);

      setFonds(fondsData);
      setStats(statsData);
      setRecentAssignments(assignmentsData.assignments || []);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
      console.error('Error loading audit data:', err);
    } finally {
      setLoading(false);
    }
  }, [showInactive, selectedPeriod, logout, navigate]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  // Export data
  const handleExport = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/fonds/export/ownership-report?format=json&include_inactive=${showInactive}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) throw new Error('Export failed');

      const data = await response.json();
      
      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fonduri-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      setError('Failed to export data');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Se încarcă dashboard-ul audit...</p>
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
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Audit</h1>
                <p className="text-sm text-gray-600">Vizualizare și analiză date (read-only)</p>
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
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors px-3 py-2 rounded-md hover:bg-purple-50 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

                <button 
                  onClick={handleExport}
                  className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors px-3 py-2 rounded-md hover:bg-green-50"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </nav>
              
              {/* User profile section */}
              <div className="flex items-center space-x-3 bg-purple-50 rounded-lg px-4 py-2">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                  <p className="text-xs text-purple-600 capitalize">Audit (Read-Only)</p>
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
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <p className="text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Statistics Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Archive className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Fonduri</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_fonds}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.active_fonds} active</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Fonduri Assignate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.assigned_fonds}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.assignment_rate}% din total</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Fonduri Neasignate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.unassigned_fonds}</p>
                  <p className="text-xs text-gray-500 mt-1">Disponibile pentru assignment</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Clienți Activi</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.clients_with_fonds}</p>
                  <p className="text-xs text-gray-500 mt-1">Cu fonduri assignate</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Assignments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                  Assignment-uri Recente
                </h2>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1"
                >
                  <option value={1}>Ultima zi</option>
                  <option value={7}>Ultima săptămână</option>
                  <option value={30}>Ultima lună</option>
                </select>
              </div>
            </div>
            <div className="p-6">
              {recentAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nu există assignment-uri recente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentAssignments.slice(0, 5).map((assignment) => (
                    <div key={assignment.fond_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{assignment.company_name}</p>
                        <p className="text-sm text-gray-600">→ {assignment.owner_username}</p>
                        {assignment.owner_company && (
                          <p className="text-xs text-gray-500">{assignment.owner_company}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(assignment.assigned_at).toLocaleDateString('ro-RO')}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          assignment.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {assignment.active ? 'Activ' : 'Inactiv'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Client Distribution */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2 text-green-600" />
                Distribuția pe Clienți
              </h2>
            </div>
            <div className="p-6">
              {stats?.client_distribution && stats.client_distribution.length > 0 ? (
                <div className="space-y-3">
                  {stats.client_distribution.slice(0, 8).map((client, index) => (
                    <div key={client.username} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{client.username}</p>
                        {client.company_name && (
                          <p className="text-sm text-gray-600">{client.company_name}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {client.fond_count} fonduri
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nu există clienți cu fonduri assignate</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fonds Data Table */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Toate Fondurile ({filteredFonds.length})
              </h2>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1 max-w-lg">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Caută fonduri..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Arată inactive</span>
                </label>
              </div>
            </div>
          </div>

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
                    Status / Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ultima Actualizare
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acțiuni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFonds.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
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
                          <div className="text-sm text-gray-500">ID: {fond.id}</div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{fond.holder_name}</div>
                        {fond.address && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {fond.address}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            fond.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {fond.active ? 'Activ' : 'Inactiv'}
                          </span>
                          
                          {fond.owner_id ? (
                            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              Assignat (ID: {fond.owner_id})
                            </div>
                          ) : (
                            <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                              Neasignat
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {fond.email && (
                            <div className="text-sm text-gray-600 truncate max-w-xs">
                              📧 {fond.email}
                            </div>
                          )}
                          {fond.phone && (
                            <div className="text-sm text-gray-600">
                              📞 {fond.phone}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {new Date(fond.updated_at).toLocaleDateString('ro-RO')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(fond.updated_at).toLocaleTimeString('ro-RO')}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                            title="Vizualizează (Read-Only)"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Acces Audit</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span>Vizualizare toate fondurile</span>
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span>Export date și statistici</span>
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span>Rapoarte și analize</span>
              </div>
              <div className="flex items-center text-sm">
                <X className="h-4 w-4 text-red-500 mr-2" />
                <span>Fără modificări (Read-Only)</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Acțiuni Rapide</h3>
            <div className="space-y-3">
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export Date</span>
              </button>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Date</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informații Sistem</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>Rol: <span className="font-medium text-purple-600">Audit</span></div>
              <div>Utilizator: <span className="font-medium">{user?.username}</span></div>
              <div>Fonduri vizibile: <span className="font-medium">{filteredFonds.length}</span></div>
              <div>Ultima actualizare: <span className="font-medium">{new Date().toLocaleTimeString('ro-RO')}</span></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuditDashboard;
