// src/components/HomePage.tsx - ENHANCED with Dark Mode Toggle
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Phone, Mail, MapPin, Building2, Archive, LogIn, 
  Users, BarChart3, Eye, User, ChevronDown
} from 'lucide-react';
import { useAuth } from './AuthSystem';

// 🔴 ADD DARK MODE IMPORTS
import { DarkModeToggle } from './common/DarkModeSystem';

// Type definitions bazate pe schema din backend
interface Fond {
  id: number;
  company_name: string;
  holder_name: string;
  address?: string;
  email?: string;
  phone?: string;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// UserDropdownMenu component - ENHANCED with Dark Mode
interface UserDropdownMenuProps {
  user: any;
  isAdmin: boolean;
  isAudit: boolean;
  isClient: boolean;
  onAdminNavigation: () => void;
  onAuditNavigation: () => void;
  onClientNavigation: () => void;
  onUsersManagement: () => void;
  onProfile: () => void;
  onLogout: () => void;
}

const UserDropdownMenu: React.FC<UserDropdownMenuProps> = ({
  user,
  isAdmin,
  isAudit,
  isClient,
  onAdminNavigation,
  onAuditNavigation,
  onClientNavigation,
  onUsersManagement,
  onProfile,
  onLogout
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  const handleOptionClick = (callback: () => void) => {
    callback();
    closeDropdown();
  };

  const getDropdownButtonColor = () => {
    if (isAdmin) return 'bg-blue-600 hover:bg-blue-700 text-white';
    if (isAudit) return 'bg-purple-600 hover:bg-purple-700 text-white';
    if (isClient) return 'bg-green-600 hover:bg-green-700 text-white';
    return 'bg-gray-600 hover:bg-gray-700 text-white';
  };

  const getDropdownIcon = () => {
    if (isAdmin) return <Archive className="h-5 w-5" />;
    if (isAudit) return <BarChart3 className="h-5 w-5" />;
    if (isClient) return <Building2 className="h-5 w-5" />;
    return <User className="h-5 w-5" />;
  };

  const getDropdownTitle = () => {
    if (isAdmin) return 'Dashboard Admin';
    if (isAudit) return 'Dashboard Audit';
    if (isClient) return 'Zona Client';
    return 'Meniu';
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative dropdown-container">
      {/* User info and dropdown button */}
      <div className="flex items-center space-x-3">
        {/* 🔴 ADD DARK MODE TOGGLE HERE */}
        <DarkModeToggle size="sm" />
        
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bună, <span className="font-medium">{user?.username}</span>!
          </p>
          <p className={`text-xs capitalize ${
            isAdmin ? 'text-blue-600 dark:text-blue-400' : 
            isAudit ? 'text-purple-600 dark:text-purple-400' : 
            'text-green-600 dark:text-green-400'
          }`}>
            {user?.role}
          </p>
        </div>

        <button
          onClick={toggleDropdown}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${getDropdownButtonColor()}`}
        >
          {getDropdownIcon()}
          <span className="hidden md:block">{getDropdownTitle()}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown menu - ENHANCED with Dark Mode */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-600">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.username}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
          </div>

          {/* Admin Menu Items */}
          {isAdmin && (
            <>
              <button
                onClick={() => handleOptionClick(onAdminNavigation)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center space-x-3 transition-colors"
              >
                <Archive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Dashboard Admin</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Management fonduri arhivistice</div>
                </div>
              </button>

              <button
                onClick={() => handleOptionClick(onUsersManagement)}
                className="w-full text-left px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center space-x-3 transition-colors"
              >
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Management Utilizatori</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Gestionează conturile utilizatorilor</div>
                </div>
              </button>

              <button
                onClick={() => handleOptionClick(onProfile)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
              >
                <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Profil</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Setări cont și parolă</div>
                </div>
              </button>
            </>
          )}

          {/* Audit Menu Items */}
          {isAudit && (
            <>
              <button
                onClick={() => handleOptionClick(onAuditNavigation)}
                className="w-full text-left px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center space-x-3 transition-colors"
              >
                <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Dashboard Audit</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Monitorizare și rapoarte (read-only)</div>
                </div>
              </button>

              <button
                onClick={() => handleOptionClick(onUsersManagement)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
              >
                <Eye className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Vizualizare Utilizatori</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Vezi lista utilizatorilor (read-only)</div>
                </div>
              </button>

              <button
                onClick={() => handleOptionClick(onProfile)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
              >
                <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Profil</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Setări cont și parolă</div>
                </div>
              </button>
            </>
          )}

          {/* Client Menu Items */}
          {isClient && (
            <>
              <button
                onClick={() => handleOptionClick(onClientNavigation)}
                className="w-full text-left px-4 py-3 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center space-x-3 transition-colors"
              >
                <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Fondurile Mele</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Gestionează fondurile tale arhivistice</div>
                </div>
              </button>

              <button
                onClick={() => handleOptionClick(onProfile)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center space-x-3 transition-colors"
              >
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Profilul Meu</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Actualizează datele companiei și parola</div>
                </div>
              </button>
            </>
          )}

          {/* Logout */}
          <div className="border-t border-gray-100 dark:border-gray-600 mt-2">
            <button
              onClick={() => handleOptionClick(onLogout)}
              className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-3 transition-colors"
            >
              <LogIn className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <div className="text-sm font-medium text-red-600 dark:text-red-400">Deconectare</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Închide sesiunea</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  
  // State management pentru search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Fond[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;

  // Role checks
  const isAdmin = user?.role === 'admin';
  const isAudit = user?.role === 'audit';
  const isClient = user?.role === 'client';

  // Search function
  const performSearch = async (searchQuery: string, page: number = 1) => {
    if (searchQuery.length < 2) {
      setError('Căutarea trebuie să conțină cel puțin 2 caractere');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const skip = (page - 1) * resultsPerPage;
      
      // Perform parallel requests pentru results și count
      const [resultsResponse, countResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(searchQuery)}&skip=${skip}&limit=${resultsPerPage}`),
        fetch(`${API_BASE_URL}/search/count?query=${encodeURIComponent(searchQuery)}`)
      ]);

