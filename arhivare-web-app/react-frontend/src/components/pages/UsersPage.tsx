// src/components/pages/UsersPage.tsx - FIXED Dark Mode Support
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Search, Users, Shield, 
  Eye, EyeOff, LogOut, Home, CheckCircle, X, 
  AlertCircle, Key, User, Lock, Info, Building2
} from 'lucide-react';
import { useAuth } from '../AuthSystem';
import UserForm from '../forms/UserForm';

// Types
interface UserData {
  id: number;
  username: string;
  role: string;
  company_name?: string;
  contact_email?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

interface UserFormData {
  username: string;
  password: string;
  role: string;
  company_name: string;
  contact_email: string;
  notes: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// CORRECT ROLES - Fixed to match backend
const VALID_ROLES = ['admin', 'audit', 'client'];

const UsersPage: React.FC = () => {
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  // Check user permissions
  const isAdmin = currentUser?.role === 'admin';
  const isReadOnly = !isAdmin;
  
  // State management
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Clear messages after delay
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

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Load users function
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/?skip=0&limit=100`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        if (response.status === 403) {
          setError('Nu ai permisiuni pentru a vedea lista utilizatorilor');
          return;
        }
        throw new Error(`Error loading users: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // CREATE user (Admin only)
  const handleCreateUser = async (userData: UserFormData) => {
    if (!isAdmin) {
      setError('Nu ai permisiuni pentru a crea utilizatori');
      return;
    }

    setFormLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error creating user: ${response.status}`);
      }

      const newUser = await response.json();
      
      setShowForm(false);
      setEditingUser(undefined);
      await loadUsers();
      
      setSuccessMessage(`Utilizatorul "${newUser.username}" (${newUser.role}) a fost creat cu succes!`);
      
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating user');
    } finally {
      setFormLoading(false);
    }
  };

  // UPDATE user (Admin only)
  const handleUpdateUser = async (userData: UserFormData) => {
    if (!isAdmin) {
      setError('Nu ai permisiuni pentru a modifica utilizatori');
      return;
    }

    if (!editingUser) return;
    
    setFormLoading(true);
    setError(null);
    
    try {
      // Prepare update data - don't send password if empty
      const updateData: any = {
        username: userData.username,
        role: userData.role,
        company_name: userData.company_name,
        contact_email: userData.contact_email,
        notes: userData.notes
      };
      
      if (userData.password && userData.password.trim()) {
        updateData.password = userData.password;
      }

      const response = await fetch(`${API_BASE_URL}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error updating user: ${response.status}`);
      }

      const updatedUser = await response.json();
      
      setShowForm(false);
      setEditingUser(undefined);
      await loadUsers();
      
      setSuccessMessage(`Utilizatorul "${updatedUser.username}" a fost actualizat cu succes!`);
      
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating user');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle form save
  const handleFormSave = async (userData: UserFormData) => {
    if (editingUser) {
      await handleUpdateUser(userData);
    } else {
      await handleCreateUser(userData);
    }
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingUser(undefined);
  };

  // DELETE user (Admin only)
  const handleDeleteUser = async (user: UserData) => {
    if (!isAdmin) {
      setError('Nu ai permisiuni pentru a șterge utilizatori');
      return;
    }

    // Prevent deleting self
    if (user.id === currentUser?.id) {
      setError('Nu te poți șterge pe tine însuți!');
      return;
    }

    if (!window.confirm(`Ești sigur că vrei să ștergi utilizatorul "${user.username}"?\n\nAceastă acțiune este ireversibilă!`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error deleting user: ${response.status}`);
      }

