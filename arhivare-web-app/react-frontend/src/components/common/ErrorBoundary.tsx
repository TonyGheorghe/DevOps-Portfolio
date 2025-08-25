// src/components/common/ErrorBoundary.tsx - Complete Error Boundary System
import React, { Component, ReactNode, ErrorInfo as ReactErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Mail, ExternalLink } from 'lucide-react';

// ===========================================
// ERROR BOUNDARY INTERFACES
// ===========================================

interface CustomErrorInfo {
  componentStack: string;
  additionalInfo?: Record<string, any>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: CustomErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: CustomErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: CustomErrorInfo | null;
  resetError: () => void;
  errorId: string;
}

// ===========================================
// MAIN ERROR BOUNDARY COMPONENT
// ===========================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ReactErrorInfo) {
    // Create custom error info with safe property access
    const customErrorInfo: CustomErrorInfo = {
      componentStack: errorInfo.componentStack || 'No component stack available'
    };

    this.setState({
      errorInfo: customErrorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, customErrorInfo);
    }

    // Log to external service in production (implement your logging service)
    this.logErrorToService(error, customErrorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys) {
        const prevResetKeys = prevProps.resetKeys || [];
        const hasResetKeyChanged = resetKeys.some(
          (key, idx) => prevResetKeys[idx] !== key
        );

        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      }
    }

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }
  }

  private logErrorToService = (error: Error, errorInfo: CustomErrorInfo) => {
    // In a real app, send to logging service like Sentry, LogRocket, etc.
    const errorReport = {
      message: error.message,
      stack: error.stack || 'No stack trace available',
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('user_id') || 'anonymous',
      errorId: this.state.errorId
    };

    // Example: Send to your logging endpoint
    // fetch('/api/log-error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport)
    // }).catch(console.error);

    console.error('Error Report:', errorReport);
  };

  private resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: ''
      });
    }, 100);
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error!}
          errorInfo={this.state.errorInfo}
          resetError={this.resetErrorBoundary}
          errorId={this.state.errorId}
        />
      );
    }

    return this.props.children;
  }
}

