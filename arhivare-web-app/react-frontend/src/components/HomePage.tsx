// src/components/HomePage.tsx - Fixed Admin Login Link
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Phone, Mail, MapPin, Building2, Archive, LogIn } from 'lucide-react';
import { useAuth } from './AuthSystem';

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

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
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

  // Handle admin login navigation
  const handleAdminLogin = () => {
    if (isAuthenticated) {
      // If already authenticated, go to appropriate dashboard
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/admin/users'); // Non-admin users can view users in read-only mode
      }
    } else {
      // If not authenticated, go to login
      navigate('/login');
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const startResult = (currentPage - 1) * resultsPerPage + 1;
  const endResult = Math.min(currentPage * resultsPerPage, totalResults);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Archive className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Arhivare Web App</h1>
                <p className="text-sm text-gray-600">Căutare fonduri arhivistice româneşti</p>
              </div>
            </div>
            
            {/* Auth section */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    Bună, <span className="font-medium">{user?.username}</span>!
                  </span>
                  <button 
                    onClick={handleAdminLogin}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Archive className="h-4 w-4" />
                    <span>{user?.role === 'admin' ? 'Dashboard' : 'Utilizatori'}</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleAdminLogin}
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium flex items-center space-x-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Conectare</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Găsește arhiva companiei tale
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Căutează în baza noastră de date pentru a găsi informațiile de contact ale instituției 
            care deține arhiva unei companii româneşti.
          </p>

          {/* Search Form */}
          <div className="max-w-xl mx-auto">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                  placeholder="Ex: Tractorul Brașov, Steagul Roșu..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
                />
              </div>
              <button
                type="submit"
                onClick={handleSearch}
                disabled={loading || query.length < 2}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Caută...' : 'Caută'}
              </button>
            </form>
          </div>

          {/* Quick suggestions */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="text-sm text-gray-500">Sugestii:</span>
            {['Tractorul', 'Steagul Roșu', 'Brașov', 'Cluj'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setQuery(suggestion);
                  performSearch(suggestion, 1);
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="max-w-4xl mx-auto text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Se caută în baza de date...</p>
          </div>
        )}

        {/* Results Section */}
        {hasSearched && !loading && (
          <div className="max-w-4xl mx-auto">
            {/* Results Header */}
            {totalResults > 0 && (
              <div className="mb-6 flex justify-between items-center">
                <p className="text-gray-600">
                  Afișând rezultatele {startResult}-{endResult} din {totalResults} pentru "{query}"
                </p>
                <div className="text-sm text-gray-500">
                  {totalResults === 1 ? '1 rezultat găsit' : `${totalResults} rezultate găsite`}
                </div>
              </div>
            )}

            {/* Results List */}
            {results.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Niciun rezultat găsit
                </h3>
                <p className="text-gray-600 mb-4">
                  Nu am găsit nicio companie care să corespundă cu căutarea "{query}".
                </p>
                <div className="text-sm text-gray-500">
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
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {fond.company_name}
                        </h3>
                        
                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <Archive className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-gray-900">{fond.holder_name}</p>
                              <p className="text-sm text-gray-600">Deținător arhivă</p>
                            </div>
                          </div>

                          {fond.address && (
                            <div className="flex items-start space-x-2">
                              <MapPin className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                              <p className="text-gray-700">{fond.address}</p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-4">
                            {fond.email && (
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <a
                                  href={`mailto:${fond.email}`}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  {fond.email}
                                </a>
                              </div>
                            )}

                            {fond.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <a
                                  href={`tel:${fond.phone}`}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  {fond.phone}
                                </a>
                              </div>
                            )}
                          </div>

                          {fond.notes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-md">
                              <p className="text-sm text-gray-700">{fond.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center space-x-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Următor
                  </button>
                </nav>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
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
