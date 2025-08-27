// src/components/AdminDashboard.tsx - COMPLETE i18n VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Search, Building2, Archive, 
  Phone, Mail, MapPin, X, LogOut, Users, Home, CheckCircle,
  User, Settings, BarChart3, Shield, Eye, AlertTriangle,
  RefreshCw, Zap, Target, UserCheck
} from 'lucide-react';
import { useAuth } from './AuthSystem';
import FondForm from './forms/FondForm';
import ReassignmentModal from './ReassignmentModal';
import { DarkModeToggle, useDarkMode } from './common/DarkModeSystem';
import { LanguageToggle, useLanguage } from './common/LanguageSystem';

// Types (same as before)
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
  owner?: {
    id: number;
    username: string;
    company_name?: string;
  };
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
  owner_id?: number;
}

interface UserOption {
  id: number;
  username: string;
  role: string;
  company_name?: string;
}

interface ReassignmentSuggestion {
  user_id: number;
  username: string;
  company_name: string;
  similarity: number;
  match_type: string;
  confidence: string;
}

interface ReassignmentData {
  fond_id: number;
  fond_name: string;
  old_holder_name: string;
  new_holder_name: string;
  current_owner?: {
    id: number;
    username: string;
    company_name: string;
  };
  suggestions: ReassignmentSuggestion[];
  best_match: ReassignmentSuggestion;
  requires_confirmation: boolean;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentTheme } = useDarkMode();
  const { t } = useLanguage(); // 🌍 ADD TRANSLATION HOOK
  const navigate = useNavigate();
  
  // All existing state variables...
  const [fonds, setFonds] = useState<Fond[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFond, setEditingFond] = useState<Fond | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [showReassignmentModal, setShowReassignmentModal] = useState(false);
  const [reassignmentData, setReassignmentData] = useState<ReassignmentData | null>(null);
  const [reassignmentLoading, setReassignmentLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [autoReassignEnabled, setAutoReassignEnabled] = useState(false);

  // Role-based access control
  const isAdmin = user?.role === 'admin';
  const isAudit = user?.role === 'audit';
  const isClient = user?.role === 'client';
  const canEdit = isAdmin;
  const canView = isAdmin || isAudit;

  // All existing functions remain the same...
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
    if (isAdmin || isAudit) {
      navigate('/admin/users', { replace: false });
    }
  };

  // Navigate to profile
  const goToProfile = () => {
    navigate('/profile', { replace: false });
  };

  // Load available users for assignment
  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/?skip=0&limit=100`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const usersData = await response.json();
        const clientUsers = usersData.filter((u: UserOption) => u.role === 'client');
        setAvailableUsers(clientUsers);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }, [isAdmin]);

  // Enhanced load fonds with owner information
  const loadFonds = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/fonds/?skip=0&limit=100&active_only=${!showInactive}&include_owner=true`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        throw new Error(`${t('admin.error.loading_fonds')}: ${response.status}`);
      }

      const data = await response.json();
      setFonds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.error.loading_fonds_generic'));
      console.error('Error loading fonds:', err);
    } finally {
      setLoading(false);
    }
  }, [showInactive, logout, navigate, t]);

  useEffect(() => {
    loadFonds();
    loadUsers();
  }, [loadFonds, loadUsers]);

  // All existing CRUD functions remain the same but with translated messages...
  const handleCreateFond = async (fondData: FondFormData) => {
    if (!canEdit) {
      setError(t('admin.error.no_create_permission'));
      return;
    }

    setFormLoading(true);
    setError(null);
    
    try {
      const requestData = {
        ...fondData,
        owner_id: fondData.owner_id || null
      };

      const response = await fetch(`${API_BASE_URL}/fonds/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || `${t('admin.error.creating_fond')}: ${response.status}`);
      }

      const newFond = await response.json();
      
      setShowForm(false);
      setEditingFond(undefined);
      await loadFonds();
      
      let message = `${t('admin.success.fond_created')} "${newFond.company_name}"!`;
      if (newFond.owner_id) {
        const owner = availableUsers.find(u => u.id === newFond.owner_id);
        if (owner) {
          message += ` ${t('admin.success.assigned_to')} ${owner.username}.`;
        }
      }
      
      setSuccessMessage(message);
      
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : t('admin.error.creating_fond_generic'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateFond = async (fondData: FondFormData) => {
    if (!canEdit) {
      setError(t('admin.error.no_edit_permission'));
      return;
    }

    if (!editingFond) return;
    
    setFormLoading(true);
    setError(null);
    
    try {
      const requestData = {
        ...fondData,
        owner_id: fondData.owner_id || null
      };

      const url = new URL(`${API_BASE_URL}/fonds/${editingFond.id}`);
      url.searchParams.append('auto_reassign', autoReassignEnabled.toString());

      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || `${t('admin.error.updating_fond')}: ${response.status}`);
      }

      const responseData = await response.json();
      
      if (responseData.reassignment_suggestions) {
        console.log('🔄 Reassignment suggestions detected:', responseData.reassignment_suggestions);
        
        setReassignmentData(responseData.reassignment_suggestions);
        setShowReassignmentModal(true);
        setFormLoading(false);
        return;
      }
      
      setShowForm(false);
      setEditingFond(undefined);
      await loadFonds();
      
      let message = `${t('admin.success.fond_updated')} "${responseData.fond.company_name}"!`;
      if (responseData.auto_reassignment_applied) {
        message += ` (${t('admin.success.auto_reassignment_applied')})`;
      } else if (fondData.owner_id !== editingFond.owner_id) {
        if (fondData.owner_id) {
          const newOwner = availableUsers.find(u => u.id === fondData.owner_id);
          if (newOwner) {
            message += ` ${t('admin.success.assigned_to')} ${newOwner.username}.`;
          }
        } else {
          message += ` ${t('admin.success.assignment_removed')}.`;
        }
      }
      
      setSuccessMessage(message);
      
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : t('admin.error.updating_fond_generic'));
    } finally {
      if (!reassignmentData) {
        setFormLoading(false);
      }
    }
  };

  const handleDeleteFond = async (fond: Fond) => {
    if (!canEdit) {
      setError(t('admin.error.no_delete_permission'));
      return;
    }

    if (!window.confirm(`${t('admin.confirm.delete_fond')} "${fond.company_name}"?`)) {
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
        throw new Error(`${t('admin.error.deleting_fond')}: ${response.status}`);
      }

      await loadFonds();
      setSuccessMessage(`${t('admin.success.fond_deleted')} "${fond.company_name}"!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.error.deleting_fond_generic'));
    }
  };

  // Other functions...
  const handleReassignmentConfirm = async (fondId: number, newOwnerId: number | null) => {
    setReassignmentLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/fonds/${fondId}/confirm-reassignment`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          fond_id: fondId,
          new_owner_id: newOwnerId,
          confirmed: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || t('admin.error.confirming_reassignment'));
      }

      const result = await response.json();
      
      setShowReassignmentModal(false);
      setReassignmentData(null);
      setShowForm(false);
      setEditingFond(undefined);
      
      await loadFonds();
      
      setSuccessMessage(result.message);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.error.confirming_reassignment_generic'));
    } finally {
      setReassignmentLoading(false);
      setFormLoading(false);
    }
  };

  const handleReassignmentCancel = () => {
    setShowReassignmentModal(false);
    setReassignmentData(null);
  };

  const handleFormSave = async (fondData: FondFormData) => {
    if (editingFond) {
      await handleUpdateFond(fondData);
    } else {
      await handleCreateFond(fondData);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingFond(undefined);
    setShowReassignmentModal(false);
    setReassignmentData(null);
  };

  const handleQuickAssignment = async (fondId: number, newOwnerId: number | null) => {
    if (!canEdit) {
      setError(t('admin.error.no_assignment_permission'));
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/fonds/${fondId}/assign-owner`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ owner_id: newOwnerId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || t('admin.error.updating_assignment'));
      }

      await loadFonds();
      
      const owner = availableUsers.find(u => u.id === newOwnerId);
      const message = newOwnerId 
        ? `${t('admin.success.fond_assigned_to')} ${owner?.username || t('admin.unknown_user')}`
        : t('admin.success.assignment_removed');
      
      setSuccessMessage(message);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.error.updating_assignment_generic'));
    }
  };

  const handleBulkCheckReassignments = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/fonds/bulk-check-reassignments`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(t('admin.error.bulk_check_reassignments'));
      }

      const result = await response.json();
      
      const candidatesCount = result.manual_reassignment_candidates;
      const autoCount = result.automatic_reassignments_applied;
      
      let message = `${t('admin.success.bulk_check_complete')}: ${candidatesCount} ${t('admin.success.fonds_need_manual_reassignment')}`;
      if (autoCount > 0) {
        message += `, ${autoCount} ${t('admin.success.automatic_reassignments_applied')}`;
      }
      
      setSuccessMessage(message);
      await loadFonds();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.error.bulk_check_reassignments_generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewOnlyClick = (action: string) => {
    setError(`${t('admin.error.no_permission_prefix')} ${action}. ${t('admin.error.read_only_access')}.`);
  };

  // Enhanced filter fonds based on search and owner
  const filteredFonds = fonds.filter(fond => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        fond.company_name.toLowerCase().includes(query) ||
        fond.holder_name.toLowerCase().includes(query) ||
        fond.address?.toLowerCase().includes(query) ||
        fond.email?.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }
    
    if (ownerFilter !== 'all') {
      if (ownerFilter === 'unassigned') {
        return !fond.owner_id;
      } else if (ownerFilter === 'assigned') {
        return !!fond.owner_id;
      } else {
        return fond.owner_id === parseInt(ownerFilter);
      }
    }
    
    return true;
  });

  // Enhanced stats calculation
  const stats = {
    total: fonds.length,
    active: fonds.filter(f => f.active).length,
    inactive: fonds.filter(f => !f.active).length,
    assigned: fonds.filter(f => f.owner_id).length,
    unassigned: fonds.filter(f => !f.owner_id).length,
  };

  // Get dashboard title and description
  const getDashboardTitle = () => {
    if (isAdmin) return t('nav.admin.dashboard');
    if (isAudit) return t('nav.audit.dashboard');
    return t('nav.dashboard');
  };

  const getDashboardDescription = () => {
    if (isAdmin) return t('nav.admin.dashboard.description');
    if (isAudit) return t('nav.audit.dashboard.description');
    return t('nav.dashboard.description');
  };

  if (loading && !reassignmentData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-4">{t('admin.loading.dashboard')}</p>
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
              {isAdmin && <Archive className="h-8 w-8 text-blue-600 dark:text-blue-400" />}
              {isAudit && <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />}
              {isClient && <Building2 className="h-8 w-8 text-green-600 dark:text-green-400" />}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{getDashboardTitle()}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">{getDashboardDescription()}</p>
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
                
                {(isAdmin || isAudit) && (
                  <button 
                    onClick={goToUsersManagement}
                    className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors px-3 py-2 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    <Users className="h-4 w-4" />
                    <span>{t('nav.users')}</span>
                  </button>
                )}

                <button 
                  onClick={goToProfile}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors px-3 py-2 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <User className="h-4 w-4" />
                  <span>{t('nav.profile')}</span>
                </button>
              </nav>
              
              {/* 🌍 Language & Dark Mode Toggles */}
              <LanguageToggle size="sm" />
              <DarkModeToggle size="sm" showLabel={false} />
              
              {/* User profile section */}
              <div className={`flex items-center space-x-3 rounded-lg px-4 py-2 ${
                isAdmin ? 'bg-blue-50 dark:bg-blue-900/20' : 
                isAudit ? 'bg-purple-50 dark:bg-purple-900/20' : 
                'bg-green-50 dark:bg-green-900/20'
              }`}>
                <div className="flex-shrink-0">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    isAdmin ? 'bg-blue-600 dark:bg-blue-500' : 
                    isAudit ? 'bg-purple-600 dark:bg-purple-500' : 
                    'bg-green-600 dark:bg-green-500'
                  }`}>
                    {isAdmin && <Archive className="h-5 w-5 text-white" />}
                    {isAudit && <Shield className="h-5 w-5 text-white" />}
                    {isClient && <Building2 className="h-5 w-5 text-white" />}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.username}</p>
                  <p className={`text-xs capitalize ${
                    isAdmin ? 'text-blue-600 dark:text-blue-400' : 
                    isAudit ? 'text-purple-600 dark:text-purple-400' : 
                    'text-green-600 dark:text-green-400'
                  }`}>
                    {user?.role}
                    {isAudit && ` (${t('common.read_only')})`}
                  </p>
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
        {/* Read-Only Notice for Audit Users */}
        {isAudit && (
          <div className="mb-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-center">
              <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200">{t('admin.notice.audit_access_title')}</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  {t('admin.notice.audit_access_description')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Reassignment Notice for Admin */}
        {isAdmin && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">{t('admin.notice.assignment_title')}</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {t('admin.notice.assignment_description')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoReassignEnabled}
                    onChange={(e) => setAutoReassignEnabled(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  />
                  <span className="text-sm text-blue-700 dark:text-blue-300">{t('admin.auto_assignment_exact_matches')}</span>
                </label>
                <button
                  onClick={handleBulkCheckReassignments}
                  disabled={loading}
                  className="flex items-center space-x-2 px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" />
                  <span>{t('admin.check_all')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Total Fonds */}
          <div 
            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md dark:hover:shadow-xl transition-shadow border dark:border-gray-700 ${
              canEdit ? 'cursor-pointer' : ''
            }`}
            onClick={canEdit ? () => setShowForm(true) : undefined}
          >
            <div className="flex items-center">
              <Archive className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('admin.stats.total_fonds')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                {canEdit && <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{t('admin.stats.click_to_add')}</p>}
              </div>
            </div>
          </div>

          {/* Active Fonds */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md dark:hover:shadow-xl transition-shadow border dark:border-gray-700">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('admin.stats.active_fonds')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.active}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{t('admin.stats.visible_public')}</p>
              </div>
            </div>
          </div>

          {/* Assigned Fonds */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md dark:hover:shadow-xl transition-shadow border dark:border-gray-700">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('admin.stats.assigned')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.assigned}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{t('admin.stats.have_owner')}</p>
              </div>
            </div>
          </div>

          {/* Unassigned Fonds */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md dark:hover:shadow-xl transition-shadow border dark:border-gray-700">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('admin.stats.unassigned')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.unassigned}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{t('admin.stats.no_owner')}</p>
              </div>
            </div>
          </div>

          {/* Users Management */}
          {(isAdmin || isAudit) && (
            <div 
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md dark:hover:shadow-xl transition-shadow cursor-pointer border dark:border-gray-700"
              onClick={goToUsersManagement}
            >
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('nav.users')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    <span className="text-lg">{t('admin.stats.manage')}</span>
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    {isAdmin ? t('admin.stats.click_to_manage') : t('admin.stats.click_to_view')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

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

        {/* Enhanced Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 border dark:border-gray-700">
          <div className="p-6">
            <div className="flex flex-col space-y-4">
              {/* Search and main controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex-1 max-w-lg">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('admin.search.placeholder')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {canEdit ? (
                    <button
                      onClick={() => {
                        setEditingFond(undefined);
                        setShowForm(true);
                      }}
                      className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center space-x-2 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{t('admin.actions.add_fond')}</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 text-sm">
                      <Eye className="h-4 w-4" />
                      <span>{t('common.view_only')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced filters row */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('admin.filters.show_inactive')}</span>
                </label>

                {/* Owner filter */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('admin.filters.owner')}:</span>
                  <select
                    value={ownerFilter}
                    onChange={(e) => setOwnerFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">{t('admin.filters.all')}</option>
                    <option value="assigned">{t('admin.filters.assigned')}</option>
                    <option value="unassigned">{t('admin.filters.unassigned')}</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id.toString()}>
                        {user.username} {user.company_name ? `(${user.company_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Results count */}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredFonds.length} {t('admin.filters.of')} {fonds.length} {t('admin.filters.fonds')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Fonds Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('admin.table.company')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('admin.table.archive_holder')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('admin.table.contact')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('admin.table.status_owner')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('admin.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredFonds.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-lg font-medium">{t('admin.table.no_fonds_found')}</p>
                      <p className="text-sm">
                        {searchQuery || ownerFilter !== 'all' ? t('admin.table.try_modify_filters') : t('admin.table.loading_fonds')}
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
                              <a href={`mailto:${fond.email}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                                {fond.email}
                              </a>
                            </div>
                          )}
                          {fond.phone && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Phone className="h-3 w-3 mr-2" />
                              <a href={`tel:${fond.phone}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                                {fond.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {/* Active/Inactive status */}
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            fond.active 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}>
                            {fond.active ? t('common.active') : t('common.inactive')}
                          </span>
                          
                          {/* Enhanced ownership status with quick assignment */}
                          {fond.owner_id && fond.owner ? (
                            <div className="space-y-1">
                              <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                <div className="font-medium">{fond.owner.username}</div>
                                {fond.owner.company_name && (
                                  <div className="text-blue-500 dark:text-blue-400">{fond.owner.company_name}</div>
                                )}
                              </div>
                              {/* Quick reassignment for admins */}
                              {canEdit && (
                                <select
                                  value={fond.owner_id || ''}
                                  onChange={(e) => {
                                    const newOwnerId = e.target.value ? parseInt(e.target.value) : null;
                                    if (newOwnerId !== fond.owner_id) {
                                      handleQuickAssignment(fond.id, newOwnerId);
                                    }
                                  }}
                                  className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="">{t('admin.table.unassigned_option')}</option>
                                  {availableUsers.map((user) => (
                                    <option key={user.id} value={user.id}>
                                      {user.username} {user.company_name ? `(${user.company_name})` : ''}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                                {t('admin.table.unassigned')}
                              </div>
                              {/* Quick assignment for admins */}
                              {canEdit && (
                                <select
                                  value=""
                                  onChange={(e) => {
                                    const newOwnerId = e.target.value ? parseInt(e.target.value) : null;
                                    if (newOwnerId) {
                                      handleQuickAssignment(fond.id, newOwnerId);
                                    }
                                  }}
                                  className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="">{t('admin.table.assign_to')}</option>
                                  {availableUsers.map((user) => (
                                    <option key={user.id} value={user.id}>
                                      {user.username} {user.company_name ? `(${user.company_name})` : ''}
                                    </option>
                                  ))}
                                </select>
                            )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        {canEdit ? (
                          <>
                            <button
                              onClick={() => {
                                setEditingFond(fond);
                                setShowForm(true);
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              title={t('admin.actions.edit')}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                             onClick={() => handleDeleteFond(fond)}
                             className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title={t('admin.actions.delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleViewOnlyClick(t('admin.actions.edit_fond'))}
                            className="text-gray-400 dark:text-gray-500 p-1 rounded cursor-not-allowed opacity-50"
                            title={t('common.view_only')}
                            disabled
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
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
          <div className="mt-4 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              {t('admin.pagination.showing')} {filteredFonds.length} {t('admin.pagination.of')} {fonds.length} {t('admin.pagination.fonds')}
            </p>
            <div className="flex items-center space-x-4">
              {searchQuery && <span>{t('admin.pagination.filtered_by')}: "{searchQuery}"</span>}
              {ownerFilter !== 'all' && (
                <span>
               {t('admin.pagination.owner')}: {
                    ownerFilter === 'assigned' ? t('admin.filters.assigned') :
                    ownerFilter === 'unassigned' ? t('admin.filters.unassigned') :
                    availableUsers.find(u => u.id.toString() === ownerFilter)?.username || t('admin.pagination.unknown')
                  }
                </span>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Enhanced Form Modal - Only for Admin */}
      {showForm && canEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-4 z-40">
          <FondForm
            fond={editingFond}
            existingFonds={fonds}
            availableUsers={availableUsers}
            currentUserRole={user?.role}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
            isLoading={formLoading}
          />
        </div>
      )}

      {/* Reassignment Modal */}
      {showReassignmentModal && reassignmentData && (
        <ReassignmentModal
          reassignmentData={reassignmentData}
          onConfirm={handleReassignmentConfirm}
          onCancel={handleReassignmentCancel}
          isLoading={reassignmentLoading}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
