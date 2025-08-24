// src/components/AdminDashboard.tsx - COMPLETE VERSION with LoadingButtons
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Search, Building2, Archive, 
  Phone, Mail, MapPin, X, LogOut, Users, Home, CheckCircle,
  User, Settings, BarChart3, Shield, Eye, AlertTriangle,
  RefreshCw, Zap, Target, UserCheck
} from 'lucide-react';
import { useAuth } from './AuthSystem';
import { LoadingButton, PageLoader, TableSkeleton } from './common/LoadingStates'; // ADD THIS IMPORT
import FondForm from './forms/FondForm';
import ReassignmentModal from './ReassignmentModal';

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
  const navigate = useNavigate();
  const [fonds, setFonds] = useState<Fond[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingFond, setEditingFond] = useState<Fond | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  
  // Reassignment state
  const [showReassignmentModal, setShowReassignmentModal] = useState(false);
  const [reassignmentData, setReassignmentData] = useState<ReassignmentData | null>(null);
  const [reassignmentLoading, setReassignmentLoading] = useState(false);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState<string>('all');

  // Auto-reassignment settings
  const [autoReassignEnabled, setAutoReassignEnabled] = useState(false);

  // NEW: Specific loading states for different operations
  const [bulkLoading, setBulkLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<Record<number, boolean>>({});
  const [assignmentLoading, setAssignmentLoading] = useState<Record<number, boolean>>({});

  // Role-based access control
  const isAdmin = user?.role === 'admin';
  const isAudit = user?.role === 'audit';
  const isClient = user?.role === 'client';
  const canEdit = isAdmin;
  const canView = isAdmin || isAudit;

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
    loadUsers();
  }, [loadFonds, loadUsers]);

  // Enhanced CREATE fond function with owner assignment
  const handleCreateFond = async (fondData: FondFormData) => {
    if (!canEdit) {
      setError('Nu ai permisiuni pentru a crea fonduri');
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
        throw new Error(errorData.detail || `Error creating fond: ${response.status}`);
      }

      const newFond = await response.json();
      
      setShowForm(false);
      setEditingFond(undefined);
      await loadFonds();
      
      let message = `Fondul "${newFond.company_name}" a fost creat cu succes!`;
      if (newFond.owner_id) {
        const owner = availableUsers.find(u => u.id === newFond.owner_id);
        if (owner) {
          message += ` Assignat către ${owner.username}.`;
        }
      }
      
      setSuccessMessage(message);
      
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating fond');
    } finally {
      setFormLoading(false);
    }
  };

  // Enhanced UPDATE fond function with reassignment detection and manual assignment
  const handleUpdateFond = async (fondData: FondFormData) => {
    if (!canEdit) {
      setError('Nu ai permisiuni pentru a modifica fonduri');
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
        throw new Error(errorData.detail || `Error updating fond: ${response.status}`);
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
      
      let message = `Fondul "${responseData.fond.company_name}" a fost actualizat cu succes!`;
      if (responseData.auto_reassignment_applied) {
        message += ' (Reassignment automat aplicat)';
      } else if (fondData.owner_id !== editingFond.owner_id) {
        if (fondData.owner_id) {
          const newOwner = availableUsers.find(u => u.id === fondData.owner_id);
          if (newOwner) {
            message += ` Assignat către ${newOwner.username}.`;
          }
        } else {
          message += ' Assignment eliminat.';
        }
      }
      
      setSuccessMessage(message);
      
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating fond');
    } finally {
      if (!reassignmentData) {
        setFormLoading(false);
      }
    }
  };

  // Reassignment confirmation
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
        throw new Error(errorData.detail || 'Error confirming reassignment');
      }

      const result = await response.json();
      
      setShowReassignmentModal(false);
      setReassignmentData(null);
      setShowForm(false);
      setEditingFond(undefined);
      
      await loadFonds();
      
      setSuccessMessage(result.message);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error confirming reassignment');
    } finally {
      setReassignmentLoading(false);
      setFormLoading(false);
    }
  };

  // Reassignment cancellation
  const handleReassignmentCancel = () => {
    setShowReassignmentModal(false);
    setReassignmentData(null);
  };

  // Handle form save
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
    setShowReassignmentModal(false);
    setReassignmentData(null);
  };

  // ENHANCED Delete operation with per-item loading
  const handleDeleteFond = async (fond: Fond) => {
    if (!canEdit) {
      setError('Nu ai permisiuni pentru a șterge fonduri');
      return;
    }

    if (!window.confirm(`Ești sigur că vrei să ștergi fondul "${fond.company_name}"?`)) {
      return;
    }

    // Set loading for specific fond
    setDeleteLoading(prev => ({ ...prev, [fond.id]: true }));

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
    } finally {
      // Remove loading for specific fond
      setDeleteLoading(prev => {
        const newState = { ...prev };
        delete newState[fond.id];
        return newState;
      });
    }
  };

  // Quick owner assignment function with loading
  const handleQuickAssignment = async (fondId: number, newOwnerId: number | null) => {
    if (!canEdit) {
      setError('Nu ai permisiuni pentru a modifica assignment-urile');
      return;
    }

    // Set loading for specific assignment
    setAssignmentLoading(prev => ({ ...prev, [fondId]: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/fonds/${fondId}/assign-owner`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ owner_id: newOwnerId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error updating assignment');
      }

      await loadFonds();
      
      const owner = availableUsers.find(u => u.id === newOwnerId);
      const message = newOwnerId 
        ? `Fond assignat către ${owner?.username || 'utilizator necunoscut'}`
        : 'Assignment eliminat';
      
      setSuccessMessage(message);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating assignment');
    } finally {
      // Remove loading for specific assignment
      setAssignmentLoading(prev => {
        const newState = { ...prev };
        delete newState[fondId];
        return newState;
      });
    }
  };

  // ENHANCED Bulk check reassignments with loading
  const handleBulkCheckReassignments = async () => {
    if (!isAdmin) return;
    
    setBulkLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/fonds/bulk-check-reassignments`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Error checking bulk reassignments');
      }

      const result = await response.json();
      
      const candidatesCount = result.manual_reassignment_candidates;
      const autoCount = result.automatic_reassignments_applied;
      
      let message = `Verificare completă: ${candidatesCount} fonduri au nevoie de reassignment manual`;
      if (autoCount > 0) {
        message += `, ${autoCount} reassignment-uri automate aplicate`;
      }
      
      setSuccessMessage(message);
      await loadFonds();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error checking reassignments');
    } finally {
      setBulkLoading(false);
    }
  };

  // Handle view-only actions
  const handleViewOnlyClick = (action: string) => {
    setError(`Nu ai permisiuni pentru a ${action}. Contul tău are acces doar în modul vizualizare.`);
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
    if (isAdmin) return 'Dashboard Admin';
    if (isAudit) return 'Dashboard Audit';
    return 'Dashboard';
  };

  const getDashboardDescription = () => {
    if (isAdmin) return 'Management fonduri arhivistice cu assignment manual și auto-reassignment';
    if (isAudit) return 'Vizualizare și monitorizare (read-only)';
    return 'Vizualizare fonduri';
  };

  // ENHANCED: Show page loader instead of simple spinner
  if (loading && !reassignmentData) {
    return (
      <PageLoader 
        message="Se încarcă dashboard-ul..." 
        submessage="Vă rugăm să așteptați"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {isAdmin && <Archive className="h-8 w-8 text-blue-600" />}
              {isAudit && <BarChart3 className="h-8 w-8 text-purple-600" />}
              {isClient && <Building2 className="h-8 w-8 text-green-600" />}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{getDashboardTitle()}</h1>
                <p className="text-sm text-gray-600">{getDashboardDescription()}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Navigation Menu with LoadingButton */}
              <nav className="hidden md:flex items-center space-x-2">
                <LoadingButton
                  onClick={goToHomepage}
                  variant="secondary"
                  size="sm"
                  className="text-gray-600 hover:text-blue-600 bg-transparent hover:bg-gray-50"
                  icon={<Home className="h-4 w-4" />}
                >
                  Căutare
                </LoadingButton>
                
                {(isAdmin || isAudit) && (
                  <LoadingButton
                    onClick={goToUsersManagement}
                    variant="secondary"
                    size="sm"
                    className="text-gray-600 hover:text-purple-600 bg-transparent hover:bg-purple-50"
                    icon={<Users className="h-4 w-4" />}
                  >
                    Utilizatori
                  </LoadingButton>
                )}

                <LoadingButton
                  onClick={goToProfile}
                  variant="secondary"
                  size="sm"
                  className="text-gray-600 hover:text-green-600 bg-transparent hover:bg-green-50"
                  icon={<User className="h-4 w-4" />}
                >
                  Profil
                </LoadingButton>
              </nav>
              
              {/* User profile section */}
              <div className={`flex items-center space-x-3 rounded-lg px-4 py-2 ${
                isAdmin ? 'bg-blue-50' : isAudit ? 'bg-purple-50' : 'bg-green-50'
              }`}>
                <div className="flex-shrink-0">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    isAdmin ? 'bg-blue-600' : isAudit ? 'bg-purple-600' : 'bg-green-600'
                  }`}>
                    {isAdmin && <Archive className="h-5 w-5 text-white" />}
                    {isAudit && <Shield className="h-5 w-5 text-white" />}
                    {isClient && <Building2 className="h-5 w-5 text-white" />}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                  <p className={`text-xs capitalize ${
                    isAdmin ? 'text-blue-600' : isAudit ? 'text-purple-600' : 'text-green-600'
                  }`}>
                    {user?.role}
                    {isAudit && ' (Read-Only)'}
                  </p>
                </div>
                <LoadingButton
                  onClick={handleLogout}
                  variant="danger"
                  size="sm"
                  className="text-gray-400 hover:text-red-600 bg-transparent hover:bg-red-50 p-1"
                  icon={<LogOut className="h-5 w-5" />}
                >
                  <span className="sr-only">Deconectare</span>
                </LoadingButton>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Read-Only Notice for Audit Users */}
        {isAudit && (
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <Eye className="h-5 w-5 text-purple-600 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-purple-800">Acces Audit (Read-Only)</h4>
                <p className="text-sm text-purple-700 mt-1">
                  Poți vizualiza toate fondurile și exporta date, dar nu poți face modificări.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Reassignment Notice for Admin */}
        {isAdmin && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Target className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Owner Assignment & Auto-Reassignment</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Poți assigna manual fonduri către clienți și sistemul detectează automat necesitatea de reassignment.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoReassignEnabled}
                    onChange={(e) => setAutoReassignEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-blue-700">Auto-assignment pentru match-uri exacte</span>
                </label>
                <LoadingButton
                  onClick={handleBulkCheckReassignments}
                  isLoading={bulkLoading}
                  icon={<Zap className="h-4 w-4" />}
                  size="sm"
                  loadingText="Se verifică..."
                  disabled={loading}
                >
                  Verifică Toate
                </LoadingButton>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Total Fonds with Action Button */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Archive className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Fonduri</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
              {canEdit && (
                <LoadingButton
                  onClick={() => setShowForm(true)}
                  size="sm"
                  className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                  icon={<Plus className="h-4 w-4" />}
                  disabled={formLoading}
                >
                  <span className="sr-only">Adaugă fond</span>
                </LoadingButton>
              )}
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

          {/* Assigned Fonds */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assignate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.assigned}</p>
                <p className="text-xs text-gray-500 mt-1">Au owner</p>
              </div>
            </div>
          </div>

          {/* Unassigned Fonds */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Neasignate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unassigned}</p>
                <p className="text-xs text-gray-500 mt-1">Fără owner</p>
              </div>
            </div>
          </div>

          {/* Users Management */}
          {(isAdmin || isAudit) && (
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
                  <p className="text-xs text-purple-600 mt-1">
                    {isAdmin ? 'Click pentru management' : 'Click pentru vizualizare'}
                  </p>
                </div>
              </div>
            </div>
          )}
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

        {/* Enhanced Controls */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col space-y-4">
              {/* Search and main controls */}
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
                  {canEdit ? (
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
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-500 text-sm">
                      <Eye className="h-4 w-4" />
                      <span>Doar vizualizare</span>
                    </div>
                  )}
                </div>
              </div>

              {/* NEW: Enhanced filters row */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Arată inactive</span>
                </label>

                {/* NEW: Owner filter */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Owner:</span>
                  <select
                    value={ownerFilter}
                    onChange={(e) => setOwnerFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="all">Toate</option>
                    <option value="assigned">Assignate</option>
                    <option value="unassigned">Neasignate</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id.toString()}>
                        {user.username} {user.company_name ? `(${user.company_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Results count */}
                <div className="text-sm text-gray-500">
                  {filteredFonds.length} din {fonds.length} fonduri
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Fonds Table */}
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
                    Status / Owner
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
                        {searchQuery || ownerFilter !== 'all' ? 'Încearcă să modifici filtrele' : 'Fondurile se încarcă...'}
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
                        <div className="space-y-2">
                          {/* Active/Inactive status */}
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            fond.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {fond.active ? 'Activ' : 'Inactiv'}
                          </span>
                          
                          {/* NEW: Enhanced ownership status with quick assignment */}
                          {fond.owner_id && fond.owner ? (
                            <div className="space-y-1">
                              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                <div className="font-medium">{fond.owner.username}</div>
                                {fond.owner.company_name && (
                                  <div className="text-blue-500">{fond.owner.company_name}</div>
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
                                  className="w-full text-xs border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="">-- Neasignat --</option>
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
                              <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                Neasignat
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
                                  className="w-full text-xs border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="">-- Assignează către --</option>
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
                          </>
                        ) : (
                          <button
                            onClick={() => handleViewOnlyClick('edita fonduri')}
                            className="text-gray-400p-1 rounded cursor-not-allowed opacity-50"
                            title="Doar vizualizare"
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
          <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
            <p>
              Afișând {filteredFonds.length} din {fonds.length} fonduri
            </p>
            <div className="flex items-center space-x-4">
              {searchQuery && <span>Filtrate după: "{searchQuery}"</span>}
              {ownerFilter !== 'all' && (
                <span>
                  Owner: {
                    ownerFilter === 'assigned' ? 'Assignate' :
                 ownerFilter === 'unassigned' ? 'Neasignate' :
                    availableUsers.find(u => u.id.toString() === ownerFilter)?.username || 'Necunoscut'
                  }
                </span>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Enhanced Form Modal - Only for Admin */}
      {showForm && canEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
          <FondForm
            fond={editingFond}
            existingFonds={fonds}
            availableUsers={availableUsers} // NEW: Pass available users
            currentUserRole={user?.role} // NEW: Pass current user role
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
