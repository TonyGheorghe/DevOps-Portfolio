import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Download, Search, Users, Building2, Plus, Eye } from 'lucide-react';

// ===========================================
// LOADING COMPONENTS SYSTEM
// ===========================================

// Basic Loading Spinner Component
const LoadingSpinner: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'green' | 'purple' | 'gray';
  className?: string;
}> = ({ 
  size = 'md', 
  color = 'blue',
  className = '' 
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4', 
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    green: 'border-green-600', 
    purple: 'border-purple-600',
    gray: 'border-gray-600'
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    />
  );
};

// Page Loading Component (Full Screen)
const PageLoader: React.FC<{
  message?: string;
  submessage?: string;
}> = ({ 
  message = 'Se încarcă...', 
  submessage 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
        {submessage && (
          <p className="text-gray-600">{submessage}</p>
        )}
      </div>
    </div>
  );
};

// Card Loading Skeleton
const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="flex items-center space-x-4">
      <div className="rounded-full bg-gray-300 h-12 w-12"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-3 bg-gray-300 rounded"></div>
      <div className="h-3 bg-gray-300 rounded w-5/6"></div>
    </div>
  </div>
);

// Table Loading Skeleton
const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200 animate-pulse">
      <div className="h-6 bg-gray-300 rounded w-1/4"></div>
    </div>
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4 animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div key={colIndex} className="space-y-2">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Loading Button Component
const LoadingButton: React.FC<{
  isLoading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: React.ReactNode;
  loadingText?: string;
  className?: string;
}> = ({
  isLoading = false,
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon,
  loadingText,
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-400',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-400'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        isDisabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
      } ${className}`}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="xs" color={variant === 'primary' ? 'blue' : 'gray'} className="mr-2 text-white border-white" />
          {loadingText || 'Se încarcă...'}
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

// Search Loading State
const SearchLoader: React.FC<{ message?: string }> = ({ 
  message = 'Se caută în baza de date...' 
}) => (
  <div className="text-center py-12">
    <div className="inline-flex items-center space-x-3">
      <Search className="h-6 w-6 text-blue-600 animate-pulse" />
      <LoadingSpinner size="md" />
    </div>
    <p className="text-gray-600 mt-4">{message}</p>
  </div>
);

// ===========================================
// DEMO IMPLEMENTATION EXAMPLES
// ===========================================

const LoadingStatesDemo: React.FC = () => {
  const [pageLoading, setPageLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  // Demo functions
  const simulatePageLoad = () => {
    setPageLoading(true);
    setTimeout(() => setPageLoading(false), 3000);
  };

  const simulateSearch = () => {
    setSearchLoading(true);
    setTimeout(() => setSearchLoading(false), 2000);
  };

  const simulateButtonAction = () => {
    setButtonLoading(true);
    setTimeout(() => setButtonLoading(false), 2000);
  };

  const simulateTableLoad = () => {
    setTableLoading(true);
    setTimeout(() => setTableLoading(false), 2500);
  };

  if (pageLoading) {
    return <PageLoader message="Se încarcă dashboard-ul..." submessage="Vă rugăm să așteptați" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Loading States System</h1>
          <p className="text-gray-600">Demo pentru componentele de loading implementate pentru Arhivare Web App</p>
        </div>

        {/* Demo Controls */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Demo Controls</h2>
          <div className="flex flex-wrap gap-4">
            <LoadingButton
              onClick={simulatePageLoad}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Simulează Page Load
            </LoadingButton>
            
            <LoadingButton
              onClick={simulateSearch}
              variant="secondary"
              icon={<Search className="h-4 w-4" />}
            >
              Simulează Search
            </LoadingButton>
            
            <LoadingButton
              onClick={simulateTableLoad}
              variant="primary"
              icon={<Users className="h-4 w-4" />}
            >
              Simulează Table Load
            </LoadingButton>
          </div>
        </div>

        {/* Button Loading Examples */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Loading Buttons Examples</h2>
          <div className="flex flex-wrap gap-4 mb-6">
            <LoadingButton
              isLoading={buttonLoading}
              onClick={simulateButtonAction}
              icon={<Plus className="h-4 w-4" />}
              loadingText="Se creează..."
            >
              Creează Fond
            </LoadingButton>
            
            <LoadingButton
              isLoading={buttonLoading}
              onClick={simulateButtonAction}
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              loadingText="Se exportă..."
            >
              Export Date
            </LoadingButton>
            
            <LoadingButton
              isLoading={buttonLoading}
              onClick={simulateButtonAction}
              variant="danger" 
              size="sm"
              loadingText="Se șterge..."
            >
              Șterge
            </LoadingButton>
          </div>

          {/* Spinner Sizes Demo */}
          <h3 className="text-lg font-medium mb-3">Spinner Sizes</h3>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <LoadingSpinner size="xs" />
              <p className="text-xs mt-1">XS</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="sm" />
              <p className="text-xs mt-1">SM</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="md" />
              <p className="text-xs mt-1">MD</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-xs mt-1">LG</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="xl" />
              <p className="text-xs mt-1">XL</p>
            </div>
          </div>
        </div>

        {/* Search Loading */}
        {searchLoading && (
          <div className="bg-white rounded-lg shadow p-6">
            <SearchLoader message="Se caută fondurile arhivistice..." />
          </div>
        )}

        {/* Table Loading Example */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Table Loading State</h2>
          {tableLoading ? (
            <TableSkeleton rows={6} cols={5} />
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium">Fonduri Arhivistice</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Building2 className="h-8 w-8 text-blue-600" />
                        <div>
                          <h4 className="font-medium">Compania {index + 1}</h4>
                          <p className="text-sm text-gray-500">Arhiva Națională</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        📧 contact@arhiva{index + 1}.ro
                      </p>
                      <p className="text-sm text-gray-600">
                        📞 +40 21 123 456{index}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card Skeletons Example */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Card Loading Skeletons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>

        {/* Usage Examples */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            💡 Cum să implementezi în aplicația ta
          </h2>
          <div className="space-y-3 text-blue-800">
            <p><strong>1. Pentru dashboard loading:</strong> Înlocuiește loading simple cu <code>&lt;PageLoader /&gt;</code></p>
            <p><strong>2. Pentru butoane:</strong> Folosește <code>&lt;LoadingButton isLoading={{formLoading}} /&gt;</code></p>
            <p><strong>3. Pentru căutare:</strong> Afișează <code>&lt;SearchLoader /&gt;</code> când <code>loading === true</code></p>
            <p><strong>4. Pentru tabele:</strong> Condiționează între <code>&lt;TableSkeleton /&gt;</code> și datele reale</p>
            <p><strong>5. Pentru formulare:</strong> Disable toate input-urile când <code>isSubmitting === true</code></p>
          </div>
        </div>

        {/* Code Examples */}
        <div className="bg-gray-900 text-gray-100 rounded-lg p-6 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4 text-white">Exemple de Implementare:</h3>
          <pre className="text-sm">
{`// În AdminDashboard.tsx
{loading ? (
  <PageLoader 
    message="Se încarcă dashboard-ul..." 
    submessage="Vă rugăm să așteptați"
  />
) : (
  <div>
    {/* Content-ul dashboard-ului */}
  </div>
)}

// Pentru butoane în formulare
<LoadingButton
  isLoading={formLoading}
  onClick={handleSubmit}
  icon={<Save className="h-4 w-4" />}
  loadingText="Se salvează..."
>
  Salvează Fond
</LoadingButton>

// Pentru căutare
{searchLoading ? (
  <SearchLoader message="Se caută fonduri..." />
) : (
  <div>{/* Search results */}</div>
)}`}
          </pre>
        </div>

      </div>
    </div>
  );
};

export default LoadingStatesDemo;