// ===========================================
// DEFAULT ERROR FALLBACK COMPONENT
// ===========================================

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  errorInfo, 
  resetError,
  errorId 
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const [reportSent, setReportSent] = React.useState(false);

  const handleReportError = async () => {
    try {
      // Simulate sending error report
      await new Promise(resolve => setTimeout(resolve, 1000));
      setReportSent(true);
      
      // In real app, send to support email or error tracking service
      const subject = `Error Report - ${errorId}`;
      const body = `Error: ${error.message}\n\nStack: ${error.stack}\n\nComponent Stack: ${errorInfo?.componentStack}\n\nError ID: ${errorId}`;
      const mailtoLink = `mailto:support@arhivare.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Open email client (optional)
      // window.open(mailtoLink);
      
    } catch (err) {
      console.error('Failed to send error report:', err);
    }
  };

  const goHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Oops! Ceva nu a mers bine
            </h1>
            <p className="text-gray-600 mb-4">
              A apărut o eroare neașteptată în aplicație. Nu-ți face griji, echipa noastră va fi notificată.
            </p>
            <p className="text-sm text-gray-500">
              Cod eroare: <code className="bg-gray-100 px-2 py-1 rounded">{errorId}</code>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button
              onClick={resetError}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Încearcă din nou</span>
            </button>

            <button
              onClick={goHome}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Home className="h-5 w-5" />
              <span>Înapoi la început</span>
            </button>

            <button
              onClick={handleReportError}
              disabled={reportSent}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="h-5 w-5" />
              <span>{reportSent ? 'Raport trimis' : 'Raportează eroarea'}</span>
            </button>
          </div>

          {/* Error Details Toggle */}
          <div className="border-t border-gray-200 pt-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              <Bug className="h-4 w-4" />
              <span>{showDetails ? 'Ascunde' : 'Arată'} detaliile tehnice</span>
            </button>

            {showDetails && (
              <div className="mt-4 text-left">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <h3 className="font-semibold text-red-800 mb-2">Mesaj eroare:</h3>
                  <p className="text-red-700 text-sm font-mono mb-4">{error.message}</p>
                  
                  {error.stack && (
                    <>
                      <h3 className="font-semibold text-red-800 mb-2">Stack trace:</h3>
                      <pre className="text-xs text-red-600 whitespace-pre-wrap mb-4 bg-red-100 p-2 rounded">
                        {error.stack}
                      </pre>
                    </>
                  )}
                  
                  {errorInfo?.componentStack && (
                    <>
                      <h3 className="font-semibold text-red-800 mb-2">Component stack:</h3>
                      <pre className="text-xs text-red-600 whitespace-pre-wrap bg-red-100 p-2 rounded">
                        {errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Help Links */}
          <div className="mt-6 text-sm text-gray-500">
            <p>Ai nevoie de ajutor?</p>
            <div className="flex justify-center space-x-4 mt-2">
              <a 
                href="mailto:support@arhivare.com" 
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <Mail className="h-4 w-4" />
                <span>Contactează suportul</span>
              </a>
              <a 
                href="/help" 
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Ajutor</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===========================================
// SPECIALIZED ERROR BOUNDARIES
// ===========================================

// Form Error Boundary
export const FormErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallback={({ resetError }) => (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Eroare în formular</h3>
            <p className="text-sm text-red-700 mt-1">
              A apărut o problemă cu formularul. Te rugăm să încerci din nou.
            </p>
          </div>
          <button
            onClick={resetError}
            className="ml-4 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Resetează
          </button>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

// Dashboard Error Boundary
export const DashboardErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallback={({ resetError }) => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard indisponibil</h2>
          <p className="text-gray-600 mb-6">
            Nu putem încărca dashboard-ul în acest moment. Te rugăm să încerci din nou.
          </p>
          <div className="space-y-3">
            <button
              onClick={resetError}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reîncarcă Dashboard
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Înapoi la căutare
            </button>
          </div>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

// Route Error Boundary
export const RouteErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallback={({ resetError }) => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagina nu se poate încărca</h2>
          <p className="text-gray-600 mb-6">
            A apărut o eroare la încărcarea acestei pagini.
          </p>
          <div className="space-y-3">
            <button
              onClick={resetError}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Încearcă din nou
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Mergi la pagina principală
            </button>
          </div>
        </div>
      </div>
    )}
    resetOnPropsChange
  >
    {children}
  </ErrorBoundary>
);

// ===========================================
// ERROR BOUNDARY HOOK
// ===========================================

export const useErrorHandler = () => {
  return React.useCallback((error: Error, errorInfo?: any) => {
    // Log error
    console.error('Manual error report:', error, errorInfo);
    
    // You can also throw the error to trigger error boundary
    throw error;
  }, []);
};

// ===========================================
// DEMO COMPONENT
// ===========================================

export const ErrorBoundaryDemo: React.FC = () => {
  const [shouldError, setShouldError] = React.useState(false);

  const CrashComponent = () => {
    if (shouldError) {
      throw new Error('Eroare demonstrație - componenta a fost crashed intenționat!');
    }
    return <div className="text-green-600">Componenta funcționează normal!</div>;
  };

  const FormCrashComponent = () => {
    const [formError, setFormError] = React.useState(false);
    
    if (formError) {
      throw new Error('Eroare în formular - validare eșuată!');
    }
    
    return (
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-2">Formular test</h3>
        <button
          onClick={() => setFormError(true)}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm"
        >
          Provoacă eroare în formular
        </button>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Error Boundary System Demo</h1>
        <p className="text-gray-600">Testează diferite tipuri de error boundaries</p>
      </div>

      {/* Main Error Boundary Demo */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">1. Error Boundary Principal</h2>
        <div className="mb-4">
          <button
            onClick={() => setShouldError(!shouldError)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 mr-4"
          >
            {shouldError ? 'Repară componenta' : 'Provoacă eroare globală'}
          </button>
        </div>
        
        <ErrorBoundary>
          <CrashComponent />
        </ErrorBoundary>
      </div>

      {/* Form Error Boundary Demo */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">2. Form Error Boundary</h2>
        <FormErrorBoundary>
          <FormCrashComponent />
        </FormErrorBoundary>
      </div>

      {/* Dashboard Error Boundary Demo */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">3. Dashboard Error Boundary</h2>
        <p className="text-sm text-gray-600 mb-4">
          Acest tip de error boundary este folosit pentru dashboard-uri întregi
        </p>
        <div className="border rounded-lg p-4 bg-gray-50">
          <p>Dashboard simulat (fără eroare)</p>
        </div>
      </div>

      {/* Implementation Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">
          💡 Cum să implementezi în aplicația ta
        </h2>
        <div className="space-y-3 text-blue-800 text-sm">
          <p><strong>1. Înfășoară ruta principală:</strong> Adaugă <code>&lt;RouteErrorBoundary&gt;</code> în App.tsx</p>
          <p><strong>2. Dashboard-uri:</strong> Înfășoară fiecare dashboard cu <code>&lt;DashboardErrorBoundary&gt;</code></p>
          <p><strong>3. Formulare:</strong> Folosește <code>&lt;FormErrorBoundary&gt;</code> pentru formulare complexe</p>
          <p><strong>4. Componente critice:</strong> Folosește <code>&lt;ErrorBoundary&gt;</code> pentru componente care pot eșua</p>
        </div>
      </div>

      {/* Code Example */}
      <div className="bg-gray-900 text-gray-100 rounded-lg p-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 text-white">Exemplu de implementare:</h3>
        <pre className="text-sm">
{`// În App.tsx
import { RouteErrorBoundary, DashboardErrorBoundary } from './components/common/ErrorBoundary';

function App() {
  return (
    <AuthProvider>
      <Router>
        <RouteErrorBoundary>
          <Routes>
            <Route 
              path="/admin" 
              element={
                <DashboardErrorBoundary>
                  <AdminDashboard />
                </DashboardErrorBoundary>
              } 
            />
            {/* Alte rute */}
          </Routes>
        </RouteErrorBoundary>
      </Router>
    </AuthProvider>
  );
}`}
        </pre>
      </div>
    </div>
  );
};
