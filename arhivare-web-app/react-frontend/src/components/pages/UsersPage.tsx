// src/components/pages/UsersPage.tsx - With Read-Only Access for Non-Admin Users
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Search, Users, Shield, 
  Eye, EyeOff, LogOut, Home, CheckCircle, X, 
  AlertCircle, Key, User, Lock, Info
} from 'lucide-react';
import { useAuth } from '../AuthSystem';
import UserForm from '../forms/UserForm';

// Types
interface UserData {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

interface UserFormData {
  username: string;
  password: string;
  role: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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
      
      setSuccessMessage(`Utilizatorul "${newUser.username}" a fost creat cu succes!`);
      
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
        role: userData.role
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
        throw new Error(`Error deleting user: ${response.status}`);
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
      user.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Stats
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    users: users.filter(u => u.role === 'user').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Se încarcă utilizatorii...</p>
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
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isAdmin ? 'Management Utilizatori' : 'Vizualizare Utilizatori'}
                </h1>
                <p className="text-sm text-gray-600">
                  {isAdmin ? 'Administrează conturile utilizatorilor' : 'Vezi lista utilizatorilor (doar citire)'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Navigation buttons */}
              <button 
                onClick={() => navigate(isAdmin ? '/admin' : '/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-md hover:bg-gray-50"
              >
                <Home className="h-4 w-4" />
                <span>{isAdmin ? 'Dashboard' : 'Căutare'}</span>
              </button>
              
              {/* User profile section */}
              <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-4 py-2">
                <div className="flex-shrink-0">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    isAdmin ? 'bg-purple-600' : 'bg-green-600'
                  }`}>
                    {isAdmin ? <Shield className="h-5 w-5 text-white" /> : <User className="h-5 w-5 text-white" />}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{currentUser?.username}</p>
                  <p className="text-xs text-gray-500 capitalize">{currentUser?.role}</p>
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
        {/* Read-Only Notice for Non-Admin Users */}
        {isReadOnly && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Info className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Acces în modul vizualizare</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Poți vedea lista utilizatorilor dar nu poți face modificări. Pentru acces complet, contactează un administrator.
                </p>
              </div>
            </div>
          </div>
        )}

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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Utilizatori</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Administratori</p>
                <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <User className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Utilizatori</p>
                <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
              </div>
            </div>
          </div>
        </div>

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
                    placeholder="Caută utilizatori..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Role filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="all">Toate rolurile</option>
                  <option value="admin">Administratori</option>
                  <option value="user">Utilizatori</option>
                </select>

                {/* Add User Button - Only for Admins */}
                {isAdmin ? (
                  <button
                    onClick={() => {
                      setEditingUser(undefined);
                      setShowForm(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adaugă Utilizator</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleViewOnlyClick('adăuga utilizatori')}
                    className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed flex items-center space-x-2 opacity-60"
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

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilizator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creat la
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acțiuni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium">Niciun utilizator găsit</p>
                      <p className="text-sm">
                        {searchQuery ? 'Încearcă să modifici căutarea' : 'Utilizatorii se încarcă...'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            user.role === 'admin' ? 'bg-purple-100' : 'bg-green-100'
                          }`}>
                            {user.role === 'admin' ? (
                              <Shield className="h-5 w-5 text-purple-600" />
                            ) : (
                              <User className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {user.username}
                              {user.id === currentUser?.id && (
                                <span className="ml-2 text-xs text-blue-600">(tu)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role === 'admin' ? 'Administrator' : 'Utilizator'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
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
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="Editează"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            
                            {user.id !== currentUser?.id && (
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
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
                              className="text-gray-400 p-1 rounded cursor-not-allowed opacity-50"
                              title="Doar citire - Nu ai permisiuni de editare"
                              disabled
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            {user.id !== currentUser?.id && (
                              <button
                                onClick={() => handleViewOnlyClick('șterge utilizatori')}
                                className="text-gray-400 p-1 rounded cursor-not-allowed opacity-50"
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results info */}
        {filteredUsers.length > 0 && (
          <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
