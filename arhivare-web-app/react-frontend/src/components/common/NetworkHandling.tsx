// src/components/common/NetworkHandling.tsx - Complete Network Status & Error Handling
import React, { useState, useEffect, useContext, createContext, useCallback, useRef } from 'react';
import { 
  Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle, 
  X, Clock, Zap, Globe, Server, AlertCircle, TrendingUp
} from 'lucide-react';

// ===========================================
// NETWORK CONTEXT & TYPES
// ===========================================

interface NetworkState {
  isOnline: boolean;
  connectionSpeed: 'slow' | 'moderate' | 'fast' | 'unknown';
  lastOnline: Date | null;
  retryCount: number;
}

interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  timestamp: Date;
  status: 'pending' | 'success' | 'error' | 'timeout';
  retryCount: number;
  error?: string;
}

interface NetworkContextType {
  networkState: NetworkState;
  requests: NetworkRequest[];
  isRetrying: boolean;
  addRequest: (request: Omit<NetworkRequest, 'id' | 'timestamp' | 'retryCount'>) => string;
  updateRequest: (id: string, updates: Partial<NetworkRequest>) => void;
  retryFailedRequests: () => Promise<void>;
  clearRequests: () => void;
  showNetworkStatus: boolean;
  setShowNetworkStatus: (show: boolean) => void;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
};