      await loadUsers();
      setSuccessMessage(`Utilizatorul "${user.username}" a fost șters cu succes!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting user');
    }
  };

  // Handle view-only click for non-admin users
  const handleViewOnlyClick = (action: string) => {
    setError(`Nu ai permisiuni pentru a ${action}. Contul tău are acces doar în modul vizualizare.`);
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.company_name && user.company_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Stats calculation
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    audit: users.filter(u => u.role === 'audit').length,
    clients: users.filter(u => u.role === 'client').length,
  };

  // Get role display info
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrator', color: 'purple', icon: Shield };
      case 'audit':
        return { label: 'Audit', color: 'orange', icon: Eye };
      case 'client':
        return { label: 'Client', color: 'green', icon: Building2 };
      default:
        return { label: role, color: 'gray', icon: User };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-4">Se încarcă utilizatorii...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - FIXED Dark Mode */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {isAdmin ? 'Management Utilizatori' : 'Vizualizare Utilizatori'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isAdmin ? 'Administrează conturile utilizatorilor' : 'Vezi lista utilizatorilor (doar citire)'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Navigation buttons */}
              <button 
                onClick={() => navigate(isAdmin ? '/admin' : '/')}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Home className="h-4 w-4" />
                <span>{isAdmin ? 'Dashboard' : 'Căutare'}</span>
              </button>
              
              {/* User profile section - FIXED Dark Mode */}
              <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-2">
                <div className="flex-shrink-0">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    isAdmin ? 'bg-purple-600' : 'bg-green-600'
                  }`}>
                    {isAdmin ? <Shield className="h-5 w-5 text-white" /> : <User className="h-5 w-5 text-white" />}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{currentUser?.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{currentUser?.role}</p>
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
        {/* Read-Only Notice for Non-Admin Users - FIXED Dark Mode */}
        {isReadOnly && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">Acces în modul vizualizare</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Poți vedea lista utilizatorilor dar nu poți face modificări. Pentru acces complet, contactează un administrator.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message - FIXED Dark Mode */}
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

        {/* Error Message - FIXED Dark Mode */}
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

        {/* Statistics Cards - FIXED Dark Mode */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md dark:hover:shadow-xl transition-shadow border dark:border-gray-700">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Utilizatori</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md dark:hover:shadow-xl transition-shadow border dark:border-gray-700">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administratori</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.admins}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md dark:hover:shadow-xl transition-shadow border dark:border-gray-700">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Audit</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.audit}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md dark:hover:shadow-xl transition-shadow border dark:border-gray-700">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Clienți</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.clients}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls - FIXED Dark Mode */}
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
                    placeholder="Caută utilizatori..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Role filter - FIXED Dark Mode */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">Toate rolurile</option>
                  <option value="admin">Administratori</option>
                  <option value="audit">Audit</option>
                  <option value="client">Clienți</option>
                </select>

                {/* Add User Button - Only for Admins */}
                {isAdmin ? (
                  <button
                    onClick={() => {
                      setEditingUser(undefined);
                      setShowForm(true);
                    }}
                    className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adaugă Utilizator</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleViewOnlyClick('adăuga utilizatori')}
                    className="bg-gray-400 dark:bg-gray-600 text-white px-4 py-2 rounded-lg cursor-not-allowed flex items-center space-x-2 opacity-60"
                    disabled
                  >
                    <Lock className="h-4 w-4" />
                    <span>Doar citire</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Users Table - FIXED Dark Mode */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Utilizator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Companie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Creat la
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acțiuni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-lg font-medium">Niciun utilizator găsit</p>
                      <p className="text-sm">
                        {searchQuery ? 'Încearcă să modifici căutarea' : 'Utilizatorii se încarcă...'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const roleDisplay = getRoleDisplay(user.role);
                    const RoleIcon = roleDisplay.icon;
                    
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center bg-${roleDisplay.color}-100 dark:bg-${roleDisplay.color}-900/30`}>
                              <RoleIcon className={`h-5 w-5 text-${roleDisplay.color}-600 dark:text-${roleDisplay.color}-400`} />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {user.username}
                                {user.id === currentUser?.id && (
                                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(tu)</span>
                                )}
                              </div>
                              {user.contact_email && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">{user.contact_email}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${roleDisplay.color}-100 dark:bg-${roleDisplay.color}-900/30 text-${roleDisplay.color}-800 dark:text-${roleDisplay.color}-300`}>
                            {roleDisplay.label}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {user.company_name ? (
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">{user.company_name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Companie client</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(user.created_at).toLocaleDateString('ro-RO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>

                        <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                          {isAdmin ? (
                            <>
                              <button
                                onClick={() => {
                                  setEditingUser(user);
                                  setShowForm(true);
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                title="Editează"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              
                              {user.id !== currentUser?.id && (
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  title="Șterge"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleViewOnlyClick('edita utilizatori')}
                                className="text-gray-400 dark:text-gray-500 p-1 rounded cursor-not-allowed opacity-50"
                                title="Doar citire - Nu ai permisiuni de editare"
                                disabled
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              
                              {user.id !== currentUser?.id && (
                                <button
                                  onClick={() => handleViewOnlyClick('șterge utilizatori')}
                                  className="text-gray-400 dark:text-gray-500 p-1 rounded cursor-not-allowed opacity-50"
                                  title="Doar citire - Nu ai permisiuni de ștergere"
                                  disabled
                                >
                                  <Lock className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results info - FIXED Dark Mode */}
        {filteredUsers.length > 0 && (
          <div className="mt-4 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              Afișând {filteredUsers.length} din {users.length} utilizatori
            </p>
            <p>
              {searchQuery && `Filtrate după: "${searchQuery}"`}
              {roleFilter !== 'all' && ` | Rol: ${roleFilter}`}
            </p>
          </div>
        )}
      </main>

      {/* Form Modal - Only show for Admins */}
      {showForm && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <UserForm
            user={editingUser}
            existingUsers={users}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
            isLoading={formLoading}
          />
        </div>
      )}
    </div>
  );
};

export default UsersPage;