      if (!resultsResponse.ok) {
        throw new Error(`Eroare de căutare: ${resultsResponse.status}`);
      }

      const resultsData = await resultsResponse.json();
      const countData = countResponse.ok ? await countResponse.json() : { total_results: resultsData.length };

      setResults(resultsData);
      setTotalResults(countData.total_results);
      setCurrentPage(page);
      setHasSearched(true);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'A apărut o eroare la căutare');
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submit
  const handleSearch = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      performSearch(query.trim(), 1);
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (query.trim()) {
      performSearch(query.trim(), page);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    window.location.reload(); // Refresh to show login state
  };

  // Navigation functions based on role
  const handleAdminNavigation = () => {
    navigate('/admin');
  };

  const handleAuditNavigation = () => {
    navigate('/audit');
  };

  const handleClientNavigation = () => {
    navigate('/client');
  };

  const handleUsersManagement = () => {
    navigate('/admin/users');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const startResult = (currentPage - 1) * resultsPerPage + 1;
  const endResult = Math.min(currentPage * resultsPerPage, totalResults);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header - ENHANCED with Dark Mode */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Archive className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Arhivare Web App</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Căutare fonduri arhivistice româneşti</p>
              </div>
            </div>
            
            {/* Auth section - ENHANCED with Dark Mode */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <UserDropdownMenu 
                  user={user}
                  isAdmin={isAdmin}
                  isAudit={isAudit}
                  isClient={isClient}
                  onAdminNavigation={handleAdminNavigation}
                  onAuditNavigation={handleAuditNavigation}
                  onClientNavigation={handleClientNavigation}
                  onUsersManagement={handleUsersManagement}
                  onProfile={() => navigate('/profile')}
                  onLogout={handleLogout}
                />
              ) : (
                <div className="flex items-center space-x-3">
                  {/* 🔴 ADD DARK MODE TOGGLE FOR NON-AUTHENTICATED USERS */}
                  <DarkModeToggle size="sm" />
                  
                  <button 
                    onClick={handleLogin}
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-medium flex items-center space-x-2"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Conectare</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - ENHANCED with Dark Mode */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section - ENHANCED with Dark Mode */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Găsește arhiva companiei tale
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Căută în baza noastră de date pentru a găsi informațiile de contact ale instituției responsabile
            care deține arhiva unei companii româneşti.
          </p>

          {/* Search Form - ENHANCED with Dark Mode */}
          <div className="max-w-xl mx-auto">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                  placeholder="Ex: Tractorul Brașov, Steagul Roșu..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                onClick={handleSearch}
                disabled={loading || query.length < 2}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Caută...' : 'Caută'}
              </button>
            </form>
          </div>

          {/* Quick suggestions - ENHANCED with Dark Mode */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Sugestii:</span>
            {['Tractorul', 'Steagul Roșu', 'Brașov', 'Cluj'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setQuery(suggestion);
                  performSearch(suggestion, 1);
                }}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message - ENHANCED with Dark Mode */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State - ENHANCED with Dark Mode */}
        {loading && (
          <div className="max-w-4xl mx-auto text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Se caută în baza de date...</p>
          </div>
        )}

        {/* Results Section - ENHANCED with Dark Mode */}
        {hasSearched && !loading && (
          <div className="max-w-4xl mx-auto">
            {/* Results Header */}
            {totalResults > 0 && (
              <div className="mb-6 flex justify-between items-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Afișând rezultatele {startResult}-{endResult} din {totalResults} pentru "{query}"
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-500">
                  {totalResults === 1 ? '1 rezultat găsit' : `${totalResults} rezultate găsite`}
                </div>
              </div>
            )}

            {/* Results List - ENHANCED with Dark Mode */}
            {results.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Niciun rezultat găsit
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Nu am găsit nicio companie care să corespundă cu căutarea "{query}".
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-500">
                  <p>Sugestii:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Verifică ortografia</li>
                    <li>• Încearcă termeni mai generali</li>
                    <li>• Caută doar numele companiei</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((fond) => (
                  <div
                    key={fond.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-6 hover:shadow-md dark:hover:shadow-xl transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {fond.company_name}
                        </h3>
                        
                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <Archive className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{fond.holder_name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Deținător arhivă</p>
                            </div>
                          </div>

                          {fond.address && (
                            <div className="flex items-start space-x-2">
                              <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                              <p className="text-gray-700 dark:text-gray-300">{fond.address}</p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-4">
                            {fond.email && (
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <a
                                  href={`mailto:${fond.email}`}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                                >
                                  {fond.email}
                                </a>
                              </div>
                            )}

                            {fond.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <a
                                  href={`tel:${fond.phone}`}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                                >
                                  {fond.phone}
                                </a>
                              </div>
                            )}
                          </div>

                          {fond.notes && (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                              <p className="text-sm text-gray-700 dark:text-gray-300">{fond.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination - ENHANCED with Dark Mode */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center space-x-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(
                      currentPage - 2 + i,
                      totalPages - 4 + i
                    ));
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm font-medium border rounded-md ${
                          pageNum === currentPage
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Următor
                  </button>
                </nav>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer - ENHANCED with Dark Mode */}
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p className="mb-2">© 2025 Arhivare Web App - Tony Gheorghe</p>
            <p className="text-sm">
              Aplicație pentru căutarea fondurilor arhivistice româneşti
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
