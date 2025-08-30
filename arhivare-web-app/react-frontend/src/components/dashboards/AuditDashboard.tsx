// src/components/AuditDashboard.tsx - COMPLETE i18n VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, Download, Search, Building2, Archive, 
  Users, Shield, Home, LogOut, CheckCircle, X, 
  AlertCircle, FileText, Calendar, TrendingUp,
  Eye, Filter, RefreshCw
} from 'lucide-react';
import { useAuth } from './AuthSystem';
import { DarkModeToggle, useDarkMode } from './common/DarkModeSystem';
import { LanguageToggle, useLanguage } from './common/LanguageSystem';

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
  const { currentTheme } = useDarkMode();
  const { t } = useLanguage(); // 🌍 ADD TRANSLATION HOOK
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
        throw new Error(t('audit.error.failed_to_load_data'));
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
      setError(err instanceof Error ? err.message : t('audit.error.loading_data'));
      console.error('Error loading audit data:', err);
    } finally {
      setLoading(false);
    }
  }, [showInactive, selectedPeriod, logout, navigate, t]);

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

      if (!response.ok) throw new Error(t('audit.error.export_failed'));

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
      setError(t('audit.error.failed_to_export_data'));
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-4">{t('audit.loading.dashboard')}</p>
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
              <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('nav.audit.dashboard')}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('nav.audit.dashboard.description')}</p>
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
                  <span>{t('nav.search')}</span>
                </button>
                
                <button 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors px-3 py-2 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{t('audit.actions.refresh')}</span>
                </button>

                <button 
                  onClick={handleExport}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors px-3 py-2 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <Download className="h-4 w-4" />
                  <span>{t('audit.actions.export')}</span>
                </button>
              </nav>
              
              {/* 🌍 Language & Dark Mode Toggles */}
              <LanguageToggle size="sm" />
              <DarkModeToggle size="sm" showLabel={false} />
              
              {/* User profile section */}
              <div className="flex items-center space-x-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg px-4 py-2">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-purple-600 dark:bg-purple-500 rounded-full flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.username}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 capitalize">{t('audit.role_display')}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                  title={t('auth.logout')}
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
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Statistics Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
              <div className="flex items-center">
                <Archive className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('audit.stats.total_fonds')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_fonds}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{stats.active_fonds} {t('common.active').toLowerCase()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('audit.stats.assigned_fonds')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.assigned_fonds}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{stats.assignment_rate}% {t('audit.stats.of_total')}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('audit.stats.unassigned_fonds')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.unassigned_fonds}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{t('audit.stats.available_for_assignment')}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('audit.stats.active_clients')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.clients_with_fonds}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{t('audit.stats.with_assigned_fonds')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Assignments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                  {t('audit.recent_assignments.title')}
                </h2>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value={1}>{t('audit.period.last_day')}</option>
                  <option value={7}>{t('audit.period.last_week')}</option>
                  <option value={30}>{t('audit.period.last_month')}</option>
                </select>
              </div>
            </div>
            <div className="p-6">
              {recentAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">{t('audit.recent_assignments.none')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentAssignments.slice(0, 5).map((assignment) => (
                    <div key={assignment.fond_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{assignment.company_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">→ {assignment.owner_username}</p>
                        {assignment.owner_company && (
                          <p className="text-xs text-gray-500 dark:text-gray-500">{assignment.owner_company}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(assignment.assigned_at).toLocaleDateString('ro-RO')}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          assignment.active 
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}>
                          {assignment.active ? t('common.active') : t('common.inactive')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Client Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <Users className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                {t('audit.client_distribution.title')}
              </h2>
            </div>
            <div className="p-6">
              {stats?.client_distribution && stats.client_distribution.length > 0 ? (
                <div className="space-y-3">
                  {stats.client_distribution.slice(0, 8).map((client, index) => (
                    <div key={client.username} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{client.username}</p>
                        {client.company_name && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{client.company_name}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                          {client.fond_count} {client.fond_count === 1 ? t('audit.client_distribution.fond') : t('audit.client_distribution.fonds')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">{t('audit.client_distribution.none')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fonds Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 border dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                {t('audit.table.all_fonds')} ({filteredFonds.length})
              </h2>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1 max-w-lg">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('audit.search.placeholder')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 bg-white dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('audit.filters.show_inactive')}</span>
                </label>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('audit.table.company')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('audit.table.archive_holder')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('audit.table.status_owner')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('audit.table.contact')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('audit.table.last_update')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('audit.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredFonds.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-lg font-medium">{t('audit.table.no_fonds_found')}</p>
                      <p className="text-sm">
                        {searchQuery ? t('audit.table.try_modify_search') : t('audit.table.loading_fonds')}
                      </p>
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
                          <div className="text-sm text-gray-500 dark:text-gray-400">ID: {fond.id}</div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{fond.holder_name}</div>
                        {fond.address && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {fond.address}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            fond.active 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}>
                            {fond.active ? t('common.active') : t('common.inactive')}
                          </span>
                          
                          {fond.owner_id ? (
                            <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                              {t('audit.table.assigned')} (ID: {fond.owner_id})
                            </div>
                          ) : (
                            <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                              {t('audit.table.unassigned')}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {fond.email && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                              📧 {fond.email}
                            </div>
                          )}
                          {fond.phone && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              📞 {fond.phone}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(fond.updated_at).toLocaleDateString('ro-RO')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(fond.updated_at).toLocaleTimeString('ro-RO')}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                            title={t('audit.table.view_read_only')}
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{t('audit.summary.audit_access')}</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
                <span className="text-gray-900 dark:text-gray-100">{t('audit.summary.view_all_fonds')}</span>
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
                <span className="text-gray-900 dark:text-gray-100">{t('audit.summary.export_data_stats')}</span>
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
                <span className="text-gray-900 dark:text-gray-100">{t('audit.summary.reports_analytics')}</span>
              </div>
              <div className="flex items-center text-sm">
                <X className="h-4 w-4 text-red-500 dark:text-red-400 mr-2" />
                <span className="text-gray-900 dark:text-gray-100">{t('audit.summary.no_modifications')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{t('audit.summary.quick_actions')}</h3>
            <div className="space-y-3">
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>{t('audit.actions.export_data')}</span>
              </button>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{t('audit.actions.refresh_data')}</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{t('audit.summary.system_info')}</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div>{t('audit.summary.role')}: <span className="font-medium text-purple-600 dark:text-purple-400">{t('audit.role_name')}</span></div>
              <div>{t('audit.summary.user')}: <span className="font-medium text-gray-900 dark:text-gray-100">{user?.username}</span></div>
              <div>{t('audit.summary.visible_fonds')}: <span className="font-medium text-gray-900 dark:text-gray-100">{filteredFonds.length}</span></div>
              <div>{t('audit.summary.last_update')}: <span className="font-medium text-gray-900 dark:text-gray-100">{new Date().toLocaleTimeString('ro-RO')}</span></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuditDashboard;