// ===========================================
// NETWORK PROVIDER
// ===========================================

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: navigator.onLine,
    connectionSpeed: 'unknown',
    lastOnline: navigator.onLine ? new Date() : null,
    retryCount: 0
  });

  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showNetworkStatus, setShowNetworkStatus] = useState(false);
  const requestIdCounter = useRef(0);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setNetworkState(prev => ({
        ...prev,
        isOnline: true,
        lastOnline: new Date(),
        retryCount: 0
      }));
      setShowNetworkStatus(true);
      
      // Auto-retry failed requests when back online
      setTimeout(() => {
        retryFailedRequests();
      }, 1000);
    };

    const handleOffline = () => {
      setNetworkState(prev => ({
        ...prev,
        isOnline: false
      }));
      setShowNetworkStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor connection speed
  useEffect(() => {
    const measureConnectionSpeed = async () => {
      if (!navigator.onLine) return;

      try {
        const start = performance.now();
        await fetch('/favicon.ico', { cache: 'no-cache' });
        const end = performance.now();
        const duration = end - start;

        let speed: NetworkState['connectionSpeed'] = 'unknown';
        if (duration < 100) speed = 'fast';
        else if (duration < 300) speed = 'moderate';
        else speed = 'slow';

        setNetworkState(prev => ({ ...prev, connectionSpeed: speed }));
      } catch (error) {
        setNetworkState(prev => ({ ...prev, connectionSpeed: 'slow' }));
      }
    };

    const interval = setInterval(measureConnectionSpeed, 30000); // Check every 30 seconds
    measureConnectionSpeed(); // Initial check

    return () => clearInterval(interval);
  }, [networkState.isOnline]);

  // Auto-hide network status after delay
  useEffect(() => {
    if (showNetworkStatus && networkState.isOnline) {
      const timer = setTimeout(() => {
        setShowNetworkStatus(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showNetworkStatus, networkState.isOnline]);

  const addRequest = useCallback((request: Omit<NetworkRequest, 'id' | 'timestamp' | 'retryCount'>) => {
    const id = `req-${++requestIdCounter.current}`;
    const newRequest: NetworkRequest = {
      ...request,
      id,
      timestamp: new Date(),
      retryCount: 0
    };

    setRequests(prev => [newRequest, ...prev.slice(0, 49)]); // Keep last 50 requests
    return id;
  }, []);

  const updateRequest = useCallback((id: string, updates: Partial<NetworkRequest>) => {
    setRequests(prev =>
      prev.map(req =>
        req.id === id ? { ...req, ...updates } : req
      )
    );
  }, []);

  const retryFailedRequests = useCallback(async () => {
    if (!networkState.isOnline || isRetrying) return;

    const failedRequests = requests.filter(req => req.status === 'error' || req.status === 'timeout');
    if (failedRequests.length === 0) return;

    setIsRetrying(true);

    for (const request of failedRequests) {
      try {
        updateRequest(request.id, { 
          status: 'pending', 
          retryCount: request.retryCount + 1 
        });

        // Simulate retry (in real app, you'd re-execute the original request)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // For demo purposes, assume retry succeeds
        updateRequest(request.id, { status: 'success' });
      } catch (error) {
        updateRequest(request.id, { 
          status: 'error',
          error: error instanceof Error ? error.message : 'Retry failed'
        });
      }
    }

    setNetworkState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
    setIsRetrying(false);
  }, [networkState.isOnline, isRetrying, requests, updateRequest]);

  const clearRequests = useCallback(() => {
    setRequests([]);
  }, []);

  const contextValue: NetworkContextType = {
    networkState,
    requests,
    isRetrying,
    addRequest,
    updateRequest,
    retryFailedRequests,
    clearRequests,
    showNetworkStatus,
    setShowNetworkStatus
  };

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
};

// ===========================================
// ENHANCED FETCH HOOK
// ===========================================

interface UseFetchOptions extends RequestInit {
  retry?: number;
  retryDelay?: number;
  timeout?: number;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

export const useNetworkFetch = () => {
  const { networkState, addRequest, updateRequest } = useNetwork();

  const networkFetch = useCallback(async (
    url: string, 
    options: UseFetchOptions = {}
  ) => {
    const {
      retry = 3,
      retryDelay = 1000,
      timeout = 10000,
      onError,
      onSuccess,
      ...fetchOptions
    } = options;

    // Check if offline
    if (!networkState.isOnline) {
      const error = new Error('No internet connection');
      onError?.(error);
      throw error;
    }

    const requestId = addRequest({
      url,
      method: fetchOptions.method || 'GET',
      status: 'pending'
    });

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        updateRequest(requestId, { 
          status: 'pending',
          retryCount: attempt
        });

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        updateRequest(requestId, { status: 'success' });
        onSuccess?.(data);
        
        return data;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (error instanceof Error && error.name === 'AbortError') {
          updateRequest(requestId, { 
            status: 'timeout',
            error: 'Request timed out'
          });
        } else {
          updateRequest(requestId, { 
            status: 'error',
            error: lastError.message
          });
        }

        // Don't retry if offline
        if (!navigator.onLine) {
          break;
        }

        // Wait before retry
        if (attempt < retry) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }

    onError?.(lastError!);
    throw lastError;
  }, [networkState.isOnline, addRequest, updateRequest]);

  return networkFetch;
};

// ===========================================
// NETWORK STATUS COMPONENTS
// ===========================================

// Network Status Indicator
export const NetworkStatusIndicator: React.FC = () => {
  const { networkState, showNetworkStatus, setShowNetworkStatus } = useNetwork();

  if (!showNetworkStatus) return null;

  const getStatusColor = () => {
    if (!networkState.isOnline) return 'bg-red-500';
    if (networkState.connectionSpeed === 'slow') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!networkState.isOnline) return 'Offline';
    return `Online (${networkState.connectionSpeed})`;
  };

  const getIcon = () => {
    if (!networkState.isOnline) return <WifiOff className="h-5 w-5" />;
    if (networkState.connectionSpeed === 'slow') return <Wifi className="h-5 w-5 text-yellow-600" />;
    return <Wifi className="h-5 w-5 text-green-600" />;
  };

  return (
    <div className={`fixed top-4 right-4 ${getStatusColor()} text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-3 z-50 animate-slide-down`}>
      {getIcon()}
      <span className="font-medium">{getStatusText()}</span>
      <button
        onClick={() => setShowNetworkStatus(false)}
        className="text-white/80 hover:text-white ml-2"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Offline Notice
export const OfflineNotice: React.FC = () => {
  const { networkState } = useNetwork();

  if (networkState.isOnline) return null;

  return (
    <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <WifiOff className="h-5 w-5 text-orange-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-orange-700">
            <strong>Nu există conexiune la internet.</strong> 
            {networkState.lastOnline && (
              <span className="block text-xs mt-1">
                Ultima conexiune: {networkState.lastOnline.toLocaleString('ro-RO')}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

// Retry Button
export const RetryButton: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const { retryFailedRequests, isRetrying, requests } = useNetwork();
  
  const failedCount = requests.filter(r => r.status === 'error' || r.status === 'timeout').length;

  const handleRetry = () => {
    onClick?.();
    retryFailedRequests();
  };

  if (failedCount === 0) return null;

  return (
    <button
      onClick={handleRetry}
      disabled={isRetrying}
      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
      <span>
        {isRetrying ? 'Se reîncearcă...' : `Reîncearcă (${failedCount})`}
      </span>
    </button>
  );
};

// Network Requests Monitor
export const NetworkRequestsMonitor: React.FC = () => {
  const { requests, clearRequests } = useNetwork();
  const [isOpen, setIsOpen] = useState(false);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    success: requests.filter(r => r.status === 'success').length,
    error: requests.filter(r => r.status === 'error').length,
    timeout: requests.filter(r => r.status === 'timeout').length
  };

  if (requests.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 hover:bg-gray-700 transition-colors"
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm">Requests ({stats.total})</span>
        {stats.pending > 0 && (
          <div className="animate-pulse h-2 w-2 bg-blue-400 rounded-full"></div>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border w-96 max-h-80 overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Network Requests</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearRequests}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-4 border-b bg-gray-50">
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium text-blue-600">{stats.pending}</div>
                <div className="text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600">{stats.success}</div>
                <div className="text-gray-500">Success</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-red-600">{stats.error}</div>
                <div className="text-gray-500">Error</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-orange-600">{stats.timeout}</div>
                <div className="text-gray-500">Timeout</div>
              </div>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {requests.slice(0, 20).map((request) => (
              <div key={request.id} className="p-3 border-b hover:bg-gray-50 text-xs">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                        request.status === 'success' ? 'bg-green-100 text-green-800' :
                        request.status === 'error' ? 'bg-red-100 text-red-800' :
                        request.status === 'timeout' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {request.method}
                      </span>
                      <span className="text-gray-600 truncate">{request.url}</span>
                    </div>
                    
                    {request.error && (
                      <div className="text-red-600 mt-1 text-xs">{request.error}</div>
                    )}
                    
                    <div className="text-gray-500 mt-1">
                      {request.timestamp.toLocaleTimeString('ro-RO')}
                      {request.retryCount > 0 && ` (${request.retryCount} retries)`}
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-2">
                    {request.status === 'pending' && <Clock className="h-3 w-3 text-blue-500" />}
                    {request.status === 'success' && <CheckCircle className="h-3 w-3 text-green-500" />}
                    {request.status === 'error' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                    {request.status === 'timeout' && <AlertCircle className="h-3 w-3 text-orange-500" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ===========================================
// NETWORK-AWARE COMPONENTS
// ===========================================

// Smart Image Component
interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  lowQualitySrc?: string;
  fallbackSrc?: string;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  lowQualitySrc,
  fallbackSrc,
  ...props
}) => {
  const { networkState } = useNetwork();
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!networkState.isOnline) {
      setCurrentSrc(fallbackSrc || '');
      return;
    }

    if (networkState.connectionSpeed === 'slow' && lowQualitySrc) {
      setCurrentSrc(lowQualitySrc);
    } else if (src) {
      setCurrentSrc(src);
    }
  }, [networkState.isOnline, networkState.connectionSpeed, src, lowQualitySrc, fallbackSrc]);

  const handleError = () => {
    if (!hasError && fallbackSrc) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
    }
  };

  if (!networkState.isOnline && !fallbackSrc) {
    return (
      <div className="bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
        <WifiOff className="h-4 w-4 mr-2" />
        Offline
      </div>
    );
  }

  return (
    <img
      {...props}
      src={currentSrc}
      onError={handleError}
    />
  );
};

// Data Sync Status
interface DataSyncStatusProps {
  lastSync?: Date;
  isSyncing?: boolean;
  pendingChanges?: number;
}

export const DataSyncStatus: React.FC<DataSyncStatusProps> = ({
  lastSync,
  isSyncing = false,
  pendingChanges = 0
}) => {
  const { networkState } = useNetwork();

  const getSyncStatus = () => {
    if (!networkState.isOnline) {
      return { icon: WifiOff, text: 'Offline', color: 'text-red-600' };
    }
    if (isSyncing) {
      return { icon: RefreshCw, text: 'Sincronizare...', color: 'text-blue-600' };
    }
    if (pendingChanges > 0) {
      return { icon: Clock, text: `${pendingChanges} modificări în așteptare`, color: 'text-orange-600' };
    }
    return { icon: CheckCircle, text: 'Sincronizat', color: 'text-green-600' };
  };

  const { icon: Icon, text, color } = getSyncStatus();

  return (
    <div className={`flex items-center space-x-2 text-sm ${color}`}>
      <Icon className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      <span>{text}</span>
      {lastSync && (
        <span className="text-gray-500 text-xs">
          • {lastSync.toLocaleTimeString('ro-RO')}
        </span>
      )}
    </div>
  );
};

// ===========================================
// DEMO COMPONENT
// ===========================================

export const NetworkHandlingDemo: React.FC = () => {
  const networkFetch = useNetworkFetch();
  const { networkState } = useNetwork();
  const [demoRequests, setDemoRequests] = useState<string[]>([]);
  const [fetchResult, setFetchResult] = useState<string>('');

  const handleTestRequest = async (type: 'success' | 'error' | 'timeout') => {
    const urls = {
      success: 'https://httpbin.org/delay/1',
      error: 'https://httpbin.org/status/500',
      timeout: 'https://httpbin.org/delay/15'
    };

    try {
      setFetchResult('Se trimite cererea...');
      const result = await networkFetch(urls[type], {
        timeout: type === 'timeout' ? 5000 : 10000,
        retry: 2
      });
      setFetchResult(`Succes: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setFetchResult(`Eroare: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const simulateOffline = () => {
    // This would normally be handled by the browser, but for demo purposes:
    alert('Pentru a testa modul offline, folosește Developer Tools > Network > Offline');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Network Handling System Demo</h1>
        <p className="text-gray-600">Testează gestionarea network-ului și request-urilor</p>
      </div>

      {/* Network Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Status Network</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              {networkState.isOnline ? 
                <Wifi className="h-8 w-8 text-green-600" /> : 
                <WifiOff className="h-8 w-8 text-red-600" />
              }
              <div>
                <p className="font-medium">{networkState.isOnline ? 'Online' : 'Offline'}</p>
                <p className="text-sm text-gray-600">Status conexiune</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-medium capitalize">{networkState.connectionSpeed}</p>
                <p className="text-sm text-gray-600">Viteza conexiunii</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-8 w-8 text-purple-600" />
              <div>
                <p className="font-medium">{networkState.retryCount}</p>
                <p className="text-sm text-gray-600">Retry-uri efectuate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offline Notice */}
      <OfflineNotice />

      {/* Test Requests */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Test Network Requests</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => handleTestRequest('success')}
              disabled={!networkState.isOnline}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Request de Succes
            </button>
            
            <button
              onClick={() => handleTestRequest('error')}
              disabled={!networkState.isOnline}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Request cu Eroare
            </button>
            
            <button
              onClick={() => handleTestRequest('timeout')}
              disabled={!networkState.isOnline}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Request cu Timeout
            </button>

            <button
              onClick={simulateOffline}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Simulează Offline
            </button>
          </div>

          {fetchResult && (
            <div className="bg-gray-100 rounded-lg p-4">
              <h3 className="font-medium mb-2">Rezultat:</h3>
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">{fetchResult}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Data Sync Demo */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Data Sync Status</h2>
        <div className="space-y-4">
          <DataSyncStatus 
            lastSync={new Date()} 
            isSyncing={false} 
            pendingChanges={0} 
          />
          
          <DataSyncStatus 
            lastSync={new Date()} 
            isSyncing={true} 
            pendingChanges={0} 
          />
          
          <DataSyncStatus 
            lastSync={new Date(Date.now() - 5 * 60 * 1000)} 
            isSyncing={false} 
            pendingChanges={3} 
          />
        </div>
      </div>

      {/* Smart Image Demo */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Smart Image Loading</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Imagine normală</p>
            <SmartImage
              src="https://via.placeholder.com/200x150/0066cc/ffffff?text=High+Quality"
              lowQualitySrc="https://via.placeholder.com/200x150/cccccc/666666?text=Low+Quality"
              fallbackSrc="https://via.placeholder.com/200x150/eeeeee/999999?text=Offline"
              alt="Demo image"
              className="w-full h-32 object-cover rounded border"
            />
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Conexiune lentă</p>
            <div className="w-full h-32 bg-gray-200 rounded border flex items-center justify-center text-gray-500 text-sm">
              Se încarcă versiunea optimizată...
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Offline</p>
            <div className="w-full h-32 bg-gray-100 rounded border flex items-center justify-center text-gray-500 text-sm">
              <WifiOff className="h-4 w-4 mr-2" />
              Indisponibil offline
            </div>
          </div>
        </div>
      </div>

      {/* Retry Button */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Request Management</h2>
        <RetryButton />
      </div>

      {/* Implementation Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">
          💡 Implementare în aplicația ta
        </h2>
        <div className="space-y-3 text-blue-800 text-sm">
          <p><strong>1. Înfășoară aplicația:</strong> Adaugă <code>&lt;NetworkProvider&gt;</code> în App.tsx</p>
          <p><strong>2. Înlocuiește fetch:</strong> Folosește <code>useNetworkFetch()</code> pentru toate request-urile</p>
          <p><strong>3. Status indicator:</strong> Adaugă <code>&lt;NetworkStatusIndicator /&gt;</code> în layout</p>
          <p><strong>4. Offline notice:</strong> Folosește <code>&lt;OfflineNotice /&gt;</code> în pagini importante</p>
          <p><strong>5. Monitor requests:</strong> Adaugă <code>&lt;NetworkRequestsMonitor /&gt;</code> pentru debugging</p>
        </div>
      </div>

      {/* Network Status Indicator (always visible) */}
      <NetworkStatusIndicator />
      
      {/* Network Requests Monitor (always visible) */}
      <NetworkRequestsMonitor />
    </div>
  );
};
