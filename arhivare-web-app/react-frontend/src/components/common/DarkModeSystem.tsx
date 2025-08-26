// src/components/common/DarkModeSystem.tsx - COMPLETELY FIXED VERSION
import React, { useState, useContext, createContext, useEffect } from 'react';
import { Moon, Sun, Monitor, Palette } from 'lucide-react';

// ===========================================
// DARK MODE TYPES & CONTEXT
// ===========================================

type ThemeMode = 'light' | 'dark' | 'system';

interface DarkModeSettings {
  mode: ThemeMode;
}

interface DarkModeContextType {
  settings: DarkModeSettings;
  currentTheme: 'light' | 'dark';
  updateSettings: (settings: Partial<DarkModeSettings>) => void;
  toggleMode: () => void;
  resetSettings: () => void;
}

const defaultSettings: DarkModeSettings = {
  mode: 'light' // Default to light mode
};

const DarkModeContext = createContext<DarkModeContextType | null>(null);

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within DarkModeProvider');
  }
  return context;
};

// ===========================================
// DARK MODE PROVIDER - COMPLETELY REWRITTEN
// ===========================================

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<DarkModeSettings>(() => {
    try {
      const saved = localStorage.getItem('dark-mode-settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  // Detect system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Determine current theme based on settings
  const determineCurrentTheme = (): 'light' | 'dark' => {
    switch (settings.mode) {
      case 'dark':
        return 'dark';
      case 'light':
        return 'light';
      case 'system':
        return getSystemTheme();
      default:
        return 'light';
    }
  };

  // Apply theme to document - COMPLETELY REWRITTEN
  const applyTheme = (theme: 'light' | 'dark') => {
    const root = document.documentElement;
    const body = document.body;
    
    console.log(`🎨 Applying theme: ${theme}`);
    
    // Remove all possible theme classes
    const classesToRemove = [
      'light', 'dark', 'theme-light', 'theme-dark'
    ];
    
    classesToRemove.forEach(cls => {
      root.classList.remove(cls);
      body.classList.remove(cls);
    });
    
    // Apply the correct theme class
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.add('light');
      body.classList.add('light');
    }
    
    // Set data attributes for CSS targeting
    root.setAttribute('data-theme', theme);
    body.setAttribute('data-theme', theme);
    
    // Update meta theme-color
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
    
    console.log(`✅ Theme applied: ${theme}`);
    console.log(`📋 HTML Classes: ${root.className}`);
  };

  // Apply theme whenever settings change
  useEffect(() => {
    const theme = determineCurrentTheme();
    setCurrentTheme(theme);
    applyTheme(theme);

    // Save settings to localStorage
    localStorage.setItem('dark-mode-settings', JSON.stringify(settings));
  }, [settings]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.mode === 'system') {
        const newTheme = getSystemTheme();
        setCurrentTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.mode]);

  // Initial theme application on mount
  useEffect(() => {
    const theme = determineCurrentTheme();
    applyTheme(theme);
  }, []);

  const updateSettings = (newSettings: Partial<DarkModeSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleMode = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(settings.mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];
    
    updateSettings({ mode: nextMode });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <DarkModeContext.Provider value={{
      settings,
      currentTheme,
      updateSettings,
      toggleMode,
      resetSettings
    }}>
      {children}
    </DarkModeContext.Provider>
  );
};

// ===========================================
// ENHANCED TOGGLE BUTTON - SIMPLIFIED
// ===========================================

export const DarkModeToggle: React.FC<{
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ 
  className = '', 
  showLabel = false,
  size = 'md' 
}) => {
  const { settings, currentTheme, toggleMode } = useDarkMode();

  const sizeClasses = {
    sm: 'h-8 w-8 p-1.5',
    md: 'h-10 w-10 p-2',
    lg: 'h-12 w-12 p-2.5'
  };

  const getIcon = () => {
    switch (settings.mode) {
      case 'light':
        return <Sun className="h-full w-full" />;
      case 'dark':
        return <Moon className="h-full w-full" />;
      case 'system':
        return <Monitor className="h-full w-full" />;
      default:
        return <Sun className="h-full w-full" />;
    }
  };

  const getLabel = () => {
    switch (settings.mode) {
      case 'light':
        return 'Mod luminos';
      case 'dark':
        return 'Mod întunecat';
      case 'system':
        return 'Detectare automată';
      default:
        return 'Temă';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={toggleMode}
        className={`
          ${sizeClasses[size]}
          rounded-lg transition-all duration-300 ease-in-out
          bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300
          hover:bg-gray-300 dark:hover:bg-gray-600
          border border-gray-300 dark:border-gray-600
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          hover:scale-105 active:scale-95
        `}
        title={`${getLabel()} (Activ: ${currentTheme})`}
        aria-label={`Schimbă tema: ${getLabel()}`}
      >
        {getIcon()}
      </button>
      
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {getLabel()}
        </span>
      )}
    </div>
  );
};

// ===========================================
// DEBUG COMPONENT
// ===========================================

export const ThemeDebugger: React.FC = () => {
  const { settings, currentTheme } = useDarkMode();
  const [isExpanded, setIsExpanded] = useState(false);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-80">
      <div 
        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3 text-xs transition-all cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="font-bold text-blue-600 dark:text-blue-400">🎨 Theme Debug</div>
          <div className="px-2 py-1 rounded text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            {currentTheme.toUpperCase()}
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-3 space-y-1">
            <div>Mode: <span className="font-mono px-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100">{settings.mode}</span></div>
            <div>Active: <span className="font-mono px-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100">{currentTheme}</span></div>
            
            <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
              <div className="text-xs">HTML classes:</div>
              <div className="font-mono text-xs break-all px-1 rounded mt-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                {document.documentElement.className || '(none)'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
